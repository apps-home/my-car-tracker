'use client'

import { Badge } from '@lib/ui/components/badge'
import { Button } from '@lib/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@lib/ui/components/dropdown-menu'
import {
  FileText,
  MoreVertical,
  Pencil,
  ShieldCheck,
  Trash2
} from 'lucide-react'

import { formatCurrency } from '@/shared/utils/format-currency'
import { formatDate } from '@/shared/utils/format-date'
import { formatKm } from '@/shared/utils/format-number'

import type { Maintenance } from '../../api/types'
import { openMaintenanceInvoice } from '../../hooks/use-maintenances'
import { MAINTENANCE_TYPE_LABELS } from '../../utils/maintenance-labels'

interface MaintenanceListProps {
  maintenances: Maintenance[]
  onEdit: (maintenance: Maintenance) => void
  onDelete: (maintenance: Maintenance) => void
}

export function MaintenanceList({
  maintenances,
  onEdit,
  onDelete
}: MaintenanceListProps) {
  return (
    <ul data-slot="maintenance-list" className="grid gap-3">
      {maintenances.map((maintenance) => (
        <li key={maintenance.id} className="rounded-lg border bg-card p-3">
          <div className="flex items-start gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-sm">{maintenance.title}</span>
                <Badge variant="outline">
                  {MAINTENANCE_TYPE_LABELS[maintenance.type]}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs">
                {formatDate(maintenance.date)} ·{' '}
                {formatKm(maintenance.odometerKm)}
                {maintenance.workshopName && ` · ${maintenance.workshopName}`}
              </p>
            </div>
            <span className="font-semibold text-sm tabular-nums">
              {formatCurrency(maintenance.totalAmount)}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon-sm" aria-label="Ações" />
                }
              >
                <MoreVertical />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 p-1">
                {maintenance.hasInvoice && (
                  <DropdownMenuItem
                    onClick={() => openMaintenanceInvoice(maintenance.id)}
                    className="gap-2 py-2"
                  >
                    <FileText /> Ver nota fiscal
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => onEdit(maintenance)}
                  className="gap-2 py-2"
                >
                  <Pencil /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(maintenance)}
                  className="gap-2 py-2 text-destructive"
                >
                  <Trash2 /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {maintenance.items.length > 0 && (
            <ul className="mt-2 space-y-1 border-t pt-2 text-xs">
              {maintenance.items.map((item) => (
                <li key={item.id} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate">
                    {item.quantity !== 1 &&
                      `${item.quantity.toLocaleString('pt-BR')}× `}
                    {item.name}
                    {item.brand && (
                      <span className="text-muted-foreground">
                        {' '}
                        · {item.brand}
                      </span>
                    )}
                  </span>
                  {item.warrantyUntil && (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <ShieldCheck className="size-3" />
                      até {formatDate(item.warrantyUntil)}
                    </span>
                  )}
                  <span className="tabular-nums">
                    {formatCurrency(item.totalPrice)}
                  </span>
                </li>
              ))}
              {maintenance.laborCost > 0 && (
                <li className="flex justify-between text-muted-foreground">
                  <span>Mão de obra</span>
                  <span className="tabular-nums">
                    {formatCurrency(maintenance.laborCost)}
                  </span>
                </li>
              )}
            </ul>
          )}
          {maintenance.hasInvoice && (
            <button
              type="button"
              onClick={() => openMaintenanceInvoice(maintenance.id)}
              className="mt-2 inline-flex items-center gap-1 text-primary text-xs hover:underline"
            >
              <FileText className="size-3.5" /> Nota fiscal
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}
