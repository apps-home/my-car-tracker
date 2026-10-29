import { Module } from '@nestjs/common'

import { MaintenanceScheduleModule } from '../schedules/schedule.module'
import { VehicleModule } from '../vehicles/vehicle.module'
import { ScheduleExecutionService } from './application/services/schedule-execution.service'
import { CreateMaintenanceUseCase } from './application/use-cases/create-maintenance'
import { DeleteMaintenanceUseCase } from './application/use-cases/delete-maintenance'
import { FindMaintenanceByIdUseCase } from './application/use-cases/find-maintenance'
import { GetInvoiceUrlUseCase } from './application/use-cases/get-invoice-url'
import { ListActiveWarrantiesUseCase } from './application/use-cases/list-active-warranties'
import { ListMaintenancesUseCase } from './application/use-cases/list-maintenances'
import { UpdateMaintenanceUseCase } from './application/use-cases/update-maintenance'
import { UploadInvoiceUseCase } from './application/use-cases/upload-invoice'
import { MaintenanceRepository } from './domain/maintenance.repository'
import { MaintenanceController } from './infra/maintenance.controller'
import { PrismaMaintenanceRepository } from './infra/repositories/prisma.maintenance.repository'

@Module({
  imports: [VehicleModule, MaintenanceScheduleModule],
  controllers: [MaintenanceController],
  providers: [
    { provide: MaintenanceRepository, useClass: PrismaMaintenanceRepository },
    ScheduleExecutionService,
    CreateMaintenanceUseCase,
    ListMaintenancesUseCase,
    ListActiveWarrantiesUseCase,
    FindMaintenanceByIdUseCase,
    UpdateMaintenanceUseCase,
    DeleteMaintenanceUseCase,
    UploadInvoiceUseCase,
    GetInvoiceUrlUseCase
  ],
  exports: [MaintenanceRepository]
})
export class MaintenanceModule {}
