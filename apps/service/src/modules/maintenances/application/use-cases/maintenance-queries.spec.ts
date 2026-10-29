import { faker } from '@faker-js/faker'
import {
  makeMaintenance,
  makeMaintenanceItemPayload
} from '@test/factories/make-maintenance'
import { InMemoryMaintenanceRepository } from '@test/repositories/in-memory-maintenance.repository'
import { FakeStorage } from '@test/storage/fake-storage'
import { beforeEach, describe, expect, it } from 'vitest'

import { InvoiceNotFoundError } from '../errors/invoice-not-found.error'
import { MaintenanceNotFoundError } from '../errors/maintenance-not-found.error'
import { FindMaintenanceByIdUseCase } from './find-maintenance'
import { GetInvoiceUrlUseCase } from './get-invoice-url'
import { ListActiveWarrantiesUseCase } from './list-active-warranties'
import { ListMaintenancesUseCase } from './list-maintenances'
import { UploadInvoiceUseCase } from './upload-invoice'

describe('Maintenance queries and invoice', () => {
  let repository: InMemoryMaintenanceRepository
  let storage: FakeStorage
  const userId = faker.string.alphanumeric(32)

  beforeEach(() => {
    repository = new InMemoryMaintenanceRepository()
    storage = new FakeStorage()
  })

  it('should search by part name ("when did I change the battery?")', async () => {
    repository.items.push(
      makeMaintenance(userId, {
        title: 'Revisão',
        date: new Date('2026-02-01'),
        items: [makeMaintenanceItemPayload({ name: 'Bateria Moura 60Ah' })]
      }),
      makeMaintenance(userId, {
        title: 'Alinhamento',
        date: new Date('2026-03-01'),
        items: [makeMaintenanceItemPayload({ name: 'Alinhamento 3D' })]
      }),
      makeMaintenance(undefined, {
        items: [makeMaintenanceItemPayload({ name: 'Bateria' })]
      })
    )
    const sut = new ListMaintenancesUseCase(repository)

    const result = await sut.execute({ userId, search: 'bateria' })

    expect(result.value).toHaveLength(1)
    expect(result.value[0].items[0].name).toBe('Bateria Moura 60Ah')
    expect(
      (await sut.execute({ userId })).value.map(({ title }) => title)
    ).toEqual(['Alinhamento', 'Revisão'])
  })

  it('should list only the warranties still active', async () => {
    repository.items.push(
      makeMaintenance(userId, {
        date: new Date(),
        items: [
          makeMaintenanceItemPayload({ name: 'Bateria', warrantyMonths: 24 }),
          makeMaintenanceItemPayload({ name: 'Filtro' })
        ]
      }),
      makeMaintenance(userId, {
        date: new Date('2020-01-01'),
        items: [
          makeMaintenanceItemPayload({ name: 'Pneu', warrantyMonths: 12 })
        ]
      })
    )
    const sut = new ListActiveWarrantiesUseCase(repository)

    const result = await sut.execute({ userId })

    expect(result.value.map(({ name }) => name)).toEqual(['Bateria'])
  })

  it('should find only the maintenances of the user', async () => {
    const maintenance = makeMaintenance(userId)
    repository.items.push(maintenance)
    const sut = new FindMaintenanceByIdUseCase(repository)

    const own = await sut.execute(userId, maintenance.id)
    expect(own.isRight()).toBe(true)
    if (own.isRight()) {
      expect(own.value.hasInvoice).toBe(false)
      expect(own.value).not.toHaveProperty('invoiceUrl')
    }

    const other = await sut.execute(
      faker.string.alphanumeric(32),
      maintenance.id
    )
    expect(other.value).toBeInstanceOf(MaintenanceNotFoundError)
  })

  it('should upload the invoice to the private folder, replace the old one and sign the download', async () => {
    const maintenance = makeMaintenance(userId)
    repository.items.push(maintenance)
    const upload = new UploadInvoiceUseCase(repository, storage)
    const getUrl = new GetInvoiceUrlUseCase(repository, storage)

    expect((await getUrl.execute(userId, maintenance.id)).value).toBeInstanceOf(
      InvoiceNotFoundError
    )

    const file = {
      buffer: Buffer.from('pdf'),
      mimetype: 'application/pdf',
      originalname: 'NF.PDF'
    }
    await upload.execute({ userId, maintenanceId: maintenance.id, file })
    await upload.execute({ userId, maintenanceId: maintenance.id, file })

    const key = repository.byId(maintenance.id)?.invoiceUrl as string
    expect(key).toMatch(
      new RegExp(
        `^private/maintenances/${userId}/${maintenance.id}-[0-9a-f-]{36}\\.pdf$`
      )
    )
    expect(storage.files.size).toBe(1)

    const signed = await getUrl.execute(userId, maintenance.id)
    expect(signed.isRight() && signed.value.url).toContain(key)
  })

  it('should not upload an invoice to the maintenance of another user', async () => {
    const maintenance = makeMaintenance(userId)
    repository.items.push(maintenance)
    const sut = new UploadInvoiceUseCase(repository, storage)

    const result = await sut.execute({
      userId: faker.string.alphanumeric(32),
      maintenanceId: maintenance.id,
      file: {
        buffer: Buffer.from('x'),
        mimetype: 'image/png',
        originalname: 'a.png'
      }
    })

    expect(result.value).toBeInstanceOf(MaintenanceNotFoundError)
    expect(storage.files.size).toBe(0)
  })
})
