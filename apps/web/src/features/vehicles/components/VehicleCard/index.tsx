'use client'

import { Badge } from '@lib/ui/components/badge'
import { Button } from '@lib/ui/components/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@lib/ui/components/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@lib/ui/components/dropdown-menu'
import { cn } from '@lib/ui/lib/utils'
import {
  Archive,
  ArchiveRestore,
  Gauge,
  MoreVertical,
  Pencil,
  Trash2
} from 'lucide-react'

import { formatKm } from '@/shared/utils/format-number'

import type { Vehicle } from '../../api/types'
import { FUEL_TYPE_LABELS } from '../../utils/fuel-type-labels'

interface VehicleCardProps {
  vehicle: Vehicle
  isActiveSelection: boolean
  onEdit: () => void
  onToggleActive: () => void
  onDelete: () => void
}

export function VehicleCard({
  vehicle,
  isActiveSelection,
  onEdit,
  onToggleActive,
  onDelete
}: VehicleCardProps) {
  const drivenKm = vehicle.currentOdometerKm - vehicle.initialOdometerKm

  return (
    <Card
      data-slot="vehicle-card"
      className={cn(
        !vehicle.isActive && 'opacity-70',
        isActiveSelection && 'ring-1 ring-primary/60'
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {vehicle.name}
          {isActiveSelection && <Badge>Em uso</Badge>}
          {!vehicle.isActive && <Badge variant="secondary">Vendido</Badge>}
        </CardTitle>
        <CardDescription>
          {vehicle.brand} {vehicle.model} ·{' '}
          {vehicle.manufactureYear &&
          vehicle.manufactureYear !== vehicle.modelYear
            ? `${vehicle.manufactureYear}/${vehicle.modelYear}`
            : vehicle.modelYear}
          {vehicle.licensePlate && ` · ${vehicle.licensePlate}`}
        </CardDescription>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Ações" />
              }
            >
              <MoreVertical />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 p-1">
              <DropdownMenuItem onClick={onEdit} className="gap-2 py-2">
                <Pencil /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleActive} className="gap-2 py-2">
                {vehicle.isActive ? (
                  <>
                    <Archive /> Marcar como vendido
                  </>
                ) : (
                  <>
                    <ArchiveRestore /> Reativar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="gap-2 py-2 text-destructive"
              >
                <Trash2 /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 text-xs">
        <div className="col-span-2 flex items-center gap-2">
          <Gauge className="size-4 text-primary" />
          <span className="font-semibold text-base">
            {formatKm(vehicle.currentOdometerKm)}
          </span>
        </div>
        <div>
          <p className="text-muted-foreground">Rodados no app</p>
          <p className="font-medium">{formatKm(drivenKm)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Combustível padrão</p>
          <p className="font-medium">
            {FUEL_TYPE_LABELS[vehicle.defaultFuelType]}
          </p>
        </div>
        {vehicle.fuelTankCapacityLiters && (
          <div>
            <p className="text-muted-foreground">Tanque</p>
            <p className="font-medium">{vehicle.fuelTankCapacityLiters} L</p>
          </div>
        )}
        {vehicle.color && (
          <div>
            <p className="text-muted-foreground">Cor</p>
            <p className="font-medium">{vehicle.color}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
