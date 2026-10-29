/** Eventos de domínio publicados pelo DomainEventPublisher */
export const DOMAIN_EVENTS = {
  /** O odômetro do veículo subiu (payload: VehicleOdometerUpdatedEvent) */
  VEHICLE_ODOMETER_UPDATED: 'vehicle.odometer-updated'
} as const

export interface VehicleOdometerUpdatedEvent {
  vehicleId: string
  userId: string
  currentOdometerKm: number
}
