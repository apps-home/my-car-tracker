import type {
  DomainWebhook,
  Webhook
} from '@/core/domain/webhooks/domain-webhook.interface'

export class FakeWebhook implements DomainWebhook {
  public triggered: { path: Webhook; payload: unknown }[] = []
  public result = true

  async trigger<TPayload>(path: Webhook, payload: TPayload): Promise<boolean> {
    this.triggered.push({ path, payload })
    return this.result
  }
}
