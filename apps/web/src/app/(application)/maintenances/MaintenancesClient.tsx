'use client'

import { Button } from '@lib/ui/components/button'
import { ConfirmDeleteDialog } from '@lib/ui/components/ConfirmDeleteDialog'
import { FilterSelect } from '@lib/ui/components/FilterSelect'
import { Input } from '@lib/ui/components/input'
import { Skeleton } from '@lib/ui/components/skeleton'
import { Plus, Search, Wrench } from 'lucide-react'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { useState } from 'react'

import {
  MAINTENANCE_TYPES,
  type Maintenance,
  type MaintenanceType
} from '@/features/maintenances/api/types'
import { MaintenanceFormDialog } from '@/features/maintenances/components/MaintenanceFormDialog'
import { MaintenanceList } from '@/features/maintenances/components/MaintenanceList'
import { MaintenanceTasksCard } from '@/features/maintenances/components/MaintenanceTasksCard'
import { WarrantiesCard } from '@/features/maintenances/components/WarrantiesCard'
import {
  useActiveWarranties,
  useDeleteMaintenance,
  useMaintenanceTasks,
  useMaintenances
} from '@/features/maintenances/hooks/use-maintenances'
import { MAINTENANCE_TYPE_LABELS } from '@/features/maintenances/utils/maintenance-labels'
import { useActiveVehicle } from '@/features/vehicles/hooks/use-active-vehicle'
import { EmptyState } from '@/shared/components/EmptyState'
import { NoVehicleState } from '@/shared/components/NoVehicleState'
import { PageHeader } from '@/shared/components/PageHeader'
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value'
import { formatCurrency } from '@/shared/utils/format-currency'
import { ALL_YEARS, parseYear, yearOptions } from '@/shared/utils/year-options'

const ALL_TYPES = 'all'

const TYPE_OPTIONS = [
  { value: ALL_TYPES, label: 'Todos os tipos' },
  ...MAINTENANCE_TYPES.map((value) => ({
    value,
    label: MAINTENANCE_TYPE_LABELS[value]
  }))
]

export default function MaintenancesClient() {
  const { vehicle, isLoading: isLoadingVehicle } = useActiveVehicle()

  // Histórico de oficina: por padrão mostra todos os anos
  const [year, setYear] = useQueryState(
    'year',
    parseAsString.withDefault(ALL_YEARS)
  )
  const [typeFilter, setTypeFilter] = useQueryState(
    'type',
    parseAsString.withDefault(ALL_TYPES)
  )
  const [search, setSearch] = useQueryState('q', parseAsString.withDefault(''))
  const [isCreating, setIsCreating] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false)
  )
  const [editing, setEditing] = useState<Maintenance | null>(null)
  const [deleting, setDeleting] = useState<Maintenance | null>(null)

  const debouncedSearch = useDebouncedValue(search)

  const { data: maintenances = [], isLoading } = useMaintenances(
    {
      vehicleId: vehicle?.id,
      type:
        typeFilter === ALL_TYPES ? undefined : (typeFilter as MaintenanceType),
      year: parseYear(year),
      search: debouncedSearch.trim() || undefined
    },
    !!vehicle
  )
  const { data: warranties = [] } = useActiveWarranties(vehicle?.id)
  const { data: tasks = [] } = useMaintenanceTasks(vehicle?.id)
  const { mutateAsync: deleteMaintenance, isPending: isDeleting } =
    useDeleteMaintenance()

  const total = maintenances.reduce((sum, item) => sum + item.totalAmount, 0)

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
        <PageHeader title="Manutenções" />
        <NoVehicleState />
      </main>
    )
  }

  return (
    <main className="container mx-auto flex flex-col gap-4 p-4 pb-24">
      <PageHeader
        title="Manutenções"
        description={`${vehicle.name} · histórico de oficina, peças e garantias`}
        action={
          <Button onClick={() => setIsCreating(true)}>
            <Plus /> Nova manutenção
          </Button>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <FilterSelect value={year} onChange={setYear} options={yearOptions()} />
        <FilterSelect
          value={typeFilter}
          onChange={setTypeFilter}
          options={TYPE_OPTIONS}
        />
        <div className="relative sm:w-72">
          <Search className="absolute top-2.5 left-2.5 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Quando troquei a bateria?"
            value={search}
            onChange={(e) => setSearch(e.target.value || null)}
            className="h-9 pl-8 text-xs"
          />
        </div>
        <span className="text-muted-foreground text-xs sm:ml-auto">
          Total:{' '}
          <span className="font-semibold text-foreground">
            {formatCurrency(total)}
          </span>
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : maintenances.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title={
                debouncedSearch
                  ? 'Nada encontrado nessa busca'
                  : 'Nenhuma manutenção registrada'
              }
              description="Registre a ida à oficina com as peças trocadas: a busca encontra pela peça e as garantias ficam à mão."
              action={
                <Button onClick={() => setIsCreating(true)}>
                  <Plus /> Registrar manutenção
                </Button>
              }
            />
          ) : (
            <MaintenanceList
              maintenances={maintenances}
              onEdit={setEditing}
              onDelete={setDeleting}
            />
          )}
        </div>
        <div className="flex flex-col gap-4">
          <MaintenanceTasksCard vehicleId={vehicle.id} tasks={tasks} />
          <WarrantiesCard warranties={warranties} />
        </div>
      </div>

      <MaintenanceFormDialog
        open={isCreating || !!editing}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreating(null)
            setEditing(null)
          }
        }}
        vehicle={vehicle}
        maintenance={editing}
      />

      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir manutenção"
        itemName={deleting?.title ?? ''}
        trailing="? A nota fiscal anexada também é apagada e os planos vinculados voltam para a execução anterior."
        confirmLabel="Excluir"
        isPending={isDeleting}
        onConfirm={async () => {
          if (!deleting) return
          await deleteMaintenance(deleting.id)
          setDeleting(null)
        }}
      />
    </main>
  )
}
