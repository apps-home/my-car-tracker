import { Module } from '@nestjs/common'

import { InfraModule } from './infra/infra.module'
import { UserModule } from './modules/user/user.module'

@Module({
  imports: [InfraModule, UserModule]
})
export class AppModule {}
