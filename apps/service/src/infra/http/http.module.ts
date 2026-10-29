import { HttpModule as AxiosHttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'

import { N8nModule } from './n8n/n8n.module'

@Module({
  imports: [
    AxiosHttpModule.register({
      timeout: 10000
    }),
    N8nModule
  ],
  exports: [N8nModule]
})
export class HttpModule {}
