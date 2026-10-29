import { FakeEventPublisher } from '@test/events/fake-event-publisher'
import { makeVehicle } from '@test/factories/make-vehicle'
import { InMemoryVehicleRepository } from '@test/repositories/in-memory-vehicle.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { DOMAIN_EVENTS } from '@/core/domain/events/event.constants'

import { SyncVehicleOdometerService } from './sync-vehicle-odometer'

describe('SyncVehicleOdometerService', () => {
  let vehicleRepository: InMemoryVehicleRepository
  let eventPublisher: FakeEventPublisher
  let sut: SyncVehicleOdometerService

  beforeEach(() => {
    vehicleRepository = new InMemoryVehicleRepository()
    eventPublisher = new FakeEventPublisher()
    sut = new SyncVehicleOdometerService(vehicleRepository, eventPublisher)
  })

  it('should save the higher odometer and publish the event', async () => {
    const vehicle = makeVehicle({
      initialOdometerKm: 0,
      currentOdometerKm: 10_000
    })
    vehicleRepository.items.push(vehicle)

    const updated = await sut.execute(vehicle, 10_250)

    expect(updated).toBe(true)
    expect(vehicleRepository.items[0].currentOdometerKm).toBe(10_250)
    expect(eventPublisher.published).toEqual([
      {
        event: DOMAIN_EVENTS.VEHICLE_ODOMETER_UPDATED,
        payload: {
          vehicleId: vehicle.id,
          userId: vehicle.userId,
          currentOdometerKm: 10_250
        }
      }
    ])
  })

  it('should do nothing for a lower odometer', async () => {
    const vehicle = makeVehicle({
      initialOdometerKm: 0,
      currentOdometerKm: 10_000
    })
    vehicleRepository.items.push(vehicle)

    const updated = await sut.execute(vehicle, 9_000)

    expect(updated).toBe(false)
    expect(vehicleRepository.items[0].currentOdometerKm).toBe(10_000)
    expect(eventPublisher.published).toHaveLength(0)
  })
})
