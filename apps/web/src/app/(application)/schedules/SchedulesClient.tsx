'use client'

import { Button } from '@lib/ui/components/button'
import { ConfirmDeleteDialog } from '@lib/ui/components/ConfirmDeleteDialog'
import { FilterSelect } from '@lib/ui/components/FilterSelect'
import { Skeleton } from '@lib/ui/components/skeleton'
import { CalendarCheck, ListChecks, Plus } from 'lucide-react'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { useState } from 'react'

import { MaintenanceFormDialog } from '@/features/maintenances/components/MaintenanceFormDialog'
import type {
  Schedule,
  ScheduleAlertStatus
} from '@/features/schedules/api/types'
import { ScheduleCard } from '@/features/schedules/components/ScheduleCard'
import { ScheduleFormDialog } from '@/features/schedules/components/ScheduleFormDialog'
import { SeedSchedulesDialog } from '@/features/schedules/components/SeedSchedulesDialog'
import {
  useDeleteSchedule,
  useSchedules,
  useUpdateSchedule
} from '@/features/schedules/hooks/use-schedules'
import { ALERT_STATUS_LABELS } from '@/features/schedules/utils/schedule-labels'
import { useActiveVehicle } from '@/features/vehicles/hooks/use-active-vehicle'
import { EmptyState } from '@/shared/components/EmptyState'
import { NoVehicleState } from '@/shared/components/NoVehicleState'
import { PageHeader } from '@/shared/components/PageHeader'

const ALL = 'all'

const STATUS_OPTIONS = [
  { value: ALL, label: 'Todos os status' },
  ...(['OVERDUE', 'DUE_SOON', 'ON_TRACK'] as const).map((value) => ({
    value,
    label: ALERT_STATUS_LABELS[value]
  }))
]

export default function SchedulesClient() {
  const { vehicle, isLoading: isLoadingVehicle } = useActiveVehicle()

  const [status, setStatus] = useQueryState(
    'status',
    parseAsString.withDefault(ALL)
  )
  const [isCreating, setIsCreating] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false)
  )
  const [isSeeding, setIsSeeding] = useState(false)
  const [editing, setEditing] = useState<Schedule | null>(null)
  const [deleting, setDeleting] = useState<Schedule | null>(null)
  const [registering, setRegistering] = useState<Schedule | null>(null)

  const { data: schedules = [], isLoading } = useSchedules(
    {
      vehicleId: vehicle?.id,
      alertStatus: status === ALL ? undefined : (status as ScheduleAlertStatus),
      includeInactive: true
    },
    !!vehicle
  )
  const { mutateAsync: updateSchedule } = useUpdateSchedule()
  const { mutateAsync: deleteSchedule, isPending: isDeleting } =
    useDeleteSchedule()

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
        <PageHeader title="Planos preventivos" />
        <NoVehicleState />
      </main>
    )
  }

  return (
    <main className="container mx-auto flex flex-col gap-4 p-4 pb-24">
      <PageHeader
        title="Planos preventivos"
        description={`${vehicle.name} · avisamos pelo que vencer primeiro: tempo ou km`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsSeeding(true)}>
              <ListChecks /> Sugeridos
            </Button>
            <Button onClick={() => setIsCreating(true)}>
              <Plus /> Novo plano
            </Button>
          </div>
        }
      />

      <FilterSelect
        value={status}
        onChange={setStatus}
        options={STATUS_OPTIONS}
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      ) : schedules.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title={
            status === ALL
              ? 'Nenhum plano preventivo'
              : 'Nenhum plano com esse status'
          }
          description="Comece pelos sugeridos (óleo, filtros, pneus, fluidos e palhetas) e ajuste os intervalos ao manual do seu carro."
          action={
            status === ALL && (
              <Button onClick={() => setIsSeeding(true)}>
                <ListChecks /> Ativar planos sugeridos
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {schedules.map((schedule) => (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              onRegister={() => setRegistering(schedule)}
              onEdit={() => setEditing(schedule)}
              onToggleActive={() =>
                updateSchedule({
                  id: schedule.id,
                  dto: { isActive: !schedule.isActive }
                }).catch(() => undefined)
              }
              onDelete={() => setDeleting(schedule)}
            />
          ))}
        </div>
      )}

      <ScheduleFormDialog
        open={isCreating || !!editing}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreating(null)
            setEditing(null)
          }
        }}
        vehicle={vehicle}
        schedule={editing}
      />

      <SeedSchedulesDialog
        open={isSeeding}
        onOpenChange={setIsSeeding}
        vehicle={vehicle}
        existingTitles={schedules.map(({ title }) => title)}
      />

      <MaintenanceFormDialog
        open={!!registering}
        onOpenChange={(open) => !open && setRegistering(null)}
        vehicle={vehicle}
        presetSchedule={registering}
      />

      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir plano"
        itemName={deleting?.title ?? ''}
        trailing="? As manutenções já registradas continuam no histórico. Para só parar os alertas, pause o plano."
        confirmLabel="Excluir"
        isPending={isDeleting}
        onConfirm={async () => {
          if (!deleting) return
          await deleteSchedule(deleting.id)
          setDeleting(null)
        }}
      />
    </main>
  )
}
