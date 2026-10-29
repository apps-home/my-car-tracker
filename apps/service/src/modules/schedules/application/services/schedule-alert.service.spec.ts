import { makeSchedule } from '@test/factories/make-schedule'
import { makeUser } from '@test/factories/make-user'
import { makeVehicle } from '@test/factories/make-vehicle'
import { FakeNotifier } from '@test/notifications/fake-notifier'
import { InMemoryScheduleRepository } from '@test/repositories/in-memory-schedule.repository'
import { InMemoryUserRepository } from '@test/repositories/in-memory-user.repository'
import { FakeWebhook } from '@test/webhooks/fake-webhook'
import { beforeEach, describe, expect, it } from 'vitest'

import { NOTIFICATION_WORKFLOWS } from '@/core/domain/notifications/notification.constants'
import { WEBHOOKS } from '@/core/domain/webhooks/domain-webhook.interface'

import { ScheduleAlertService } from './schedule-alert.service'

describe('ScheduleAlertService', () => {
  let scheduleRepository: InMemoryScheduleRepository
  let userRepository: InMemoryUserRepository
  let notifier: FakeNotifier
  let webhook: FakeWebhook
  let sut: ScheduleAlertService

  const today = new Date('2026-06-01T00:00:00Z')

  beforeEach(() => {
    scheduleRepository = new InMemoryScheduleRepository()
    userRepository = new InMemoryUserRepository()
    notifier = new FakeNotifier()
    webhook = new FakeWebhook()
    sut = new ScheduleAlertService(
      scheduleRepository,
      userRepository,
      notifier,
      webhook
    )
  })

  function setup(currentOdometerKm: number) {
    const user = makeUser()
    userRepository.items.push(user)
    const vehicle = makeVehicle({
      userId: user.id,
      initialOdometerKm: 0,
      currentOdometerKm
    })
    const schedule = makeSchedule({
      userId: user.id,
      vehicleId: vehicle.id,
      lastExecutedAt: new Date('2026-03-01T00:00:00Z'),
      lastExecutedOdometerKm: 30_000
    })
    scheduleRepository.items.push(schedule)

    return { user, vehicle, schedule }
  }

  it('should notify in-app and through the webhook when the status worsens', async () => {
    const { user, vehicle, schedule } = setup(39_700)

    const summary = await sut.evaluate(
      await scheduleRepository.findAllActiveForSystem(),
      [vehicle],
      today
    )

    expect(summary).toEqual({ evaluated: 1, changed: 1, notified: 1 })
    expect(notifier.sent[0]).toMatchObject({
      workflow: NOTIFICATION_WORKFLOWS.MAINTENANCE_DUE,
      to: { subscriberId: user.id, email: user.email },
      payload: {
        scheduleId: schedule.id,
        vehicleName: vehicle.name,
        status: 'DUE_SOON',
        kmRemaining: 300
      }
    })
    expect(notifier.sent[0].payload.message).toContain('Faltam')
    expect(webhook.triggered[0].path).toBe(WEBHOOKS.MAINTENANCE_DUE)

    const saved = scheduleRepository.byId(schedule.id)
    expect(saved?.alertStatus).toBe('DUE_SOON')
    expect(saved?.lastNotifiedAt).not.toBeNull()
  })

  it('should not notify twice for the same status', async () => {
    const { vehicle } = setup(39_700)

    await sut.evaluate(
      await scheduleRepository.findAllActiveForSystem(),
      [vehicle],
      today
    )
    const second = await sut.evaluate(
      await scheduleRepository.findAllActiveForSystem(),
      [vehicle],
      today
    )

    expect(second.notified).toBe(0)
    expect(notifier.sent).toHaveLength(1)
  })

  it('should notify again when it goes from due soon to overdue', async () => {
    const { vehicle } = setup(39_700)

    await sut.evaluate(
      await scheduleRepository.findAllActiveForSystem(),
      [vehicle],
      today
    )
    vehicle.syncOdometer(40_100)
    await sut.evaluate(
      await scheduleRepository.findAllActiveForSystem(),
      [vehicle],
      today
    )

    expect(notifier.sent.map(({ payload }) => payload.status)).toEqual([
      'DUE_SOON',
      'OVERDUE'
    ])
  })

  it('should skip schedules of sold vehicles', async () => {
    const { vehicle } = setup(45_000)
    vehicle.update({ isActive: false })

    const summary = await sut.evaluate(
      await scheduleRepository.findAllActiveForSystem(),
      [vehicle],
      today
    )

    expect(summary.notified).toBe(0)
    expect(notifier.sent).toHaveLength(0)
  })

  it('should save the status without marking as notified when every channel fails', async () => {
    const { vehicle, schedule } = setup(45_000)
    notifier.result = 'failed'
    webhook.result = false

    const summary = await sut.evaluate(
      await scheduleRepository.findAllActiveForSystem(),
      [vehicle],
      today
    )

    expect(summary.notified).toBe(0)
    expect(scheduleRepository.byId(schedule.id)?.alertStatus).toBe('OVERDUE')
    expect(scheduleRepository.byId(schedule.id)?.lastNotifiedAt).toBeNull()
  })
})
