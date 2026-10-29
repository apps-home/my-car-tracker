import { Module } from '@nestjs/common'

import { VehicleModule } from '../vehicles/vehicle.module'
import { CreateFuelLogUseCase } from './application/use-cases/create-fuel-log'
import { DeleteFuelLogUseCase } from './application/use-cases/delete-fuel-log'
import { FindFuelLogByIdUseCase } from './application/use-cases/find-fuel-log'
import { GetFuelLogSummaryUseCase } from './application/use-cases/get-fuel-log-summary'
import { ListFuelLogsUseCase } from './application/use-cases/list-fuel-logs'
import { UpdateFuelLogUseCase } from './application/use-cases/update-fuel-log'
import { FuelLogRepository } from './domain/fuel-log.repository'
import { FuelLogController } from './infra/fuel-log.controller'
import { PrismaFuelLogRepository } from './infra/repositories/prisma.fuel-log.repository'

@Module({
  imports: [VehicleModule],
  controllers: [FuelLogController],
  providers: [
    { provide: FuelLogRepository, useClass: PrismaFuelLogRepository },
    CreateFuelLogUseCase,
    ListFuelLogsUseCase,
    GetFuelLogSummaryUseCase,
    FindFuelLogByIdUseCase,
    UpdateFuelLogUseCase,
    DeleteFuelLogUseCase
  ],
  exports: [FuelLogRepository]
})
export class FuelLogModule {}
