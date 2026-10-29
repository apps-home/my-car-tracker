export const PAYMENT_METHODS = [
  'TAG',
  'PIX',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'CASH'
] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  TAG: 'Tag (Sem Parar, Veloe...)',
  PIX: 'Pix',
  CREDIT_CARD: 'Cartão de crédito',
  DEBIT_CARD: 'Cartão de débito',
  CASH: 'Dinheiro'
}
