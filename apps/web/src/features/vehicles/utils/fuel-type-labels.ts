import type { FuelType } from '../api/types'

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  GASOLINE_COMMON: 'Gasolina comum',
  GASOLINE_ADDITIVE: 'Gasolina aditivada',
  GASOLINE_PREMIUM: 'Gasolina premium',
  ETHANOL: 'Etanol',
  DIESEL: 'Diesel',
  GNV: 'GNV'
}
