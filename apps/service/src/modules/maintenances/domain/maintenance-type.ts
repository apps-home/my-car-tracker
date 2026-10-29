export const MAINTENANCE_TYPES = [
  'PREVENTIVE',
  'CORRECTIVE',
  'INSPECTION'
] as const

export type MaintenanceType = (typeof MAINTENANCE_TYPES)[number]
