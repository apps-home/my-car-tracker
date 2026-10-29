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

describe('Expenses (E2E)', () => {
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
    vehicleExpense: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }
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
      currentOdometerKm: 20_000,
      initialOdometerKm: 10_000,
      fuelTankCapacityLiters: 50,
      defaultFuelType: 'GASOLINE_COMMON',
      photoUrl: null,
      isActive: true,
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

  it('GET /expenses — should return 401 without a session token', async () => {
    const response = await request(app.getHttpServer()).get('/expenses')

    expect(response.status).toBe(401)
  })

  it('POST /expenses — should create the expense and sync the odometer', async () => {
    const vehicle = makeRawVehicle()
    mockPrismaMyCarTracker.vehicle.findFirst.mockResolvedValue(vehicle)

    const response = await api.post('/expenses').send({
      vehicleId: vehicle.id,
      category: 'TOLL',
      date: '2026-03-15',
      amount: 12.4,
      description: 'Pedágio Bandeirantes',
      odometerKm: 20_150,
      paymentMethod: 'TAG'
    })

    expect(response.status).toBe(201)
    expect(response.body.message).toBe('Expense created successfully')

    const { data } =
      mockPrismaMyCarTracker.vehicleExpense.create.mock.calls[0][0]
    expect(data.userId).toBe(sessionUserId)
    expect(data.amount).toBe(12.4)
    expect(
      mockPrismaMyCarTracker.vehicle.update.mock.calls[0][0].data
    ).toMatchObject({ currentOdometerKm: 20_150 })
  })

  it('POST /expenses — should return 400 for an invalid category', async () => {
    const response = await api.post('/expenses').send({
      vehicleId: faker.string.uuid(),
      category: 'PIZZA',
      date: '2026-03-15',
      amount: 12.4,
      description: 'Pizza'
    })

    expect(response.status).toBe(400)
  })

  it('GET /expenses — should search in the description and route', async () => {
    mockPrismaMyCarTracker.vehicleExpense.findMany.mockResolvedValue([])

    const response = await api
      .get('/expenses')
      .query({ search: 'ponte', category: 'TOLL', year: '2026' })

    expect(response.status).toBe(200)
    expect(
      mockPrismaMyCarTracker.vehicleExpense.findMany.mock.calls[0][0].where
    ).toEqual({
      userId: sessionUserId,
      vehicleId: undefined,
      category: 'TOLL',
      date: {
        gte: new Date('2026-01-01T00:00:00Z'),
        lt: new Date('2027-01-01T00:00:00Z')
      },
      OR: [
        { description: { contains: 'ponte', mode: 'insensitive' } },
        { locationOrRoute: { contains: 'ponte', mode: 'insensitive' } }
      ]
    })
  })

  it('GET /expenses/suggestions — should require the vehicleId', async () => {
    const response = await api.get('/expenses/suggestions')

    expect(response.status).toBe(400)
  })

  it('GET /expenses/suggestions — should return the repeated expenses', async () => {
    const vehicle = makeRawVehicle()
    mockPrismaMyCarTracker.vehicle.findFirst.mockResolvedValue(vehicle)
    const raw = {
      vehicleId: vehicle.id,
      userId: sessionUserId,
      category: 'PARKING',
      date: new Date(),
      amount: { toNumber: () => 15 },
      description: 'Estacionamento do trabalho',
      locationOrRoute: null,
      odometerKm: null,
      paymentMethod: 'PIX',
      receiptUrl: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    mockPrismaMyCarTracker.vehicleExpense.findMany.mockResolvedValue([
      { ...raw, id: faker.string.uuid() },
      { ...raw, id: faker.string.uuid() }
    ])

    const response = await api
      .get('/expenses/suggestions')
      .query({ vehicleId: vehicle.id })

    expect(response.status).toBe(200)
    expect(response.body).toEqual([
      expect.objectContaining({
        category: 'PARKING',
        description: 'Estacionamento do trabalho',
        amount: 15,
        count: 2
      })
    ])
  })

  it('DELETE /expenses/:id — should return 404 for an expense of another user', async () => {
    mockPrismaMyCarTracker.vehicleExpense.findFirst.mockResolvedValue(null)

    const id = faker.string.uuid()
    const response = await api.delete(`/expenses/${id}`)

    expect(response.status).toBe(404)
    expect(response.body.message).toBe('Expense not found.')
    expect(mockPrismaMyCarTracker.vehicleExpense.delete).not.toHaveBeenCalled()
  })
})
