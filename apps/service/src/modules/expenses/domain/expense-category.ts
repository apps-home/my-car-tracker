export const EXPENSE_CATEGORIES = [
  'TOLL',
  'PARKING',
  'IPVA',
  'LICENSING',
  'INSURANCE',
  'CAR_WASH',
  'FINE',
  'ACCESSORY',
  'OTHER'
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]
