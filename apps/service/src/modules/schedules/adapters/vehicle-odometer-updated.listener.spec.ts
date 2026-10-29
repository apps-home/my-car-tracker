import { makeSchedule } from '@test/factories/make-schedule'
import { makeUser } from '@test/factories/make-user'
import { makeVehicle } from '@test/factories/make-vehicle'
import { FakeNotifier } from '@test/notifications/fake-notifier'
import { InMemoryScheduleRepository } from '@test/repositories/in-memory-schedule.repository'
import { InMemoryUserRepository } from '@test/repositories/in-memory-user.repository'
import { InMemoryVehicleRepository } from '@test/repositories/in-memory-vehicle.repository'
import { FakeWebhook } from '@test/webhooks/fake-webhook'
import { beforeEach, describe, expect, it } from 'vitest'

import { todayInTimeZone } from '@/core/utils/utc-date'

import { ScheduleAlertService } from '../application/services/schedule-alert.service'
import { EvaluateMaintenanceSchedulesCron } from './evaluate-maintenance-schedules.cron'
import { VehicleOdometerUpdatedListener } from './vehicle-odometer-updated.listener'

describe('Schedule adapters', () => {
  let scheduleRepository: InMemoryScheduleRepository
  let vehicleRepository: InMemoryVehicleRepository
  let notifier: FakeNotifier
  let alertService: ScheduleAlertService

  beforeEach(() => {
    scheduleRepository = new InMemoryScheduleRepository()
    vehicleRepository = new InMemoryVehicleRepository()
    const userRepository = new InMemoryUserRepository()
    notifier = new FakeNotifier()
    alertService = new ScheduleAlertService(
      scheduleRepository,
      userRepository,
      notifier,
      new FakeWebhook()
    )

    const user = makeUser()
    userRepository.items.push(user)
  })

  function setup(
    currentOdometerKm: number,
    lastExecutedAt = todayInTimeZone()
  ) {
    const vehicle = makeVehicle({ initialOdometerKm: 0, currentOdometerKm })
    vehicleRepository.items.push(vehicle)
    const schedule = makeSchedule({
      userId: vehicle.userId,
      vehicleId: vehicle.id,
      lastExecutedAt,
      lastExecutedOdometerKm: 30_000
    })
    scheduleRepository.items.push(schedule)
    return { vehicle, schedule }
  }

  it('should evaluate the vehicle schedules when the odometer goes up', async () => {
    const { vehicle, schedule } = setup(40_200)
    const sut = new VehicleOdometerUpdatedListener(
      scheduleRepository,
      vehicleRepository,
      alertService
    )

    await sut.handle({
      vehicleId: vehicle.id,
      userId: vehicle.userId,
      currentOdometerKm: 40_200
    })

    expect(scheduleRepository.byId(schedule.id)?.alertStatus).toBe('OVERDUE')
    expect(notifier.sent).toHaveLength(1)
  })

  it('should evaluate every active schedule in the daily cron', async () => {
    // Executado há 7 meses: vencido pelo tempo, mesmo sem rodar
    const lastExecutedAt = new Date(todayInTimeZone())
    lastExecutedAt.setUTCMonth(lastExecutedAt.getUTCMonth() - 7)
    const { schedule } = setup(30_100, lastExecutedAt)
    const sold = setup(30_100, lastExecutedAt)
    scheduleRepository.inactiveVehicleIds.add(sold.vehicle.id)

    const sut = new EvaluateMaintenanceSchedulesCron(
      scheduleRepository,
      vehicleRepository,
      alertService
    )

    await sut.run()

    expect(scheduleRepository.byId(schedule.id)?.alertStatus).toBe('OVERDUE')
    expect(scheduleRepository.byId(sold.schedule.id)?.alertStatus).toBe(
      'ON_TRACK'
    )
    expect(notifier.sent).toHaveLength(1)
  })
})
