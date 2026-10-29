'use client'

import { Button } from '@lib/ui/components/button'
import { Checkbox } from '@lib/ui/components/checkbox'
import { FilterSelect } from '@lib/ui/components/FilterSelect'
import { Input } from '@lib/ui/components/input'
import { Label } from '@lib/ui/components/label'
import { Separator } from '@lib/ui/components/separator'
import { Loader2, Paperclip, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { Schedule } from '@/features/schedules/api/types'
import { useSchedules } from '@/features/schedules/hooks/use-schedules'
import type { Vehicle } from '@/features/vehicles/api/types'
import { FormField } from '@/shared/components/FormField'
import { ResponsiveDialog } from '@/shared/components/ResponsiveDialog'
import { formatCurrency } from '@/shared/utils/format-currency'
import { formatCurrencyInput } from '@/shared/utils/format-currency-input'
import {
  toDateInputValue,
  todayDateInputValue
} from '@/shared/utils/format-date'
import { parseDecimal, toDecimalInput } from '@/shared/utils/parse-decimal'
import { parseValue } from '@/shared/utils/parse-value'

import {
  MAINTENANCE_TYPES,
  type Maintenance,
  type MaintenanceType
} from '../../api/types'
import { useSaveMaintenance } from '../../hooks/use-maintenances'
import { MAINTENANCE_TYPE_LABELS } from '../../utils/maintenance-labels'

interface MaintenanceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicle: Vehicle
  maintenance?: Maintenance | null
  /** "Registrar execução" de um plano: já vem marcado */
  presetSchedule?: Schedule | null
}

interface ItemRow {
  key: string
  scheduleId: string | null
  name: string
  quantity: string
  unitPrice: string
  warrantyMonths: string
}

const TYPE_OPTIONS = MAINTENANCE_TYPES.map((value) => ({
  value,
  label: MAINTENANCE_TYPE_LABELS[value]
}))

const MAX_INVOICE_BYTES = 10 * 1024 * 1024

function toCurrencyInput(value: number) {
  return value ? formatCurrencyInput(value.toFixed(2)) : ''
}

function newRow(override: Partial<ItemRow> = {}): ItemRow {
  return {
    key: crypto.randomUUID(),
    scheduleId: null,
    name: '',
    quantity: '1',
    unitPrice: '',
    warrantyMonths: '',
    ...override
  }
}

function rowTotal(row: ItemRow) {
  return (parseDecimal(row.quantity) ?? 0) * parseValue(row.unitPrice)
}

export function MaintenanceFormDialog({
  open,
  onOpenChange,
  vehicle,
  maintenance,
  presetSchedule
}: MaintenanceFormDialogProps) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={maintenance ? 'Editar manutenção' : 'Nova manutenção'}
      description={vehicle.name}
      className="sm:max-w-2xl"
    >
      {open && (
        <MaintenanceForm
          key={maintenance?.id ?? presetSchedule?.id ?? 'new'}
          vehicle={vehicle}
          maintenance={maintenance}
          presetSchedule={presetSchedule}
          onDone={() => onOpenChange(false)}
        />
      )}
    </ResponsiveDialog>
  )
}

