import { HttpModule } from '@nestjs/axios'
import { Global, Module } from '@nestjs/common'

import { DomainWebhook } from '@/core/domain/webhooks/domain-webhook.interface'

import { N8nProvider } from './n8n.provider'
import { N8nWebhookService } from './n8n-webhook.service'

@Global()
@Module({
  imports: [HttpModule],
  providers: [
    N8nProvider,
    { provide: DomainWebhook, useClass: N8nWebhookService }
  ],
  exports: [N8nProvider, DomainWebhook]
})
export class N8nModule {}
