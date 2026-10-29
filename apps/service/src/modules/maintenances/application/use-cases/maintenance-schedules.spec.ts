import { faker } from '@faker-js/faker'
import { FakeEventPublisher } from '@test/events/fake-event-publisher'
import {
  makeMaintenanceItemPayload,
  makeMaintenancePayload
} from '@test/factories/make-maintenance'
import { makeSchedule } from '@test/factories/make-schedule'
import { makeVehicle } from '@test/factories/make-vehicle'
import { FakeNotifier } from '@test/notifications/fake-notifier'
import { InMemoryMaintenanceRepository } from '@test/repositories/in-memory-maintenance.repository'
import { InMemoryScheduleRepository } from '@test/repositories/in-memory-schedule.repository'
import { InMemoryUserRepository } from '@test/repositories/in-memory-user.repository'
import { InMemoryVehicleRepository } from '@test/repositories/in-memory-vehicle.repository'
import { FakeStorage } from '@test/storage/fake-storage'
import { FakeWebhook } from '@test/webhooks/fake-webhook'
import { beforeEach, describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'
import {
  addDaysUtc,
  addMonthsUtc,
  todayInTimeZone
} from '@/core/utils/utc-date'
import { ScheduleAlertService } from '@/modules/schedules/application/services/schedule-alert.service'
import type { MaintenanceSchedule } from '@/modules/schedules/domain/schedule.entity'
import { VehicleNotFoundError } from '@/modules/vehicles/application/errors/vehicle-not-found.error'
import { SyncVehicleOdometerService } from '@/modules/vehicles/application/services/sync-vehicle-odometer'
import type { Vehicle } from '@/modules/vehicles/domain/vehicle.entity'

import { MaintenanceNotFoundError } from '../errors/maintenance-not-found.error'
import { ScheduleExecutionService } from '../services/schedule-execution.service'
import { CreateMaintenanceUseCase } from './create-maintenance'
import { DeleteMaintenanceUseCase } from './delete-maintenance'
import { UpdateMaintenanceUseCase } from './update-maintenance'

describe('Maintenance use cases (create, update, delete)', () => {
  let maintenanceRepository: InMemoryMaintenanceRepository
  let scheduleRepository: InMemoryScheduleRepository
  let vehicleRepository: InMemoryVehicleRepository
  let storage: FakeStorage
  let create: CreateMaintenanceUseCase
  let update: UpdateMaintenanceUseCase
  let remove: DeleteMaintenanceUseCase
  let vehicle: Vehicle
  let oilChange: MaintenanceSchedule

  beforeEach(() => {
    maintenanceRepository = new InMemoryMaintenanceRepository()
    scheduleRepository = new InMemoryScheduleRepository()
    vehicleRepository = new InMemoryVehicleRepository()
    storage = new FakeStorage()

    const syncOdometer = new SyncVehicleOdometerService(
      vehicleRepository,
      new FakeEventPublisher()
    )
    const execution = new ScheduleExecutionService(
      scheduleRepository,
      maintenanceRepository,
      new ScheduleAlertService(
        scheduleRepository,
        new InMemoryUserRepository(),
        new FakeNotifier(),
        new FakeWebhook()
      )
    )

    create = new CreateMaintenanceUseCase(
      maintenanceRepository,
      vehicleRepository,
      syncOdometer,
      execution
    )
    update = new UpdateMaintenanceUseCase(
      maintenanceRepository,
      vehicleRepository,
      syncOdometer,
      execution
    )
    remove = new DeleteMaintenanceUseCase(
      maintenanceRepository,
      vehicleRepository,
      execution,
      storage
    )

    vehicle = makeVehicle({
      initialOdometerKm: 20_000,
      currentOdometerKm: 40_000
    })
    vehicleRepository.items.push(vehicle)

    oilChange = makeSchedule({
      userId: vehicle.userId,
      vehicleId: vehicle.id,
      lastExecutedAt: new Date('2025-11-01T00:00:00Z'),
      lastExecutedOdometerKm: 31_000,
      intervalMonths: 6,
      intervalKm: 10_000,
      alertStatus: 'OVERDUE'
    })
    scheduleRepository.items.push(oilChange)
  })

  function payload(date: string, odometerKm: number, linked = true) {
    return makeMaintenancePayload({
      vehicleId: vehicle.id,
      date: new Date(date),
      odometerKm,
      items: [
        makeMaintenanceItemPayload({
          name: 'Óleo 5W30',
          scheduleId: linked ? oilChange.id : null
        })
      ]
    })
  }

  it('should renew the linked schedule and sync the odometer', async () => {
    const date = addDaysUtc(todayInTimeZone(), -10)

    const result = await create.execute(
      vehicle.userId,
      payload(date.toISOString(), 41_200)
    )

    expect(result.isRight()).toBe(true)
    const schedule = scheduleRepository.byId(oilChange.id)
    expect(schedule?.lastExecutedAt).toEqual(date)
    expect(schedule?.nextDueOdometerKm).toBe(51_200)
    expect(schedule?.nextDueDate).toEqual(addMonthsUtc(date, 6))
    expect(schedule?.alertStatus).toBe('ON_TRACK')
    expect(vehicleRepository.items[0].currentOdometerKm).toBe(41_200)
  })

  it('should not move the cycle back with an older maintenance', async () => {
    await create.execute(vehicle.userId, payload('2025-06-01', 25_000))

    expect(scheduleRepository.byId(oilChange.id)?.lastExecutedOdometerKm).toBe(
      31_000
    )
  })

  it('should recalculate the schedule when the source maintenance changes or is deleted', async () => {
    await create.execute(vehicle.userId, payload('2026-01-15', 33_000))
    const latest = await create.execute(
      vehicle.userId,
      payload('2026-05-10', 39_500)
    )
    const latestId = latest.isRight() ? latest.value.id : ''

    await update.execute(vehicle.userId, latestId, { odometerKm: 39_800 })
    expect(scheduleRepository.byId(oilChange.id)?.lastExecutedOdometerKm).toBe(
      39_800
    )

    await remove.execute(vehicle.userId, latestId)
    expect(scheduleRepository.byId(oilChange.id)?.lastExecutedOdometerKm).toBe(
      33_000
    )
  })

  it('should reject a schedule of another vehicle', async () => {
    const other = makeSchedule({ userId: vehicle.userId })
    scheduleRepository.items.push(other)

    const result = await create.execute(
      vehicle.userId,
      makeMaintenancePayload({
        vehicleId: vehicle.id,
        odometerKm: 40_000,
        items: [makeMaintenanceItemPayload({ scheduleId: other.id })]
      })
    )

    expect(result.value).toBeInstanceOf(PayloadError)
    expect(maintenanceRepository.items).toHaveLength(0)
  })

  it('should reject an odometer below the vehicle initial odometer', async () => {
    const result = await create.execute(
      vehicle.userId,
      payload('2026-05-10', 10_000)
    )

    expect(result.value).toBeInstanceOf(PayloadError)
  })

  it('should keep other users out (create, update and delete)', async () => {
    const stranger = faker.string.alphanumeric(32)

    const created = await create.execute(
      stranger,
      payload('2026-05-10', 41_000)
    )
    expect(created.value).toBeInstanceOf(VehicleNotFoundError)

    const own = await create.execute(
      vehicle.userId,
      payload('2026-05-10', 41_000, false)
    )
    const id = own.isRight() ? own.value.id : ''

    expect(
      (await update.execute(stranger, id, { title: 'x' })).value
    ).toBeInstanceOf(MaintenanceNotFoundError)
    expect((await remove.execute(stranger, id)).value).toBeInstanceOf(
      MaintenanceNotFoundError
    )
    expect(maintenanceRepository.items).toHaveLength(1)
  })

  it('should delete the invoice file with the maintenance', async () => {
    const own = await create.execute(
      vehicle.userId,
      payload('2026-05-10', 41_000, false)
    )
    const id = own.isRight() ? own.value.id : ''
    const stored = maintenanceRepository.byId(id)
    stored?.attachInvoice('private/maintenances/x/nf.pdf')
    await storage.upload(
      'my-car-tracker',
      'private/maintenances/x/nf.pdf',
      Buffer.from('pdf'),
      'application/pdf'
    )

    await remove.execute(vehicle.userId, id)

    expect(storage.files.size).toBe(0)
  })
})
