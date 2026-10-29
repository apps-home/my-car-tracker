/** Webhooks do n8n do My Car Tracker (`/webhook/<path>`) */
export const WEBHOOKS = {
  /** Plano preventivo próximo do vencimento ou vencido (e-mail, push, WhatsApp) */
  MAINTENANCE_DUE: 'my-car-tracker/maintenance-due'
} as const

export type Webhook = (typeof WEBHOOKS)[keyof typeof WEBHOOKS]

/** Dispara um webhook. Nunca lança: devolve `false` quando falha (com log) */
export abstract class DomainWebhook {
  abstract trigger<TPayload>(path: Webhook, payload: TPayload): Promise<boolean>
}
