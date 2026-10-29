import { randomUUID } from 'node:crypto'
import { extname } from 'node:path'
import { Injectable, Logger } from '@nestjs/common'

import { DomainStorage } from '@/core/domain/storage/domain-storage.interface'
import {
  StorageBucket,
  StorageFolder
} from '@/core/domain/storage/storage.constant'
import { Either, left, right } from '@/core/utils/Either'

import { MaintenanceRepository } from '../../domain/maintenance.repository'
import { MaintenanceNotFoundError } from '../errors/maintenance-not-found.error'

interface UploadInvoiceRequest {
  userId: string
  maintenanceId: string
  file: { buffer: Buffer; mimetype: string; originalname: string }
}

type Response = Either<MaintenanceNotFoundError | Error, void>

/** Nota fiscal / OS na pasta privada do R2; substitui (e apaga) a anterior */
@Injectable()
export class UploadInvoiceUseCase {
  private readonly logger = new Logger(UploadInvoiceUseCase.name)

  constructor(
    private maintenanceRepository: MaintenanceRepository,
    private storage: DomainStorage
  ) {}

  async execute({
    userId,
    maintenanceId,
    file
  }: UploadInvoiceRequest): Promise<Response> {
    const maintenance = await this.maintenanceRepository.findById(
      maintenanceId,
      userId
    )

    if (!maintenance) {
      return left(new MaintenanceNotFoundError())
    }

    const key = [
      StorageFolder.PRIVATE,
      StorageFolder.MAINTENANCES,
      userId,
      `${maintenance.id}-${randomUUID()}${extname(file.originalname).toLowerCase()}`
    ].join('/')

    try {
      await this.storage.upload(
        StorageBucket.MY_CAR_TRACKER,
        key,
        file.buffer,
        file.mimetype
      )
    } catch (error) {
      return left(error)
    }

    const previousKey = maintenance.invoiceUrl

    maintenance.attachInvoice(key)
    await this.maintenanceRepository.save(maintenance)

    if (previousKey && previousKey !== key) {
      await this.storage
        .delete(StorageBucket.MY_CAR_TRACKER, previousKey)
        .catch((error) =>
          this.logger.warn(`Failed to delete invoice ${previousKey}: ${error}`)
        )
    }

    return right(void 0)
  }
}
