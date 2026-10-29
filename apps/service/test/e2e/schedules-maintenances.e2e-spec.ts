import { faker } from '@faker-js/faker'
import { type INestApplication, ValidationPipe } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import { FakeStorage } from '@test/storage/fake-storage'
import { FakeWebhook } from '@test/webhooks/fake-webhook'
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
import { DomainStorage } from '@/core/domain/storage/domain-storage.interface'
import { DomainWebhook } from '@/core/domain/webhooks/domain-webhook.interface'
import { AllExceptionsFilter } from '@/infra/http/all-exceptions.filter'

const decimal = (value: number) => ({ toNumber: () => value })

describe('Schedules and Maintenances (E2E)', () => {
  let app: INestApplication
  let api: ReturnType<typeof request.agent>
  let sessionUserId: string
  let storage: FakeStorage

  const mockPrismaAuth = {
    session: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() }
  }

  const mockPrismaMyCarTracker = {
    vehicle: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    maintenanceSchedule: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    maintenanceRecord: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    maintenanceItem: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn()
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
      currentOdometerKm: 40_000,
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

  function makeRawSchedule(vehicleId: string, override = {}) {
    return {
      id: faker.string.uuid(),
      vehicleId,
      userId: sessionUserId,
      title: 'Troca de óleo',
      description: null,
      triggerRule: 'WHICHEVER_COMES_FIRST',
      intervalMonths: 6,
      intervalKm: 10_000,
      lastExecutedAt: new Date('2026-01-01T00:00:00Z'),
      lastExecutedOdometerKm: 30_000,
      nextDueDate: new Date('2026-07-01T00:00:00Z'),
      nextDueOdometerKm: 40_000,
      alertDaysBefore: 30,
      alertKmBefore: 500,
      alertStatus: 'ON_TRACK',
      lastNotifiedAt: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...override
    }
  }

  beforeAll(async () => {
    storage = new FakeStorage()

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider('prismaAuth')
      .useValue(mockPrismaAuth)
      .overrideProvider('prismaMyCarTracker')
      .useValue(mockPrismaMyCarTracker)
      .overrideProvider(DomainJobPublisher)
      .useValue({ publish: vi.fn() })
      .overrideProvider(DomainStorage)
      .useValue(storage)
      .overrideProvider(DomainWebhook)
      .useValue(new FakeWebhook())
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
    storage.files.clear()
    sessionUserId = faker.string.alphanumeric(32)

    mockPrismaAuth.session.findUnique.mockResolvedValue({
      userId: sessionUserId,
      expiresAt: new Date(Date.now() + 60_000)
    })
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /schedules — should evaluate the status with the current km', async () => {
    const vehicle = makeRawVehicle()
    mockPrismaMyCarTracker.maintenanceSchedule.findMany.mockResolvedValue([
      makeRawSchedule(vehicle.id)
    ])
    mockPrismaMyCarTracker.vehicle.findMany.mockResolvedValue([vehicle])

    const response = await api.get('/schedules')

    expect(response.status).toBe(200)
    expect(response.body[0]).toMatchObject({
      alertStatus: 'OVERDUE',
      kmRemaining: 0
    })
    expect(response.body[0]).not.toHaveProperty('userId')
  })

  it('GET /schedules/templates — should list the default templates', async () => {
    const response = await api.get('/schedules/templates')

    expect(response.status).toBe(200)
    expect(response.body).toHaveLength(7)
  })

  it('POST /schedules/seed-defaults — should create the chosen templates', async () => {
    mockPrismaMyCarTracker.vehicle.findFirst.mockResolvedValue(makeRawVehicle())
    mockPrismaMyCarTracker.maintenanceSchedule.findMany.mockResolvedValue([])

    const response = await api.post('/schedules/seed-defaults').send({
      vehicleId: faker.string.uuid(),
      templates: ['oil-change', 'brake-fluid']
    })

    expect(response.status).toBe(201)
    expect(response.body.created).toBe(2)
    const { data } =
      mockPrismaMyCarTracker.maintenanceSchedule.createMany.mock.calls[0][0]
    expect(
      data.every((item: { userId: string }) => item.userId === sessionUserId)
    ).toBe(true)
  })

  it('POST /schedules — should return 400 for an invalid trigger rule', async () => {
    const response = await api.post('/schedules').send({
      vehicleId: faker.string.uuid(),
      title: 'Óleo',
      triggerRule: 'WHENEVER'
    })

    expect(response.status).toBe(400)
  })

  it('POST /maintenances — should save items and renew the linked schedule', async () => {
    const vehicle = makeRawVehicle()
    const schedule = makeRawSchedule(vehicle.id)
    mockPrismaMyCarTracker.vehicle.findFirst.mockResolvedValue(vehicle)
    mockPrismaMyCarTracker.maintenanceSchedule.findMany.mockResolvedValue([
      schedule
    ])

    const response = await api.post('/maintenances').send({
      vehicleId: vehicle.id,
      title: 'Troca de óleo',
      date: '2026-10-20',
      odometerKm: 40_300,
      laborCost: 80,
      items: [
        {
          name: 'Óleo 5W30',
          quantity: 4,
          unitPrice: 45,
          scheduleId: schedule.id
        },
        { name: 'Filtro de óleo', unitPrice: 35, warrantyMonths: 6 }
      ]
    })

    expect(response.status).toBe(201)

    const { data } =
      mockPrismaMyCarTracker.maintenanceRecord.create.mock.calls[0][0]
    expect(data).toMatchObject({
      userId: sessionUserId,
      partsCost: 215,
      totalAmount: 295
    })
    expect(data.items.createMany.data).toHaveLength(2)
    expect(data.items.createMany.data[1].warrantyUntil).toEqual(
      new Date('2027-04-20T00:00:00Z')
    )

    expect(
      mockPrismaMyCarTracker.vehicle.update.mock.calls[0][0].data
    ).toMatchObject({
      currentOdometerKm: 40_300
    })
    expect(
      mockPrismaMyCarTracker.maintenanceSchedule.update.mock.calls[0][0].data
    ).toMatchObject({
      lastExecutedAt: new Date('2026-10-20T00:00:00Z'),
      lastExecutedOdometerKm: 40_300,
      nextDueOdometerKm: 50_300
    })
  })

  it('POST /maintenances — should reject a schedule of another vehicle', async () => {
    const vehicle = makeRawVehicle()
    mockPrismaMyCarTracker.vehicle.findFirst.mockResolvedValue(vehicle)
    mockPrismaMyCarTracker.maintenanceSchedule.findMany.mockResolvedValue([
      makeRawSchedule(faker.string.uuid())
    ])

    const response = await api.post('/maintenances').send({
      vehicleId: vehicle.id,
      title: 'Revisão',
      date: '2026-10-20',
      odometerKm: 40_300,
      items: [{ name: 'Óleo', unitPrice: 45, scheduleId: faker.string.uuid() }]
    })

    expect(response.status).toBe(400)
    expect(
      mockPrismaMyCarTracker.maintenanceRecord.create
    ).not.toHaveBeenCalled()
  })

  it('GET /maintenances — should search in the items', async () => {
    mockPrismaMyCarTracker.maintenanceRecord.findMany.mockResolvedValue([])

    await api.get('/maintenances').query({ search: 'bateria' })

    const { where } =
      mockPrismaMyCarTracker.maintenanceRecord.findMany.mock.calls[0][0]
    expect(where.userId).toBe(sessionUserId)
    expect(where.OR[3]).toEqual({
      items: {
        some: {
          OR: [
            { name: { contains: 'bateria', mode: 'insensitive' } },
            { brand: { contains: 'bateria', mode: 'insensitive' } },
            { partNumber: { contains: 'bateria', mode: 'insensitive' } }
          ]
        }
      }
    })
  })

  it('POST /maintenances/:id/upload-invoice — should store a PDF and reject other types', async () => {
    const vehicle = makeRawVehicle()
    const raw = {
      id: faker.string.uuid(),
      vehicleId: vehicle.id,
      userId: sessionUserId,
      type: 'PREVENTIVE',
      title: 'Revisão',
      date: new Date('2026-10-01T00:00:00Z'),
      odometerKm: 39_000,
      workshopName: null,
      laborCost: decimal(100),
      partsCost: decimal(0),
      totalAmount: decimal(100),
      invoiceUrl: null,
      notes: null,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    mockPrismaMyCarTracker.maintenanceRecord.findFirst.mockResolvedValue(raw)

    const rejected = await api
      .post(`/maintenances/${raw.id}/upload-invoice`)
      .attach('file', Buffer.from('<html>'), {
        filename: 'nf.html',
        contentType: 'text/html'
      })
    expect(rejected.status).toBe(400)

    const response = await api
      .post(`/maintenances/${raw.id}/upload-invoice`)
      .attach('file', Buffer.from('%PDF'), {
        filename: 'nota.pdf',
        contentType: 'application/pdf'
      })

    expect(response.status).toBe(201)
    expect(storage.files.size).toBe(1)
    const [key] = [...storage.files.keys()]
    expect(key).toContain(
      `my-car-tracker/private/maintenances/${sessionUserId}/${raw.id}-`
    )
  })

  it('GET /maintenances/:id — should return 404 for another user', async () => {
    mockPrismaMyCarTracker.maintenanceRecord.findFirst.mockResolvedValue(null)

    const response = await api.get(`/maintenances/${faker.string.uuid()}`)

    expect(response.status).toBe(404)
    expect(response.body.message).toBe('Maintenance not found.')
  })
})
