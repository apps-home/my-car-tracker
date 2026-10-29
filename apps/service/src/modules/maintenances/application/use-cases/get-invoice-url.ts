import { Injectable } from '@nestjs/common'

import { DomainStorage } from '@/core/domain/storage/domain-storage.interface'
import { StorageBucket } from '@/core/domain/storage/storage.constant'
import { Either, left, right } from '@/core/utils/Either'

import { MaintenanceRepository } from '../../domain/maintenance.repository'
import { InvoiceNotFoundError } from '../errors/invoice-not-found.error'
import { MaintenanceNotFoundError } from '../errors/maintenance-not-found.error'

/** Validade do link de download, em segundos */
const INVOICE_URL_TTL = 10 * 60

type Response = Either<
  MaintenanceNotFoundError | InvoiceNotFoundError,
  { url: string; expiresIn: number }
>

@Injectable()
export class GetInvoiceUrlUseCase {
  constructor(
    private maintenanceRepository: MaintenanceRepository,
    private storage: DomainStorage
  ) {}

  async execute(userId: string, maintenanceId: string): Promise<Response> {
    const maintenance = await this.maintenanceRepository.findById(
      maintenanceId,
      userId
    )

    if (!maintenance) {
      return left(new MaintenanceNotFoundError())
    }

    if (!maintenance.invoiceUrl) {
      return left(new InvoiceNotFoundError())
    }

    const url = await this.storage.getSignedUrl(
      StorageBucket.MY_CAR_TRACKER,
      maintenance.invoiceUrl,
      INVOICE_URL_TTL
    )

    return right({ url, expiresIn: INVOICE_URL_TTL })
  }
}
