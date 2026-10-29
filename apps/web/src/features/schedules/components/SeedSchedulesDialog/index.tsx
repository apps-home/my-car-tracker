'use client'

import { Button } from '@lib/ui/components/button'
import { Checkbox } from '@lib/ui/components/checkbox'
import { Label } from '@lib/ui/components/label'
import { Skeleton } from '@lib/ui/components/skeleton'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

import type { Vehicle } from '@/features/vehicles/api/types'
import { ResponsiveDialog } from '@/shared/components/ResponsiveDialog'

import {
  useScheduleTemplates,
  useSeedDefaultSchedules
} from '../../hooks/use-schedules'
import { describeInterval } from '../../utils/schedule-labels'

interface SeedSchedulesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicle: Vehicle
  /** Títulos já ativos no veículo (aparecem marcados e desabilitados) */
  existingTitles: string[]
}

/** Ativa os planos preventivos padrão com um clique */
export function SeedSchedulesDialog({
  open,
  onOpenChange,
  vehicle,
  existingTitles
}: SeedSchedulesDialogProps) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Planos preventivos sugeridos"
      description={`O ciclo de cada plano começa hoje, aos ${vehicle.currentOdometerKm.toLocaleString('pt-BR')} km. Se você já fez algum recentemente, edite a última execução depois.`}
    >
      {open && (
        <SeedForm
          vehicle={vehicle}
          existingTitles={existingTitles}
          onDone={() => onOpenChange(false)}
        />
      )}
    </ResponsiveDialog>
  )
}

function SeedForm({
  vehicle,
  existingTitles,
  onDone
}: {
  vehicle: Vehicle
  existingTitles: string[]
  onDone: () => void
}) {
  const { data: templates = [], isLoading } = useScheduleTemplates()
  const { mutateAsync: seed, isPending } = useSeedDefaultSchedules()
  const existing = new Set(existingTitles.map((title) => title.toLowerCase()))
  const [selected, setSelected] = useState<Set<string> | null>(null)

  const available = templates.filter(
    (template) => !existing.has(template.title.toLowerCase())
  )
  // Começa com todos os disponíveis marcados
  const chosen = selected ?? new Set(available.map(({ key }) => key))

  function toggle(key: string, checked: boolean) {
    const next = new Set(chosen)

    if (checked) next.add(key)
    else next.delete(key)

    setSelected(next)
  }

  async function handleSubmit() {
    try {
      await seed({ vehicleId: vehicle.id, templates: [...chosen] })
      onDone()
    } catch {
      // o erro já é exibido pelo toast do hook
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-2">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-12" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      <ul className="grid gap-1.5">
        {templates.map((template) => {
          const already = existing.has(template.title.toLowerCase())
          const id = `template-${template.key}`

          return (
            <li
              key={template.key}
              className="flex items-start gap-3 rounded-lg border p-3"
            >
              <Checkbox
                id={id}
                checked={already || chosen.has(template.key)}
                disabled={already}
                onCheckedChange={(checked) =>
                  toggle(template.key, checked === true)
                }
                className="mt-0.5"
              />
              <Label htmlFor={id} className="flex flex-col items-start gap-0.5">
                <span className="font-medium text-xs">{template.title}</span>
                <span className="font-normal text-[11px] text-muted-foreground">
                  {already
                    ? 'Já ativo neste veículo'
                    : `A cada ${describeInterval(template)}`}
                </span>
              </Label>
            </li>
          )
        })}
      </ul>
      <Button onClick={handleSubmit} disabled={isPending || chosen.size === 0}>
        {isPending && <Loader2 className="size-3.5 animate-spin" />}
        Ativar {chosen.size} plano{chosen.size === 1 ? '' : 's'}
      </Button>
    </div>
  )
}
