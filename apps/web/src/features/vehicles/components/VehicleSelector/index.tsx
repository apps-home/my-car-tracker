'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@lib/ui/components/dropdown-menu'
import { cn } from '@lib/ui/lib/utils'
import { Car, Check, ChevronDown, Plus } from 'lucide-react'
import Link from 'next/link'

import { useActiveVehicle } from '../../hooks/use-active-vehicle'

/** Seletor do veículo em uso, no header */
export function VehicleSelector() {
  const { vehicle, vehicles, isLoading, setActiveVehicleId } =
    useActiveVehicle()

  if (isLoading) return null

  if (!vehicle) {
    return (
      <Link
        href="/vehicles?new=1"
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-dashed px-2.5 font-medium text-muted-foreground text-xs hover:bg-muted"
      >
        <Plus className="size-3.5" />
        Cadastrar carro
      </Link>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-slot="vehicle-selector"
        className="inline-flex h-8 max-w-32 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 font-medium text-xs outline-none hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring/50 data-popup-open:bg-muted sm:max-w-44"
      >
        <Car className="size-3.5 shrink-0 text-primary" />
        <span className="truncate">{vehicle.name}</span>
        <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-1">
        {vehicles.map((item) => (
          <DropdownMenuItem
            key={item.id}
            onClick={() => setActiveVehicleId(item.id)}
            className="gap-2 px-2.5 py-2.5"
          >
            <Check
              className={cn(
                'size-3.5',
                item.id === vehicle.id ? 'text-primary' : 'invisible'
              )}
            />
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{item.name}</span>
              <span className="truncate text-[11px] text-muted-foreground">
                {item.currentOdometerKm.toLocaleString('pt-BR')} km
              </span>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={<Link href="/vehicles" />}
          className="gap-2 px-2.5 py-2.5"
        >
          <Car className="size-3.5 text-muted-foreground" />
          Gerenciar veículos
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
