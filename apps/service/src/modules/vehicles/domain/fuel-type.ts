export const FUEL_TYPES = [
  'GASOLINE_COMMON',
  'GASOLINE_ADDITIVE',
  'GASOLINE_PREMIUM',
  'ETHANOL',
  'DIESEL',
  'GNV'
] as const

export type FuelType = (typeof FUEL_TYPES)[number]
