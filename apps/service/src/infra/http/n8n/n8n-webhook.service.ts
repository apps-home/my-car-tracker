import { Injectable } from '@nestjs/common'

import {
  DomainWebhook,
  type Webhook
} from '@/core/domain/webhooks/domain-webhook.interface'

import { N8nProvider } from './n8n.provider'

@Injectable()
export class N8nWebhookService implements DomainWebhook {
  constructor(private readonly n8n: N8nProvider) {}

  async trigger<TPayload>(path: Webhook, payload: TPayload): Promise<boolean> {
    const response = await this.n8n.triggerWebhook(path, payload)
    return response.ok
  }
}
