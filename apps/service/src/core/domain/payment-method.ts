export const PAYMENT_METHODS = [
  'TAG',
  'PIX',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'CASH',
  'MEAL_VOUCHER'
] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]
