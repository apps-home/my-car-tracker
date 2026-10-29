'use client'

import { Button } from '@lib/ui/components/button'
import { Checkbox } from '@lib/ui/components/checkbox'
import { FilterSelect } from '@lib/ui/components/FilterSelect'
import { Input } from '@lib/ui/components/input'
import { Label } from '@lib/ui/components/label'
import { Skeleton } from '@lib/ui/components/skeleton'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import {
  FUEL_TYPES,
  type FuelType,
  type Vehicle
} from '@/features/vehicles/api/types'
import { FUEL_TYPE_LABELS } from '@/features/vehicles/utils/fuel-type-labels'
import { FormField } from '@/shared/components/FormField'
import { ResponsiveDialog } from '@/shared/components/ResponsiveDialog'
import { formatCurrency } from '@/shared/utils/format-currency'
import {
  toDateInputValue,
  todayDateInputValue
} from '@/shared/utils/format-date'
import { parseDecimal, toDecimalInput } from '@/shared/utils/parse-decimal'
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  type PaymentMethod
} from '@/shared/utils/payment-methods'

import type { FuelLog } from '../../api/types'
import {
  useCreateFuelLog,
  useFuelLogs,
  useUpdateFuelLog
} from '../../hooks/use-fuel-logs'

interface FuelLogFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicle: Vehicle
  /** Sem abastecimento, o formulário registra um novo */
  fuelLog?: FuelLog | null
}

const NO_PAYMENT = 'NONE'

const FUEL_TYPE_OPTIONS = FUEL_TYPES.map((value) => ({
  value,
  label: FUEL_TYPE_LABELS[value]
}))

const PAYMENT_OPTIONS = [
  { value: NO_PAYMENT, label: 'Não informado' },
  ...PAYMENT_METHODS.map((value) => ({
    value,
    label: PAYMENT_METHOD_LABELS[value]
  }))
]

function round(value: number, digits: number) {
  const factor = 10 ** digits
  return Math.round((value + Number.EPSILON) * factor) / factor
}

export function FuelLogFormDialog({
  open,
  onOpenChange,
  vehicle,
  fuelLog
}: FuelLogFormDialogProps) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={fuelLog ? 'Editar abastecimento' : 'Novo abastecimento'}
      description={vehicle.name}
    >
      {open && (
        <FuelLogFormLoader
          key={fuelLog?.id ?? 'new'}
          vehicle={vehicle}
          fuelLog={fuelLog}
          onDone={() => onOpenChange(false)}
        />
      )}
    </ResponsiveDialog>
  )
}

/** Espera o último abastecimento para sugerir o combustível usado da última vez */
function FuelLogFormLoader({
  vehicle,
  fuelLog,
  onDone
}: {
  vehicle: Vehicle
  fuelLog?: FuelLog | null
  onDone: () => void
}) {
  const { data: fuelLogs, isLoading } = useFuelLogs(
    { vehicleId: vehicle.id },
    !fuelLog
  )

  if (!fuelLog && isLoading) {
    return (
      <div className="grid gap-3">
        <Skeleton className="h-9" />
        <Skeleton className="h-9" />
        <Skeleton className="h-9" />
      </div>
    )
  }

  return (
    <FuelLogForm
      vehicle={vehicle}
      fuelLog={fuelLog}
      lastFuelType={fuelLogs?.[0]?.fuelType}
      onDone={onDone}
    />
  )
}

