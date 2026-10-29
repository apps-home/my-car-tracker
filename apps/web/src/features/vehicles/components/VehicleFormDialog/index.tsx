'use client'

import { Button } from '@lib/ui/components/button'
import { FilterSelect } from '@lib/ui/components/FilterSelect'
import { Input } from '@lib/ui/components/input'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { FormField } from '@/shared/components/FormField'
import { ResponsiveDialog } from '@/shared/components/ResponsiveDialog'

import { FUEL_TYPES, type FuelType, type Vehicle } from '../../api/types'
import { setActiveVehicleId } from '../../hooks/use-active-vehicle'
import { useCreateVehicle, useUpdateVehicle } from '../../hooks/use-vehicles'
import { FUEL_TYPE_LABELS } from '../../utils/fuel-type-labels'

interface VehicleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Sem veículo, o formulário cadastra um novo */
  vehicle?: Vehicle | null
}

const FUEL_TYPE_OPTIONS = FUEL_TYPES.map((value) => ({
  value,
  label: FUEL_TYPE_LABELS[value]
}))

const PLATE_REGEX = /^[A-Z]{3}\d[A-Z\d]\d{2}$/

function toInt(value: string): number | null {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : null
}

function initialState(vehicle?: Vehicle | null) {
  return {
    name: vehicle?.name ?? '',
    brand: vehicle?.brand ?? '',
    model: vehicle?.model ?? '',
    modelYear: vehicle ? String(vehicle.modelYear) : '',
    manufactureYear: vehicle?.manufactureYear
      ? String(vehicle.manufactureYear)
      : '',
    licensePlate: vehicle?.licensePlate ?? '',
    color: vehicle?.color ?? '',
    odometerKm: vehicle ? String(vehicle.currentOdometerKm) : '',
    fuelTankCapacityLiters: vehicle?.fuelTankCapacityLiters
      ? String(vehicle.fuelTankCapacityLiters)
      : '',
    defaultFuelType: (vehicle?.defaultFuelType ??
      'GASOLINE_COMMON') as FuelType,
    notes: vehicle?.notes ?? ''
  }
}

export function VehicleFormDialog({
  open,
  onOpenChange,
  vehicle
}: VehicleFormDialogProps) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={vehicle ? 'Editar veículo' : 'Novo veículo'}
      description={
        vehicle
          ? 'O km atual também sobe sozinho a cada lançamento.'
          : 'O km de cadastro é o ponto de partida do histórico.'
      }
    >
      {/* key: o formulário recomeça a cada abertura */}
      {open && (
        <VehicleForm
          key={vehicle?.id ?? 'new'}
          vehicle={vehicle}
          onDone={() => onOpenChange(false)}
        />
      )}
    </ResponsiveDialog>
  )
}

