import { useSyncExternalStore } from 'react'

import { useVehicles } from './use-vehicles'

const STORAGE_KEY = 'my-car-tracker:active-vehicle'
const listeners = new Set<() => void>()

function readStoredId(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function subscribe(callback: () => void) {
  listeners.add(callback)
  window.addEventListener('storage', callback)

  return () => {
    listeners.delete(callback)
    window.removeEventListener('storage', callback)
  }
}

export function setActiveVehicleId(id: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // modo privado: a escolha vale só até recarregar
  }

  for (const listener of listeners) listener()
}

/**
 * Veículo em uso (escolhido no seletor do header e guardado no aparelho).
 * Sem escolha válida, usa o primeiro veículo ativo.
 */
export function useActiveVehicle() {
  const storedId = useSyncExternalStore(subscribe, readStoredId, () => null)
  const query = useVehicles({ status: 'ACTIVE' })
  const vehicles = query.data ?? []

  const vehicle =
    vehicles.find((item) => item.id === storedId) ?? vehicles[0] ?? null

  return {
    vehicle,
    vehicles,
    isLoading: query.isLoading,
    setActiveVehicleId
  }
}
