import { Module } from '@nestjs/common'

import { UserModule } from '../user/user.module'
import { VehicleModule } from '../vehicles/vehicle.module'
import { EvaluateMaintenanceSchedulesCron } from './adapters/evaluate-maintenance-schedules.cron'
import { VehicleOdometerUpdatedListener } from './adapters/vehicle-odometer-updated.listener'
import { ScheduleAlertService } from './application/services/schedule-alert.service'
import { CreateScheduleUseCase } from './application/use-cases/create-schedule'
import { DeleteScheduleUseCase } from './application/use-cases/delete-schedule'
import { FindScheduleByIdUseCase } from './application/use-cases/find-schedule'
import { ListScheduleTemplatesUseCase } from './application/use-cases/list-schedule-templates'
import { ListSchedulesUseCase } from './application/use-cases/list-schedules'
import { SeedDefaultSchedulesUseCase } from './application/use-cases/seed-default-schedules'
import { UpdateScheduleUseCase } from './application/use-cases/update-schedule'
import { ScheduleRepository } from './domain/schedule.repository'
import { PrismaScheduleRepository } from './infra/repositories/prisma.schedule.repository'
import { ScheduleController } from './infra/schedule.controller'

@Module({
  imports: [UserModule, VehicleModule],
  controllers: [ScheduleController],
  providers: [
    { provide: ScheduleRepository, useClass: PrismaScheduleRepository },
    ScheduleAlertService,
    CreateScheduleUseCase,
    SeedDefaultSchedulesUseCase,
    ListSchedulesUseCase,
    ListScheduleTemplatesUseCase,
    FindScheduleByIdUseCase,
    UpdateScheduleUseCase,
    DeleteScheduleUseCase,
    VehicleOdometerUpdatedListener,
    EvaluateMaintenanceSchedulesCron
  ],
  exports: [ScheduleRepository, ScheduleAlertService]
})
export class MaintenanceScheduleModule {}
