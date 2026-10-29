'use client'

import { Button } from '@lib/ui/components/button'
import { ConfirmDeleteDialog } from '@lib/ui/components/ConfirmDeleteDialog'
import { FilterSelect } from '@lib/ui/components/FilterSelect'
import { Skeleton } from '@lib/ui/components/skeleton'
import { Fuel, Plus } from 'lucide-react'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { useState } from 'react'

import type { FuelLog } from '@/features/fuel-logs/api/types'
import { EthanolComparatorCard } from '@/features/fuel-logs/components/EthanolComparatorCard'
import { FuelLogFormDialog } from '@/features/fuel-logs/components/FuelLogFormDialog'
import { FuelLogList } from '@/features/fuel-logs/components/FuelLogList'
import { FuelSummaryCards } from '@/features/fuel-logs/components/FuelSummaryCards'
import {
  useDeleteFuelLog,
  useFuelLogSummary,
  useFuelLogs
} from '@/features/fuel-logs/hooks/use-fuel-logs'
import { FUEL_TYPES, type FuelType } from '@/features/vehicles/api/types'
import { useActiveVehicle } from '@/features/vehicles/hooks/use-active-vehicle'
import { FUEL_TYPE_LABELS } from '@/features/vehicles/utils/fuel-type-labels'
import { EmptyState } from '@/shared/components/EmptyState'
import { NoVehicleState } from '@/shared/components/NoVehicleState'
import { PageHeader } from '@/shared/components/PageHeader'
import { formatCurrency } from '@/shared/utils/format-currency'
import { formatDate } from '@/shared/utils/format-date'
import { parseYear, yearOptions } from '@/shared/utils/year-options'

const ALL_FUELS = 'all'

const FUEL_OPTIONS = [
  { value: ALL_FUELS, label: 'Todos os combustíveis' },
  ...FUEL_TYPES.map((value) => ({ value, label: FUEL_TYPE_LABELS[value] }))
]

export default function FuelLogsClient() {
  const { vehicle, isLoading: isLoadingVehicle } = useActiveVehicle()

  const [year, setYear] = useQueryState(
    'year',
    parseAsString.withDefault(String(new Date().getFullYear()))
  )
  const [fuel, setFuel] = useQueryState(
    'fuel',
    parseAsString.withDefault(ALL_FUELS)
  )
  const [isCreating, setIsCreating] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false)
  )
  const [editing, setEditing] = useState<FuelLog | null>(null)
  const [deleting, setDeleting] = useState<FuelLog | null>(null)

  const period = { year: parseYear(year) }
  const fuelType = fuel === ALL_FUELS ? undefined : (fuel as FuelType)

  const { data: fuelLogs = [], isLoading } = useFuelLogs(
    { vehicleId: vehicle?.id, fuelType, ...period },
    !!vehicle
  )
  const { data: summary, isLoading: isLoadingSummary } = useFuelLogSummary(
    vehicle ? { vehicleId: vehicle.id, ...period } : null
  )
  // O comparador usa o histórico inteiro, independente do filtro
  const { data: allTimeSummary } = useFuelLogSummary(
    vehicle ? { vehicleId: vehicle.id } : null
  )
  const { mutateAsync: deleteFuelLog, isPending: isDeleting } =
    useDeleteFuelLog()

  if (isLoadingVehicle) {
    return (
      <main className="container mx-auto flex flex-col gap-4 p-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40" />
      </main>
    )
  }

  if (!vehicle) {
    return (
      <main className="container mx-auto flex flex-col gap-4 p-4">
        <PageHeader title="Abastecimentos" />
        <NoVehicleState />
      </main>
    )
  }

  return (
    <main className="container mx-auto flex flex-col gap-4 p-4 pb-24">
      <PageHeader
        title="Abastecimentos"
        description={`${vehicle.name} · consumo real calculado entre tanques cheios`}
        action={
          <Button onClick={() => setIsCreating(true)}>
            <Plus /> Abastecer
          </Button>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <FilterSelect value={year} onChange={setYear} options={yearOptions()} />
        <FilterSelect value={fuel} onChange={setFuel} options={FUEL_OPTIONS} />
      </div>

      <FuelSummaryCards summary={summary} isLoading={isLoadingSummary} />

      {allTimeSummary && <EthanolComparatorCard summary={allTimeSummary} />}

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : fuelLogs.length === 0 ? (
        <EmptyState
          icon={Fuel}
          title="Nenhum abastecimento no período"
          description="Registre no posto mesmo: data de hoje, último combustível e o total calculado sozinho."
          action={
            <Button onClick={() => setIsCreating(true)}>
              <Plus /> Registrar abastecimento
            </Button>
          }
        />
      ) : (
        <FuelLogList
          fuelLogs={fuelLogs}
          onEdit={setEditing}
          onDelete={setDeleting}
        />
      )}

      <FuelLogFormDialog
        open={isCreating || !!editing}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreating(null)
            setEditing(null)
          }
        }}
        vehicle={vehicle}
        fuelLog={editing}
      />

      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir abastecimento"
        itemName={
          deleting
            ? `${formatCurrency(deleting.totalCost)} de ${formatDate(deleting.date)}`
            : ''
        }
        lead="Excluir o abastecimento de"
        trailing="? O consumo dos abastecimentos vizinhos é recalculado."
        confirmLabel="Excluir"
        isPending={isDeleting}
        onConfirm={async () => {
          if (!deleting) return
          await deleteFuelLog(deleting.id)
          setDeleting(null)
        }}
      />
    </main>
  )
}
