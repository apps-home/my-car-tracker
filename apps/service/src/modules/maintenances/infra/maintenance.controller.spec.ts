import { faker } from '@faker-js/faker'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { makeMaintenancePayload } from '@test/factories/make-maintenance'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { left, right } from '@/core/utils/Either'

import { InvoiceNotFoundError } from '../application/errors/invoice-not-found.error'
import { CreateMaintenanceUseCase } from '../application/use-cases/create-maintenance'
import { DeleteMaintenanceUseCase } from '../application/use-cases/delete-maintenance'
import { FindMaintenanceByIdUseCase } from '../application/use-cases/find-maintenance'
import { GetInvoiceUrlUseCase } from '../application/use-cases/get-invoice-url'
import { ListActiveWarrantiesUseCase } from '../application/use-cases/list-active-warranties'
import { ListMaintenancesUseCase } from '../application/use-cases/list-maintenances'
import { UpdateMaintenanceUseCase } from '../application/use-cases/update-maintenance'
import { UploadInvoiceUseCase } from '../application/use-cases/upload-invoice'
import {
  isInvoiceMimeType,
  MaintenanceController
} from './maintenance.controller'

describe('MaintenanceController', () => {
  let controller: MaintenanceController
  const createMaintenance = { execute: vi.fn() }
  const uploadInvoice = { execute: vi.fn() }
  const getInvoiceUrl = { execute: vi.fn() }
  const noop = { execute: vi.fn() }

  beforeEach(async () => {
    vi.clearAllMocks()

    const module = await Test.createTestingModule({
      controllers: [MaintenanceController],
      providers: [
        { provide: CreateMaintenanceUseCase, useValue: createMaintenance },
        { provide: ListMaintenancesUseCase, useValue: noop },
        { provide: ListActiveWarrantiesUseCase, useValue: noop },
        { provide: FindMaintenanceByIdUseCase, useValue: noop },
        { provide: UpdateMaintenanceUseCase, useValue: noop },
        { provide: DeleteMaintenanceUseCase, useValue: noop },
        { provide: UploadInvoiceUseCase, useValue: uploadInvoice },
        { provide: GetInvoiceUrlUseCase, useValue: getInvoiceUrl }
      ]
    }).compile()

    controller = module.get(MaintenanceController)
  })

  it('should answer with the id when the maintenance is created', async () => {
    const id = faker.string.uuid()
    createMaintenance.execute.mockResolvedValue(right({ id }))

    expect(
      await controller.create(
        makeMaintenancePayload(),
        faker.string.alphanumeric(32)
      )
    ).toEqual({ message: 'Maintenance created successfully', id })
  })

  it('should throw BadRequestException on PayloadError', async () => {
    createMaintenance.execute.mockResolvedValue(
      left(new PayloadError('Invalid'))
    )

    await expect(
      controller.create(makeMaintenancePayload(), faker.string.alphanumeric(32))
    ).rejects.toThrow(BadRequestException)
  })

  it('should require the invoice file', async () => {
    await expect(
      controller.uploadInvoice(
        faker.string.uuid(),
        undefined as unknown as Express.Multer.File,
        faker.string.alphanumeric(32)
      )
    ).rejects.toThrow(BadRequestException)
    expect(uploadInvoice.execute).not.toHaveBeenCalled()
  })

  it('should answer 404 when there is no invoice', async () => {
    getInvoiceUrl.execute.mockResolvedValue(left(new InvoiceNotFoundError()))

    await expect(
      controller.invoice(faker.string.uuid(), faker.string.alphanumeric(32))
    ).rejects.toThrow(NotFoundException)
  })

  it('should accept images and PDFs as invoices', () => {
    expect(isInvoiceMimeType('image/jpeg')).toBe(true)
    expect(isInvoiceMimeType('application/pdf')).toBe(true)
    expect(isInvoiceMimeType('text/html')).toBe(false)
  })
})
