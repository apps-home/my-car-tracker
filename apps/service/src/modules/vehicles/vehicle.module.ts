import { Module } from '@nestjs/common'

import { SyncVehicleOdometerService } from './application/services/sync-vehicle-odometer'
import { CreateVehicleUseCase } from './application/use-cases/create-vehicle'
import { DeleteVehicleUseCase } from './application/use-cases/delete-vehicle'
import { FindVehicleByIdUseCase } from './application/use-cases/find-vehicle'
import { ListVehiclesUseCase } from './application/use-cases/list-vehicles'
import { UpdateVehicleUseCase } from './application/use-cases/update-vehicle'
import { VehicleRepository } from './domain/vehicle.repository'
import { PrismaVehicleRepository } from './infra/repositories/prisma.vehicle.repository'
import { VehicleController } from './infra/vehicle.controller'

@Module({
  controllers: [VehicleController],
  providers: [
    { provide: VehicleRepository, useClass: PrismaVehicleRepository },
    CreateVehicleUseCase,
    ListVehiclesUseCase,
    FindVehicleByIdUseCase,
    UpdateVehicleUseCase,
    DeleteVehicleUseCase,
    SyncVehicleOdometerService
  ],
  exports: [VehicleRepository, SyncVehicleOdometerService]
})
export class VehicleModule {}
