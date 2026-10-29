import { faker } from '@faker-js/faker'
import { type INestApplication, ValidationPipe } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import request from 'supertest'
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

import { AppModule } from '@/app.module'
import { DomainJobPublisher } from '@/core/domain/queue/domain-job-publisher.interface'
import { AllExceptionsFilter } from '@/infra/http/all-exceptions.filter'

/** Imita o Decimal do Prisma, que chega com toNumber() */
function decimal(value: number) {
  return { toNumber: () => value }
}

describe('Fuel Logs (E2E)', () => {
  let app: INestApplication
  let api: ReturnType<typeof request.agent>
  let sessionUserId: string

  const mockPrismaAuth = {
    session: { findUnique: vi.fn() }
  }

  const mockPrismaMyCarTracker = {
    vehicle: {
      findFirst: vi.fn(),
      update: vi.fn()
    },
    fuelLog: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    $transaction: vi.fn()
  }

  function makeRawVehicle() {
    return {
      id: faker.string.uuid(),
      userId: sessionUserId,
      name: faker.vehicle.model(),
      brand: faker.vehicle.manufacturer(),
      model: faker.vehicle.model(),
      modelYear: 2023,
      manufactureYear: null,
      licensePlate: null,
      color: null,
      currentOdometerKm: 10_000,
      initialOdometerKm: 5_000,
      fuelTankCapacityLiters: 50,
      defaultFuelType: 'GASOLINE_COMMON',
      photoUrl: null,
      isActive: true,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  function makeRawFuelLog(vehicleId: string, odometerKm: number, date: string) {
    return {
      id: faker.string.uuid(),
      vehicleId,
      userId: sessionUserId,
      date: new Date(date),
      odometerKm,
      fuelType: 'GASOLINE_COMMON',
      liters: decimal(40),
      pricePerLiter: decimal(6),
      totalCost: decimal(240),
      isFullTank: true,
      gasStationName: null,
      paymentMethod: null,
      distanceDrivenKm: null,
      consumptionKmPerLiter: null,
      costPerKm: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider('prismaAuth')
      .useValue(mockPrismaAuth)
      .overrideProvider('prismaMyCarTracker')
      .useValue(mockPrismaMyCarTracker)
      .overrideProvider(DomainJobPublisher)
      .useValue({ publish: vi.fn() })
      .compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
      })
    )
    app.useGlobalFilters(new AllExceptionsFilter())
    await app.init()

    api = request.agent(app.getHttpServer())
    api.set('Authorization', 'Bearer valid-session-token')
  })

  beforeEach(() => {
    vi.clearAllMocks()
    sessionUserId = faker.string.alphanumeric(32)

    mockPrismaAuth.session.findUnique.mockResolvedValue({
      userId: sessionUserId,
      expiresAt: new Date(Date.now() + 60_000)
    })
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /fuel-logs — should return 401 without a session token', async () => {
    const response = await request(app.getHttpServer()).get('/fuel-logs')

    expect(response.status).toBe(401)
  })

  it('POST /fuel-logs — should create the fuel log, calculate km/L and sync the odometer', async () => {
    const vehicle = makeRawVehicle()
    mockPrismaMyCarTracker.vehicle.findFirst.mockResolvedValue(vehicle)
    mockPrismaMyCarTracker.fuelLog.findMany.mockResolvedValue([
      makeRawFuelLog(vehicle.id, 10_000, '2026-03-01')
    ])

    const response = await api.post('/fuel-logs').send({
      vehicleId: vehicle.id,
      date: '2026-03-15',
      odometerKm: 10_500,
      fuelType: 'GASOLINE_COMMON',
      liters: 40,
      pricePerLiter: 5.9
    })

    expect(response.status).toBe(201)
    expect(response.body.message).toBe('Fuel log created successfully')

    const { data } = mockPrismaMyCarTracker.fuelLog.create.mock.calls[0][0]
    expect(data.userId).toBe(sessionUserId)
    expect(data.date).toEqual(new Date('2026-03-15T00:00:00Z'))
    expect(data.totalCost).toBe(236)
    expect(data.consumptionKmPerLiter).toBe(12.5)

    expect(
      mockPrismaMyCarTracker.vehicle.update.mock.calls[0][0]
    ).toMatchObject({
      where: { id: vehicle.id, userId: sessionUserId },
      data: { currentOdometerKm: 10_500 }
    })
  })

  it('POST /fuel-logs — should return 404 for a vehicle of another user', async () => {
    mockPrismaMyCarTracker.vehicle.findFirst.mockResolvedValue(null)

    const response = await api.post('/fuel-logs').send({
      vehicleId: faker.string.uuid(),
      date: '2026-03-15',
      odometerKm: 10_500,
      fuelType: 'ETHANOL',
      liters: 40,
      pricePerLiter: 4.2
    })

    expect(response.status).toBe(404)
    expect(response.body.message).toBe('Vehicle not found.')
    expect(mockPrismaMyCarTracker.fuelLog.create).not.toHaveBeenCalled()
  })

  it('POST /fuel-logs — should return 400 for an invalid body', async () => {
    const response = await api.post('/fuel-logs').send({
      vehicleId: faker.string.uuid(),
      date: 'yesterday',
      odometerKm: 10_500,
      fuelType: 'WATER',
      liters: -1,
      pricePerLiter: 4.2
    })

    expect(response.status).toBe(400)
  })

  it('GET /fuel-logs — should apply the period filters for the session user', async () => {
    mockPrismaMyCarTracker.fuelLog.findMany.mockResolvedValue([])

    const response = await api
      .get('/fuel-logs')
      .query({ year: '2026', month: '3', fuelType: 'ETHANOL' })

    expect(response.status).toBe(200)
    expect(
      mockPrismaMyCarTracker.fuelLog.findMany.mock.calls[0][0].where
    ).toEqual({
      userId: sessionUserId,
      vehicleId: undefined,
      fuelType: 'ETHANOL',
      date: {
        gte: new Date('2026-03-01T00:00:00Z'),
        lt: new Date('2026-04-01T00:00:00Z')
      }
    })
  })

  it('GET /fuel-logs/summary — should require the vehicleId', async () => {
    const response = await api.get('/fuel-logs/summary')

    expect(response.status).toBe(400)
  })

  it('GET /fuel-logs/summary — should summarize the vehicle', async () => {
    const vehicle = makeRawVehicle()
    mockPrismaMyCarTracker.vehicle.findFirst.mockResolvedValue(vehicle)
    mockPrismaMyCarTracker.fuelLog.findMany.mockResolvedValue([
      makeRawFuelLog(vehicle.id, 10_000, '2026-03-01'),
      makeRawFuelLog(vehicle.id, 10_480, '2026-03-10')
    ])

    const response = await api
      .get('/fuel-logs/summary')
      .query({ vehicleId: vehicle.id })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      vehicleId: vehicle.id,
      count: 2,
      totalCost: 480,
      distanceKm: 480,
      consumptionKmPerLiter: 12
    })
  })

  it('GET /fuel-logs/:id — should return 404 for a fuel log of another user', async () => {
    mockPrismaMyCarTracker.fuelLog.findFirst.mockResolvedValue(null)

    const id = faker.string.uuid()
    const response = await api.get(`/fuel-logs/${id}`)

    expect(response.status).toBe(404)
    expect(
      mockPrismaMyCarTracker.fuelLog.findFirst.mock.calls[0][0].where
    ).toEqual({ id, userId: sessionUserId })
  })

  it('DELETE /fuel-logs/:id — should delete and recalculate the chain', async () => {
    const vehicle = makeRawVehicle()
    const first = makeRawFuelLog(vehicle.id, 10_000, '2026-03-01')
    const middle = makeRawFuelLog(vehicle.id, 10_200, '2026-03-05')
    const last = makeRawFuelLog(vehicle.id, 10_400, '2026-03-10')
    mockPrismaMyCarTracker.fuelLog.findFirst.mockResolvedValue(middle)
    mockPrismaMyCarTracker.fuelLog.findMany.mockResolvedValue([first, last])

    const response = await api.delete(`/fuel-logs/${middle.id}`)

    expect(response.status).toBe(200)
    expect(mockPrismaMyCarTracker.fuelLog.delete).toHaveBeenCalledWith({
      where: { id: middle.id, userId: sessionUserId }
    })
    expect(mockPrismaMyCarTracker.$transaction).toHaveBeenCalledOnce()
    expect(
      mockPrismaMyCarTracker.fuelLog.update.mock.calls[0][0]
    ).toMatchObject({
      where: { id: last.id },
      data: { distanceDrivenKm: 400, consumptionKmPerLiter: 10 }
    })
  })
})
