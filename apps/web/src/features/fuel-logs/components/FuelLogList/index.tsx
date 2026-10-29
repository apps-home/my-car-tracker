'use client'

import { Badge } from '@lib/ui/components/badge'
import { Button } from '@lib/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@lib/ui/components/dropdown-menu'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'

import { FUEL_TYPE_LABELS } from '@/features/vehicles/utils/fuel-type-labels'
import { formatCurrency } from '@/shared/utils/format-currency'
import { formatDate } from '@/shared/utils/format-date'
import { formatDecimal, formatKm } from '@/shared/utils/format-number'

import type { FuelLog } from '../../api/types'

interface FuelLogListProps {
  fuelLogs: FuelLog[]
  onEdit: (fuelLog: FuelLog) => void
  onDelete: (fuelLog: FuelLog) => void
}

export function FuelLogList({ fuelLogs, onEdit, onDelete }: FuelLogListProps) {
  return (
    <ul
      data-slot="fuel-log-list"
      className="divide-y rounded-lg border bg-card"
    >
      {fuelLogs.map((fuelLog) => (
        <li key={fuelLog.id} className="flex items-start gap-3 p-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-sm">
                {formatCurrency(fuelLog.totalCost)}
              </span>
              <Badge variant="outline">
                {FUEL_TYPE_LABELS[fuelLog.fuelType]}
              </Badge>
              {!fuelLog.isFullTank && (
                <Badge variant="secondary">Parcial</Badge>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              {formatDate(fuelLog.date)} · {formatKm(fuelLog.odometerKm)} ·{' '}
              {formatDecimal(fuelLog.liters, 2)} L a{' '}
              {formatCurrency(fuelLog.pricePerLiter)}
              {fuelLog.gasStationName && ` · ${fuelLog.gasStationName}`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-0.5 text-right">
            {fuelLog.consumptionKmPerLiter !== null ? (
              <>
                <span className="font-semibold text-primary text-sm tabular-nums">
                  {formatDecimal(fuelLog.consumptionKmPerLiter)} km/L
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {formatKm(fuelLog.distanceDrivenKm ?? 0)}
                  {fuelLog.costPerKm !== null &&
                    ` · ${formatCurrency(fuelLog.costPerKm)}/km`}
                </span>
              </>
            ) : (
              <span className="text-[11px] text-muted-foreground">—</span>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Ações" />
              }
            >
              <MoreVertical />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 p-1">
              <DropdownMenuItem
                onClick={() => onEdit(fuelLog)}
                className="gap-2 py-2"
              >
                <Pencil /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(fuelLog)}
                className="gap-2 py-2 text-destructive"
              >
                <Trash2 /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </li>
      ))}
    </ul>
  )
}
