import { Module } from '@nestjs/common'

import { InfraModule } from './infra/infra.module'
import { ExpenseModule } from './modules/expenses/expense.module'
import { FuelLogModule } from './modules/fuel-logs/fuel-log.module'
import { UserModule } from './modules/user/user.module'
import { VehicleModule } from './modules/vehicles/vehicle.module'

@Module({
  imports: [
    InfraModule,
    UserModule,
    VehicleModule,
    FuelLogModule,
    ExpenseModule
  ]
})
export class AppModule {}
