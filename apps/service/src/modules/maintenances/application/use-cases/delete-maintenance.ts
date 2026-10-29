import { Injectable, Logger } from '@nestjs/common'

import { DomainStorage } from '@/core/domain/storage/domain-storage.interface'
import { StorageBucket } from '@/core/domain/storage/storage.constant'
import { Either, left, right } from '@/core/utils/Either'
import { VehicleRepository } from '@/modules/vehicles/domain/vehicle.repository'

import { MaintenanceRepository } from '../../domain/maintenance.repository'
import { MaintenanceNotFoundError } from '../errors/maintenance-not-found.error'
import { ScheduleExecutionService } from '../services/schedule-execution.service'

type Response = Either<MaintenanceNotFoundError, void>

@Injectable()
export class DeleteMaintenanceUseCase {
  private readonly logger = new Logger(DeleteMaintenanceUseCase.name)

  constructor(
    private maintenanceRepository: MaintenanceRepository,
    private vehicleRepository: VehicleRepository,
    private scheduleExecution: ScheduleExecutionService,
    private storage: DomainStorage
  ) {}

  async execute(userId: string, id: string): Promise<Response> {
    const maintenance = await this.maintenanceRepository.findById(id, userId)

    if (!maintenance) {
      return left(new MaintenanceNotFoundError())
    }

    await this.maintenanceRepository.delete(maintenance)

    const vehicle = await this.vehicleRepository.findById(
      maintenance.vehicleId,
      userId
    )

    if (vehicle) {
      await this.scheduleExecution.sync({
        userId,
        vehicle,
        current: null,
        previous: {
          ...maintenance.execution,
          scheduleIds: maintenance.scheduleIds
        }
      })
    }

    if (maintenance.invoiceUrl) {
      // O registro já saiu: um arquivo órfão não deve virar erro para o usuário
      await this.storage
        .delete(StorageBucket.MY_CAR_TRACKER, maintenance.invoiceUrl)
        .catch((error) =>
          this.logger.warn(
            `Failed to delete invoice ${maintenance.invoiceUrl}: ${error}`
          )
        )
    }

    return right(void 0)
  }
}
