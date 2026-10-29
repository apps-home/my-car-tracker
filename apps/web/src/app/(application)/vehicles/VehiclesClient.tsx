'use client'

import { Button } from '@lib/ui/components/button'
import { ConfirmDeleteDialog } from '@lib/ui/components/ConfirmDeleteDialog'
import { Skeleton } from '@lib/ui/components/skeleton'
import { Car, Plus } from 'lucide-react'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useState } from 'react'

import type { Vehicle } from '@/features/vehicles/api/types'
import { VehicleCard } from '@/features/vehicles/components/VehicleCard'
import { VehicleFormDialog } from '@/features/vehicles/components/VehicleFormDialog'
import { useActiveVehicle } from '@/features/vehicles/hooks/use-active-vehicle'
import {
  useDeleteVehicle,
  useUpdateVehicle,
  useVehicles
} from '@/features/vehicles/hooks/use-vehicles'
import { EmptyState } from '@/shared/components/EmptyState'
import { PageHeader } from '@/shared/components/PageHeader'

export default function VehiclesClient() {
  const { data: vehicles = [], isLoading } = useVehicles()
  const { vehicle: activeVehicle } = useActiveVehicle()
  const { mutateAsync: updateVehicle } = useUpdateVehicle()
  const { mutateAsync: deleteVehicle, isPending: isDeleting } =
    useDeleteVehicle()

  const [isCreating, setIsCreating] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false)
  )
  const [editing, setEditing] = useState<Vehicle | null>(null)
  const [deleting, setDeleting] = useState<Vehicle | null>(null)

  function openCreate() {
    setEditing(null)
    setIsCreating(true)
  }

  return (
    <main className="container mx-auto flex flex-col gap-4 p-4 pb-24">
      <PageHeader
        title="Veículos"
        description="O km atual sobe sozinho a cada abastecimento ou despesa com km."
        action={
          <Button onClick={openCreate}>
            <Plus /> Novo veículo
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      ) : vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="Nenhum veículo cadastrado"
          description="Cadastre o seu carro para começar a lançar abastecimentos e despesas."
          action={
            <Button onClick={openCreate}>
              <Plus /> Cadastrar veículo
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              isActiveSelection={vehicle.id === activeVehicle?.id}
              onEdit={() => setEditing(vehicle)}
              onToggleActive={() =>
                updateVehicle({
                  id: vehicle.id,
                  dto: { isActive: !vehicle.isActive }
                }).catch(() => undefined)
              }
              onDelete={() => setDeleting(vehicle)}
            />
          ))}
        </div>
      )}

      <VehicleFormDialog
        open={isCreating || !!editing}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreating(null)
            setEditing(null)
          }
        }}
        vehicle={editing}
      />

      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir veículo"
        itemName={deleting?.name ?? ''}
        lead="Excluir"
        trailing=" apaga também todos os abastecimentos e despesas dele. Se você vendeu o carro, prefira marcar como vendido."
        confirmLabel="Excluir"
        isPending={isDeleting}
        onConfirm={async () => {
          if (!deleting) return
          await deleteVehicle(deleting.id)
          setDeleting(null)
        }}
      />
    </main>
  )
}