function VehicleForm({
  vehicle,
  onDone
}: {
  vehicle?: Vehicle | null
  onDone: () => void
}) {
  const [form, setForm] = useState(() => initialState(vehicle))
  const { mutateAsync: createVehicle, isPending: isCreating } =
    useCreateVehicle()
  const { mutateAsync: updateVehicle, isPending: isUpdating } =
    useUpdateVehicle()
  const isPending = isCreating || isUpdating

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const modelYear = toInt(form.modelYear)
    const manufactureYear = toInt(form.manufactureYear)
    const odometerKm = toInt(form.odometerKm)
    const plate = form.licensePlate.replace(/[\s-]/g, '').toUpperCase()

    if (!form.name.trim() || !form.brand.trim() || !form.model.trim()) {
      toast.error('Preencha apelido, marca e modelo')
      return
    }

    if (!modelYear || modelYear < 1900) {
      toast.error('Informe o ano do modelo')
      return
    }

    if (manufactureYear && manufactureYear > modelYear) {
      toast.error('O ano de fabricação não pode ser depois do ano do modelo')
      return
    }

    if (odometerKm === null) {
      toast.error('Informe a quilometragem')
      return
    }

    if (plate && !PLATE_REGEX.test(plate)) {
      toast.error('Placa inválida (ex.: ABC1D23 ou ABC1234)')
      return
    }

    if (vehicle && odometerKm < vehicle.initialOdometerKm) {
      toast.error(
        `O km atual não pode ser menor que o de cadastro (${vehicle.initialOdometerKm.toLocaleString('pt-BR')} km)`
      )
      return
    }

    const common = {
      name: form.name.trim(),
      brand: form.brand.trim(),
      model: form.model.trim(),
      modelYear,
      manufactureYear,
      licensePlate: plate || null,
      color: form.color.trim() || null,
      fuelTankCapacityLiters: toInt(form.fuelTankCapacityLiters),
      defaultFuelType: form.defaultFuelType,
      notes: form.notes.trim() || null
    }

    try {
      if (vehicle) {
        await updateVehicle({
          id: vehicle.id,
          dto: { ...common, currentOdometerKm: odometerKm }
        })
      } else {
        const { id } = await createVehicle({
          ...common,
          initialOdometerKm: odometerKm
        })
        setActiveVehicleId(id)
      }

      onDone()
    } catch {
      // o erro já é exibido pelo toast do hook
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
      <FormField id="vehicle-name" label="Apelido" className="sm:col-span-2">
        <Input
          id="vehicle-name"
          placeholder="Ex.: Civic Touring"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          autoFocus
        />
      </FormField>
      <FormField id="vehicle-brand" label="Marca">
        <Input
          id="vehicle-brand"
          placeholder="Ex.: Honda"
          value={form.brand}
          onChange={(e) => set('brand', e.target.value)}
        />
      </FormField>
      <FormField id="vehicle-model" label="Modelo">
        <Input
          id="vehicle-model"
          placeholder="Ex.: Civic"
          value={form.model}
          onChange={(e) => set('model', e.target.value)}
        />
      </FormField>
      <FormField id="vehicle-model-year" label="Ano do modelo">
        <Input
          id="vehicle-model-year"
          inputMode="numeric"
          placeholder="2023"
          maxLength={4}
          value={form.modelYear}
          onChange={(e) => set('modelYear', e.target.value)}
        />
      </FormField>
      <FormField id="vehicle-manufacture-year" label="Ano de fabricação">
        <Input
          id="vehicle-manufacture-year"
          inputMode="numeric"
          placeholder="Opcional"
          maxLength={4}
          value={form.manufactureYear}
          onChange={(e) => set('manufactureYear', e.target.value)}
        />
      </FormField>
      <FormField id="vehicle-plate" label="Placa">
        <Input
          id="vehicle-plate"
          placeholder="ABC1D23"
          autoCapitalize="characters"
          maxLength={8}
          value={form.licensePlate}
          onChange={(e) => set('licensePlate', e.target.value.toUpperCase())}
        />
      </FormField>
      <FormField id="vehicle-color" label="Cor">
        <Input
          id="vehicle-color"
          placeholder="Opcional"
          value={form.color}
          onChange={(e) => set('color', e.target.value)}
        />
      </FormField>
      <FormField
        id="vehicle-odometer"
        label={vehicle ? 'Km atual' : 'Km no cadastro'}
      >
        <Input
          id="vehicle-odometer"
          inputMode="numeric"
          placeholder="Ex.: 45000"
          value={form.odometerKm}
          onChange={(e) => set('odometerKm', e.target.value)}
        />
      </FormField>
      <FormField id="vehicle-tank" label="Tanque (litros)">
        <Input
          id="vehicle-tank"
          inputMode="numeric"
          placeholder="Opcional"
          value={form.fuelTankCapacityLiters}
          onChange={(e) => set('fuelTankCapacityLiters', e.target.value)}
        />
      </FormField>
      <FormField
        id="vehicle-fuel"
        label="Combustível padrão"
        className="sm:col-span-2"
      >
        <FilterSelect
          value={form.defaultFuelType}
          onChange={(value) => set('defaultFuelType', value as FuelType)}
          options={FUEL_TYPE_OPTIONS}
          className="sm:w-full"
        />
      </FormField>
      <FormField
        id="vehicle-notes"
        label="Observações"
        className="sm:col-span-2"
      >
        <Input
          id="vehicle-notes"
          placeholder="Opcional"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
        />
      </FormField>
      <Button type="submit" disabled={isPending} className="sm:col-span-2">
        {isPending && <Loader2 className="size-3.5 animate-spin" />}
        {vehicle ? 'Salvar alterações' : 'Cadastrar veículo'}
      </Button>
    </form>
  )
}
