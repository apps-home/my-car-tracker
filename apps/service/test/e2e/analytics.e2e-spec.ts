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

const decimal = (value: number) => ({ toNumber: () => value })

describe('Analytics (E2E)', () => {
	let app: INestApplication
	let api: ReturnType<typeof request.agent>
	let sessionUserId: string

	const mockPrismaAuth = {
		session: { findUnique: vi.fn() }
	}

	const mockPrismaMyCarTracker = {
		vehicle: {
			findFirst: vi.fn()
		},
		fuelLog: {
			findMany: vi.fn()
		},
		vehicleExpense: {
			findMany: vi.fn()
		},
		maintenanceRecord: {
			findMany: vi.fn()
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
			currentOdometerKm: 15_000,
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

	afterAll(async () => {
		await app.close()
	})

	beforeEach(() => {
		vi.resetAllMocks()
		sessionUserId = faker.string.uuid()
		mockPrismaAuth.session.findUnique.mockResolvedValue({
			userId: sessionUserId,
			expiresAt: new Date(Date.now() + 86_400_000)
		})
	})

	it('GET /analytics/overview returns TCO overview for the authenticated user vehicle', async () => {
		const rawVehicle = makeRawVehicle()
		mockPrismaMyCarTracker.vehicle.findFirst.mockResolvedValue(rawVehicle)
		mockPrismaMyCarTracker.fuelLog.findMany.mockResolvedValue([
			{
				id: faker.string.uuid(),
				vehicleId: rawVehicle.id,
				userId: sessionUserId,
				date: new Date('2026-01-10T00:00:00Z'),
				odometerKm: 10_500,
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
		])
		mockPrismaMyCarTracker.vehicleExpense.findMany.mockResolvedValue([
			{
				id: faker.string.uuid(),
				vehicleId: rawVehicle.id,
				userId: sessionUserId,
				category: 'IPVA',
				date: new Date('2026-01-15T00:00:00Z'),
				amount: decimal(1000),
				description: 'IPVA 2026',
				locationOrRoute: null,
				odometerKm: null,
				paymentMethod: 'PIX',
				receiptUrl: null,
				notes: null,
				createdAt: new Date(),
				updatedAt: new Date()
			}
		])
		mockPrismaMyCarTracker.maintenanceRecord.findMany.mockResolvedValue([
			{
				id: faker.string.uuid(),
				vehicleId: rawVehicle.id,
				userId: sessionUserId,
				type: 'PREVENTIVE',
				title: 'Troca de óleo',
				date: new Date('2026-02-01T00:00:00Z'),
				odometerKm: 12_000,
				workshopName: null,
				laborCost: decimal(100),
				partsCost: decimal(260),
				totalAmount: decimal(360),
				invoiceUrl: null,
				notes: null,
				items: [],
				createdAt: new Date(),
				updatedAt: new Date()
			}
		])

		const response = await api.get(
			`/analytics/overview?vehicleId=${rawVehicle.id}`
		)

		expect(response.status).toBe(200)
		expect(response.body.totalCost).toBe(1600)
		expect(response.body.distanceDrivenKm).toBe(5000)
		expect(response.body.totalCostPerKm).toBe(0.32)
		expect(response.body.maintenanceBreakdown.totalAmount).toBe(360)
	})

	it('GET /analytics/overview returns 404 when vehicle does not belong to user', async () => {
		mockPrismaMyCarTracker.vehicle.findFirst.mockResolvedValue(null)

		const response = await api.get(
			`/analytics/overview?vehicleId=${faker.string.uuid()}`
		)

		expect(response.status).toBe(404)
	})

	it('GET /analytics/monthly-costs returns 12 monthly buckets for the year', async () => {
		const rawVehicle = makeRawVehicle()
		mockPrismaMyCarTracker.vehicle.findFirst.mockResolvedValue(rawVehicle)
		mockPrismaMyCarTracker.fuelLog.findMany.mockResolvedValue([])
		mockPrismaMyCarTracker.vehicleExpense.findMany.mockResolvedValue([
			{
				id: faker.string.uuid(),
				vehicleId: rawVehicle.id,
				userId: sessionUserId,
				category: 'TOLL',
				date: new Date('2026-03-05T00:00:00Z'),
				amount: decimal(42.5),
				description: 'Pedágio',
				locationOrRoute: null,
				odometerKm: null,
				paymentMethod: 'TAG',
				receiptUrl: null,
				notes: null,
				createdAt: new Date(),
				updatedAt: new Date()
			}
		])
		mockPrismaMyCarTracker.maintenanceRecord.findMany.mockResolvedValue([])

		const response = await api.get(
			`/analytics/monthly-costs?vehicleId=${rawVehicle.id}&year=2026`
		)

		expect(response.status).toBe(200)
		expect(response.body.year).toBe(2026)
		expect(response.body.yearTotal).toBe(42.5)
		expect(response.body.months).toHaveLength(12)
		expect(response.body.months[2].road).toBe(42.5)
	})
})

