import type { MaintenanceType } from '../api/types'

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  PREVENTIVE: 'Preventiva',
  CORRECTIVE: 'Corretiva',
  INSPECTION: 'Vistoria / alinhamento'
}
