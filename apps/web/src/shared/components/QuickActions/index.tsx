'use client'

import { Button, buttonVariants } from '@lib/ui/components/button'
import { cn } from '@lib/ui/lib/utils'
import { Fuel, Plus, Ticket, Wrench } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { ExpenseFormDialog } from '@/features/expenses/components/ExpenseFormDialog'
import { FuelLogFormDialog } from '@/features/fuel-logs/components/FuelLogFormDialog'
import { useActiveVehicle } from '@/features/vehicles/hooks/use-active-vehicle'
import { ResponsiveDialog } from '@/shared/components/ResponsiveDialog'

type QuickAction = 'menu' | 'fuel' | 'expense' | null

const ACTION_CLASSES =
  'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50'

/** Botão flutuante "+ Novo registro": abastecimento, despesa rápida e manutenção */
export function QuickActions() {
  const { vehicle, isLoading } = useActiveVehicle()
  const [action, setAction] = useState<QuickAction>(null)

  if (isLoading) return null

  return (
    <>
      <Button
        data-slot="quick-actions"
        size="lg"
        aria-label="Novo registro"
        onClick={() => setAction('menu')}
        className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 h-12 rounded-full px-4 shadow-lg md:right-8 md:bottom-8"
      >
        <Plus className="size-5" />
        <span className="hidden sm:inline">Novo registro</span>
      </Button>

      <ResponsiveDialog
        open={action === 'menu'}
        onOpenChange={(open) => !open && setAction(null)}
        title="Novo registro"
        description={vehicle?.name}
      >
        {vehicle ? (
          <div className="grid gap-2">
            <button
              type="button"
              className={ACTION_CLASSES}
              onClick={() => setAction('fuel')}
            >
              <Fuel className="size-5 text-primary" />
              <span>
                <span className="block font-medium text-sm">Abastecimento</span>
                <span className="text-muted-foreground text-xs">
                  Data de hoje e último combustível já preenchidos
                </span>
              </span>
            </button>
            <button
              type="button"
              className={ACTION_CLASSES}
              onClick={() => setAction('expense')}
            >
              <Ticket className="size-5 text-primary" />
              <span>
                <span className="block font-medium text-sm">
                  Pedágio / despesa rápida
                </span>
                <span className="text-muted-foreground text-xs">
                  Atalhos com o que você mais passa
                </span>
              </span>
            </button>
            <button type="button" className={ACTION_CLASSES} disabled>
              <Wrench className="size-5 text-muted-foreground" />
              <span>
                <span className="block font-medium text-sm">
                  Manutenção / oficina
                </span>
                <span className="text-muted-foreground text-xs">Em breve</span>
              </span>
            </button>
          </div>
        ) : (
          <div className="grid gap-3 text-xs">
            <p className="text-muted-foreground">
              Cadastre seu carro para começar a lançar.
            </p>
            <Link
              href="/vehicles?new=1"
              onClick={() => setAction(null)}
              className={cn(buttonVariants())}
            >
              <Plus /> Cadastrar veículo
            </Link>
          </div>
        )}
      </ResponsiveDialog>

      {vehicle && (
        <>
          <FuelLogFormDialog
            open={action === 'fuel'}
            onOpenChange={(open) => !open && setAction(null)}
            vehicle={vehicle}
          />
          <ExpenseFormDialog
            open={action === 'expense'}
            onOpenChange={(open) => !open && setAction(null)}
            vehicle={vehicle}
            defaultCategory="TOLL"
          />
        </>
      )}
    </>
  )
}