function MaintenanceForm({
  vehicle,
  maintenance,
  presetSchedule,
  onDone
}: {
  vehicle: Vehicle
  maintenance?: Maintenance | null
  presetSchedule?: Schedule | null
  onDone: () => void
}) {
  const { data: schedules = [] } = useSchedules({ vehicleId: vehicle.id })
  const { mutateAsync: save, isPending } = useSaveMaintenance()

  const [type, setType] = useState<MaintenanceType>(
    maintenance?.type ?? 'PREVENTIVE'
  )
  const [title, setTitle] = useState(
    maintenance?.title ?? presetSchedule?.title ?? ''
  )
  const [date, setDate] = useState(
    maintenance ? toDateInputValue(maintenance.date) : todayDateInputValue()
  )
  const [odometerKm, setOdometerKm] = useState(
    maintenance ? String(maintenance.odometerKm) : ''
  )
  const [workshopName, setWorkshopName] = useState(
    maintenance?.workshopName ?? ''
  )
  const [laborCost, setLaborCost] = useState(
    toCurrencyInput(maintenance?.laborCost ?? 0)
  )
  const [notes, setNotes] = useState(maintenance?.notes ?? '')
  const [invoice, setInvoice] = useState<File | null>(null)
  const [items, setItems] = useState<ItemRow[]>(() => {
    if (maintenance) {
      return maintenance.items.map((item) =>
        newRow({
          scheduleId: item.scheduleId,
          name: item.name,
          quantity: toDecimalInput(item.quantity, 2),
          unitPrice: toCurrencyInput(item.unitPrice),
          warrantyMonths: item.warrantyMonths ? String(item.warrantyMonths) : ''
        })
      )
    }

    return presetSchedule
      ? [newRow({ scheduleId: presetSchedule.id, name: presetSchedule.title })]
      : [newRow()]
  })

  const linked = new Set(items.map((item) => item.scheduleId).filter(Boolean))
  const partsCost = items.reduce((sum, item) => sum + rowTotal(item), 0)
  const total = parseValue(laborCost) + partsCost

  function updateItem(key: string, changes: Partial<ItemRow>) {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, ...changes } : item))
    )
  }

  function toggleSchedule(schedule: Schedule, checked: boolean) {
    setItems((prev) => {
      if (!checked) {
        const rest = prev.filter((item) => item.scheduleId !== schedule.id)
        return rest.length ? rest : [newRow()]
      }

      // Reaproveita uma linha vazia em vez de deixar sobrando
      const empty = prev.find((item) => !item.name.trim() && !item.scheduleId)
      const row = { scheduleId: schedule.id, name: schedule.title }

      return empty
        ? prev.map((item) =>
            item.key === empty.key ? { ...item, ...row } : item
          )
        : [...prev, newRow(row)]
    })

    if (checked && !title.trim()) {
      setTitle(schedule.title)
    }
  }

  function handleInvoiceChange(file: File | null) {
    if (file && file.size > MAX_INVOICE_BYTES) {
      toast.error('A nota pode ter até 10 MB')
      return
    }

    setInvoice(file)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const odometer = Number(odometerKm.replace(/\D/g, ''))
    const filled = items.filter(
      (item) => item.name.trim() || parseValue(item.unitPrice) > 0
    )

    if (!title.trim()) {
      toast.error('Dê um título (ex.: Revisão de 40.000 km)')
      return
    }

    if (!odometerKm.trim()) {
      toast.error('Informe o km do painel')
      return
    }

    if (odometer < vehicle.initialOdometerKm) {
      toast.error(
        `O km não pode ser menor que o de cadastro do carro (${vehicle.initialOdometerKm.toLocaleString('pt-BR')} km)`
      )
      return
    }

    if (filled.some((item) => !item.name.trim())) {
      toast.error('Dê um nome a cada peça ou serviço')
      return
    }

    if (filled.some((item) => !((parseDecimal(item.quantity) ?? 0) > 0))) {
      toast.error('A quantidade de cada item precisa ser maior que zero')
      return
    }

    const dto = {
      type,
      title: title.trim(),
      date,
      odometerKm: odometer,
      workshopName: workshopName.trim() || null,
      laborCost: parseValue(laborCost),
      notes: notes.trim() || null,
      items: filled.map((item) => ({
        scheduleId: item.scheduleId,
        name: item.name.trim(),
        quantity: parseDecimal(item.quantity) ?? 1,
        unitPrice: parseValue(item.unitPrice),
        warrantyMonths: Number(item.warrantyMonths) || null
      }))
    }

    try {
      await save({
        id: maintenance?.id,
        dto: maintenance ? dto : { ...dto, vehicleId: vehicle.id },
        invoice
      })
      onDone()
    } catch {
      // o erro já é exibido pelo toast do hook
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField id="maintenance-title" label="Título" className="col-span-2">
          <Input
            id="maintenance-title"
            placeholder="Ex.: Revisão de 40.000 km"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </FormField>
        <FormField id="maintenance-type" label="Tipo">
          <FilterSelect
            value={type}
            onChange={(value) => setType(value as MaintenanceType)}
            options={TYPE_OPTIONS}
            className="sm:w-full"
          />
        </FormField>
        <FormField id="maintenance-date" label="Data">
          <Input
            id="maintenance-date"
            type="date"
            max={todayDateInputValue()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </FormField>
        <FormField
          id="maintenance-odometer"
          label="Km do painel"
          hint={`Atual: ${vehicle.currentOdometerKm.toLocaleString('pt-BR')} km`}
        >
          <Input
            id="maintenance-odometer"
            inputMode="numeric"
            placeholder={String(vehicle.currentOdometerKm)}
            value={odometerKm}
            onChange={(e) => setOdometerKm(e.target.value)}
          />
        </FormField>
        <FormField id="maintenance-workshop" label="Oficina">
          <Input
            id="maintenance-workshop"
            placeholder="Opcional"
            value={workshopName}
            onChange={(e) => setWorkshopName(e.target.value)}
          />
        </FormField>
      </div>

      {schedules.length > 0 && (
        <div className="space-y-2">
          <p className="font-medium text-xs">Cumpre algum plano?</p>
          <div className="flex flex-wrap gap-2">
            {schedules.map((schedule) => {
              const id = `plan-${schedule.id}`

              return (
                <div
                  key={schedule.id}
                  className="flex items-center gap-2 rounded-full border px-3 py-1.5"
                >
                  <Checkbox
                    id={id}
                    checked={linked.has(schedule.id)}
                    onCheckedChange={(checked) =>
                      toggleSchedule(schedule, checked === true)
                    }
                  />
                  <Label htmlFor={id} className="font-normal text-xs">
                    {schedule.title}
                  </Label>
                </div>
              )
            })}
          </div>
          <p className="text-[11px] text-muted-foreground">
            O ciclo do plano marcado recomeça a partir desta data e deste km.
          </p>
        </div>
      )}

      <Separator />

      <div className="space-y-2">
        <p className="font-medium text-xs">Peças e serviços</p>
        {items.map((item, index) => (
          <div
            key={item.key}
            className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border p-2 sm:grid-cols-[2fr_0.6fr_1fr_0.8fr_auto]"
          >
            <Input
              aria-label={`Item ${index + 1}`}
              placeholder="Ex.: Filtro de óleo"
              value={item.name}
              onChange={(e) => updateItem(item.key, { name: e.target.value })}
              className="col-span-1 text-xs"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Remover item"
              className="sm:order-last"
              onClick={() =>
                setItems((prev) =>
                  prev.length === 1
                    ? [newRow()]
                    : prev.filter(({ key }) => key !== item.key)
                )
              }
            >
              <Trash2 />
            </Button>
            <div className="col-span-2 grid grid-cols-3 gap-2 sm:col-span-3 sm:col-start-2 sm:row-start-1">
              <Input
                aria-label="Quantidade"
                inputMode="decimal"
                placeholder="Qtd."
                value={item.quantity}
                onChange={(e) =>
                  updateItem(item.key, { quantity: e.target.value })
                }
                className="text-xs"
              />
              <Input
                aria-label="Preço unitário"
                inputMode="numeric"
                placeholder="R$ unit."
                value={item.unitPrice}
                onChange={(e) =>
                  updateItem(item.key, {
                    unitPrice: formatCurrencyInput(e.target.value)
                  })
                }
                className="text-xs"
              />
              <Input
                aria-label="Garantia em meses"
                inputMode="numeric"
                placeholder="Garantia (meses)"
                value={item.warrantyMonths}
                onChange={(e) =>
                  updateItem(item.key, {
                    warrantyMonths: e.target.value.replace(/\D/g, '')
                  })
                }
                className="text-xs"
              />
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setItems((prev) => [...prev, newRow()])}
        >
          <Plus /> Adicionar item
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField id="maintenance-labor" label="Mão de obra (R$)">
          <Input
            id="maintenance-labor"
            inputMode="numeric"
            placeholder="0,00"
            value={laborCost}
            onChange={(e) => setLaborCost(formatCurrencyInput(e.target.value))}
          />
        </FormField>
        <div className="flex flex-col justify-end rounded-lg bg-muted/50 p-2 text-xs">
          <span className="text-muted-foreground">
            Peças {formatCurrency(partsCost)}
          </span>
          <span className="font-semibold text-sm">
            Total {formatCurrency(total)}
          </span>
        </div>
        <FormField
          id="maintenance-notes"
          label="Observações"
          className="col-span-2"
        >
          <Input
            id="maintenance-notes"
            placeholder="Opcional"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </FormField>
        <FormField
          id="maintenance-invoice"
          label={
            maintenance?.hasInvoice
              ? 'Substituir nota fiscal'
              : 'Nota fiscal / OS'
          }
          hint="Foto ou PDF, até 10 MB"
          className="col-span-2"
        >
          <label
            htmlFor="maintenance-invoice"
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-muted-foreground text-xs hover:bg-muted"
          >
            <Paperclip className="size-3.5" />
            <span className="truncate">
              {invoice ? invoice.name : 'Anexar arquivo'}
            </span>
          </label>
          <input
            id="maintenance-invoice"
            type="file"
            accept="image/*,application/pdf"
            className="sr-only"
            onChange={(e) => handleInvoiceChange(e.target.files?.[0] ?? null)}
          />
        </FormField>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="size-3.5 animate-spin" />}
        {maintenance ? 'Salvar alterações' : 'Registrar manutenção'}
      </Button>
    </form>
  )
}
