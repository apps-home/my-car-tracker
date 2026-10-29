import { Module } from '@nestjs/common'

import { MaintenanceScheduleModule } from '../schedules/schedule.module'
import { VehicleModule } from '../vehicles/vehicle.module'
import { ScheduleExecutionService } from './application/services/schedule-execution.service'
import { CreateMaintenanceUseCase } from './application/use-cases/create-maintenance'
import { CreateMaintenanceTaskUseCase } from './application/use-cases/create-maintenance-task'
import { DeleteMaintenanceUseCase } from './application/use-cases/delete-maintenance'
import { DeleteMaintenanceTaskUseCase } from './application/use-cases/delete-maintenance-task'
import { FindMaintenanceByIdUseCase } from './application/use-cases/find-maintenance'
import { GetInvoiceUrlUseCase } from './application/use-cases/get-invoice-url'
import { ListActiveWarrantiesUseCase } from './application/use-cases/list-active-warranties'
import { ListMaintenanceTasksUseCase } from './application/use-cases/list-maintenance-tasks'
import { ListMaintenancesUseCase } from './application/use-cases/list-maintenances'
import { UpdateMaintenanceUseCase } from './application/use-cases/update-maintenance'
import { UpdateMaintenanceTaskUseCase } from './application/use-cases/update-maintenance-task'
import { UploadInvoiceUseCase } from './application/use-cases/upload-invoice'
import { MaintenanceRepository } from './domain/maintenance.repository'
import { MaintenanceTaskRepository } from './domain/maintenance-task.repository'
import { MaintenanceController } from './infra/maintenance.controller'
import { PrismaMaintenanceRepository } from './infra/repositories/prisma.maintenance.repository'
import { PrismaMaintenanceTaskRepository } from './infra/repositories/prisma.maintenance-task.repository'

@Module({
  imports: [VehicleModule, MaintenanceScheduleModule],
  controllers: [MaintenanceController],
  providers: [
    { provide: MaintenanceRepository, useClass: PrismaMaintenanceRepository },
    {
      provide: MaintenanceTaskRepository,
      useClass: PrismaMaintenanceTaskRepository
    },
    ScheduleExecutionService,
    CreateMaintenanceUseCase,
    ListMaintenancesUseCase,
    ListActiveWarrantiesUseCase,
    FindMaintenanceByIdUseCase,
    UpdateMaintenanceUseCase,
    DeleteMaintenanceUseCase,
    UploadInvoiceUseCase,
    GetInvoiceUrlUseCase,
    CreateMaintenanceTaskUseCase,
    ListMaintenanceTasksUseCase,
    UpdateMaintenanceTaskUseCase,
    DeleteMaintenanceTaskUseCase
  ],
  exports: [MaintenanceRepository, MaintenanceTaskRepository]
})
export class MaintenanceModule {}
