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

describe('Vehicles (E2E)', () => {
  let app: INestApplication

  const mockPrismaAuth = {
    session: {
      findUnique: vi.fn()
    }
  }

  const mockPrismaMyCarTracker = {
    vehicle: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }
  }

  const sessionToken = 'valid-session-token'
  let sessionUserId: string
  let api: ReturnType<typeof request.agent>

  function makeRawVehicle(override: Record<string, unknown> = {}) {
    return {
      id: faker.string.uuid(),
      userId: sessionUserId,
      name: 'Civic Touring',
      brand: 'Honda',
      model: 'Civic',
      modelYear: 2023,
      manufactureYear: 2022,
      licensePlate: 'ABC1D23',
      color: null,
      currentOdometerKm: 20_000,
      initialOdometerKm: 15_000,
      fuelTankCapacityLiters: 47,
      defaultFuelType: 'GASOLINE_COMMON',
      photoUrl: null,
      isActive: true,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...override
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
      .useValue({
        publish: vi.fn()
      })
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
    api.set('Authorization', `Bearer ${sessionToken}`)
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

  it('GET /vehicles — should return 401 without a session token', async () => {
    const response = await request(app.getHttpServer()).get('/vehicles')

    expect(response.status).toBe(401)
  })

  it('POST /vehicles — should create a vehicle for the session user', async () => {
    const response = await api.post('/vehicles').send({
      name: 'Civic Touring',
      brand: 'Honda',
      model: 'Civic',
      modelYear: 2023,
      licensePlate: 'abc-1d23',
      initialOdometerKm: 15_000
    })

    expect(response.status).toBe(201)
    expect(response.body.message).toBe('Vehicle created successfully')

    const { data } = mockPrismaMyCarTracker.vehicle.create.mock.calls[0][0]
    expect(data.userId).toBe(sessionUserId)
    expect(data.licensePlate).toBe('ABC1D23')
    expect(data.currentOdometerKm).toBe(15_000)
    expect(response.body.id).toBe(data.id)
  })

  it('POST /vehicles — should return 400 for an invalid body', async () => {
    const response = await api.post('/vehicles').send({
      name: 'Civic',
      brand: 'Honda',
      model: 'Civic',
      modelYear: 2023,
      initialOdometerKm: -5,
      userId: 'someone-else'
    })

    expect(response.status).toBe(400)
    expect(mockPrismaMyCarTracker.vehicle.create).not.toHaveBeenCalled()
  })

  it('POST /vehicles — should return 400 for a domain validation error', async () => {
    const response = await api.post('/vehicles').send({
      name: 'Civic',
      brand: 'Honda',
      model: 'Civic',
      modelYear: 2023,
      licensePlate: 'INVALID',
      initialOdometerKm: 0
    })

    expect(response.status).toBe(400)
    expect(response.body.message).toBe(
      'licensePlate must be a valid Brazilian plate'
    )
  })

  it('GET /vehicles — should list the vehicles of the session user', async () => {
    mockPrismaMyCarTracker.vehicle.findMany.mockResolvedValue([
      makeRawVehicle()
    ])

    const response = await api.get('/vehicles').query({ status: 'ACTIVE' })

    expect(response.status).toBe(200)
    expect(response.body).toHaveLength(1)
    expect(response.body[0]).not.toHaveProperty('userId')
    expect(
      mockPrismaMyCarTracker.vehicle.findMany.mock.calls[0][0].where
    ).toEqual({ userId: sessionUserId, isActive: true })
  })

  it('GET /vehicles/:id — should return 400 for a non-UUID id', async () => {
    const response = await api.get('/vehicles/not-a-uuid')

    expect(response.status).toBe(400)
  })

  it('GET /vehicles/:id — should return 404 for a vehicle of another user', async () => {
    mockPrismaMyCarTracker.vehicle.findFirst.mockResolvedValue(null)

    const id = faker.string.uuid()
    const response = await api.get(`/vehicles/${id}`)

    expect(response.status).toBe(404)
    expect(response.body.message).toBe('Vehicle not found.')
    expect(
      mockPrismaMyCarTracker.vehicle.findFirst.mock.calls[0][0].where
    ).toEqual({ id, userId: sessionUserId })
  })

  it('PATCH /vehicles/:id — should update the vehicle', async () => {
    const raw = makeRawVehicle()
    mockPrismaMyCarTracker.vehicle.findFirst.mockResolvedValue(raw)

    const response = await api
      .patch(`/vehicles/${raw.id}`)
      .send({ isActive: false, color: null })

    expect(response.status).toBe(200)

    const { where, data } =
      mockPrismaMyCarTracker.vehicle.update.mock.calls[0][0]
    expect(where).toEqual({ id: raw.id, userId: sessionUserId })
    expect(data.isActive).toBe(false)
    expect(data.color).toBeNull()
  })

  it('DELETE /vehicles/:id — should delete the vehicle', async () => {
    const raw = makeRawVehicle()
    mockPrismaMyCarTracker.vehicle.findFirst.mockResolvedValue(raw)

    const response = await api.delete(`/vehicles/${raw.id}`)

    expect(response.status).toBe(200)
    expect(mockPrismaMyCarTracker.vehicle.delete).toHaveBeenCalledWith({
      where: { id: raw.id, userId: sessionUserId }
    })
  })
})