function FuelLogForm({
  vehicle,
  fuelLog,
  lastFuelType,
  onDone
}: {
  vehicle: Vehicle
  fuelLog?: FuelLog | null
  lastFuelType?: FuelType
  onDone: () => void
}) {
  const [date, setDate] = useState(
    fuelLog ? toDateInputValue(fuelLog.date) : todayDateInputValue()
  )
  const [odometerKm, setOdometerKm] = useState(
    fuelLog ? String(fuelLog.odometerKm) : ''
  )
  const [fuelType, setFuelType] = useState<FuelType>(
    fuelLog?.fuelType ?? lastFuelType ?? vehicle.defaultFuelType
  )
  const [liters, setLiters] = useState(toDecimalInput(fuelLog?.liters, 3))
  const [price, setPrice] = useState(toDecimalInput(fuelLog?.pricePerLiter, 3))
  const [total, setTotal] = useState(toDecimalInput(fuelLog?.totalCost, 2))
  // Qual dos dois o usuário digitou por último decide o que é calculado
  const [lastEdited, setLastEdited] = useState<'liters' | 'total'>('liters')
  const [isFullTank, setIsFullTank] = useState(fuelLog?.isFullTank ?? true)
  const [gasStationName, setGasStationName] = useState(
    fuelLog?.gasStationName ?? ''
  )
  const [paymentMethod, setPaymentMethod] = useState<string>(
    fuelLog?.paymentMethod ?? NO_PAYMENT
  )

  const { mutateAsync: createFuelLog, isPending: isCreating } =
    useCreateFuelLog()
  const { mutateAsync: updateFuelLog, isPending: isUpdating } =
    useUpdateFuelLog()
  const isPending = isCreating || isUpdating

  function handleLitersChange(value: string) {
    setLiters(value)
    setLastEdited('liters')

    const litersValue = parseDecimal(value)
    const priceValue = parseDecimal(price)

    if (litersValue && priceValue) {
      setTotal(toDecimalInput(round(litersValue * priceValue, 2), 2))
    }
  }

  function handlePriceChange(value: string) {
    setPrice(value)

    const priceValue = parseDecimal(value)
    if (!priceValue) return

    const litersValue = parseDecimal(liters)
    const totalValue = parseDecimal(total)

    if (lastEdited === 'total' && totalValue) {
      setLiters(toDecimalInput(round(totalValue / priceValue, 3), 3))
    } else if (litersValue) {
      setTotal(toDecimalInput(round(litersValue * priceValue, 2), 2))
    }
  }

  function handleTotalChange(value: string) {
    setTotal(value)
    setLastEdited('total')

    const totalValue = parseDecimal(value)
    const priceValue = parseDecimal(price)

    if (totalValue && priceValue) {
      setLiters(toDecimalInput(round(totalValue / priceValue, 3), 3))
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const odometer = Number(odometerKm.replace(/\D/g, ''))
    const litersValue = parseDecimal(liters)
    const priceValue = parseDecimal(price)
    const totalValue = parseDecimal(total)

    if (!date) {
      toast.error('Informe a data')
      return
    }

    if (!odometerKm.trim() || !Number.isInteger(odometer)) {
      toast.error('Informe o km do painel')
      return
    }

    if (odometer < vehicle.initialOdometerKm) {
      toast.error(
        `O km não pode ser menor que o de cadastro do carro (${vehicle.initialOdometerKm.toLocaleString('pt-BR')} km)`
      )
      return
    }

    if (!litersValue || litersValue <= 0 || !priceValue || priceValue <= 0) {
      toast.error('Informe os litros e o preço por litro')
      return
    }

    const dto = {
      date,
      odometerKm: odometer,
      fuelType,
      liters: round(litersValue, 3),
      pricePerLiter: round(priceValue, 3),
      totalCost:
        totalValue && totalValue > 0
          ? round(totalValue, 2)
          : round(litersValue * priceValue, 2),
      isFullTank,
      gasStationName: gasStationName.trim() || null,
      paymentMethod:
        paymentMethod === NO_PAYMENT ? null : (paymentMethod as PaymentMethod)
    }

    try {
      if (fuelLog) {
        await updateFuelLog({ id: fuelLog.id, dto })
      } else {
        await createFuelLog({ ...dto, vehicleId: vehicle.id })
      }

      onDone()
    } catch {
      // o erro já é exibido pelo toast do hook
    }
  }

  const totalPreview = parseDecimal(total)

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
      <FormField id="fuel-date" label="Data">
        <Input
          id="fuel-date"
          type="date"
          value={date}
          max={todayDateInputValue()}
          onChange={(e) => setDate(e.target.value)}
        />
      </FormField>
      <FormField
        id="fuel-odometer"
        label="Km do painel"
        hint={`Atual: ${vehicle.currentOdometerKm.toLocaleString('pt-BR')} km`}
      >
        <Input
          id="fuel-odometer"
          inputMode="numeric"
          placeholder={`≥ ${vehicle.currentOdometerKm}`}
          value={odometerKm}
          onChange={(e) => setOdometerKm(e.target.value)}
          autoFocus={!fuelLog}
        />
      </FormField>
      <FormField id="fuel-type" label="Combustível" className="col-span-2">
        <FilterSelect
          value={fuelType}
          onChange={(value) => setFuelType(value as FuelType)}
          options={FUEL_TYPE_OPTIONS}
          className="sm:w-full"
        />
      </FormField>
      <FormField id="fuel-liters" label="Litros">
        <Input
          id="fuel-liters"
          inputMode="decimal"
          placeholder="42,35"
          value={liters}
          onChange={(e) => handleLitersChange(e.target.value)}
        />
      </FormField>
      <FormField id="fuel-price" label="Preço por litro">
        <Input
          id="fuel-price"
          inputMode="decimal"
          placeholder="5,899"
          value={price}
          onChange={(e) => handlePriceChange(e.target.value)}
        />
      </FormField>
      <FormField
        id="fuel-total"
        label="Total pago"
        hint={totalPreview ? formatCurrency(totalPreview) : 'Calculado sozinho'}
      >
        <Input
          id="fuel-total"
          inputMode="decimal"
          placeholder="249,82"
          value={total}
          onChange={(e) => handleTotalChange(e.target.value)}
        />
      </FormField>
      <div className="flex items-center gap-2 self-center pt-4">
        <Checkbox
          id="fuel-full-tank"
          checked={isFullTank}
          onCheckedChange={(checked) => setIsFullTank(checked === true)}
        />
        <Label htmlFor="fuel-full-tank" className="text-xs">
          Completei o tanque
        </Label>
      </div>
      <FormField id="fuel-station" label="Posto">
        <Input
          id="fuel-station"
          placeholder="Opcional"
          value={gasStationName}
          onChange={(e) => setGasStationName(e.target.value)}
        />
      </FormField>
      <FormField id="fuel-payment" label="Pagamento">
        <FilterSelect
          value={paymentMethod}
          onChange={setPaymentMethod}
          options={PAYMENT_OPTIONS}
          className="sm:w-full"
        />
      </FormField>
      <p className="col-span-2 text-[11px] text-muted-foreground">
        O consumo (km/L) é calculado entre dois tanques cheios. Abastecimentos
        parciais entram na conta do próximo tanque cheio.
      </p>
      <Button type="submit" disabled={isPending} className="col-span-2">
        {isPending && <Loader2 className="size-3.5 animate-spin" />}
        {fuelLog ? 'Salvar alterações' : 'Registrar abastecimento'}
      </Button>
    </form>
  )
}
