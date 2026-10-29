'use client'

import { Button } from '@lib/ui/components/button'
import { FilterSelect } from '@lib/ui/components/FilterSelect'
import { Input } from '@lib/ui/components/input'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { Vehicle } from '@/features/vehicles/api/types'
import { FormField } from '@/shared/components/FormField'
import { ResponsiveDialog } from '@/shared/components/ResponsiveDialog'
import {
  toDateInputValue,
  todayDateInputValue
} from '@/shared/utils/format-date'

import {
  SCHEDULE_TRIGGER_RULES,
  type Schedule,
  type ScheduleTriggerRule
} from '../../api/types'
import { useCreateSchedule, useUpdateSchedule } from '../../hooks/use-schedules'
import { TRIGGER_RULE_LABELS } from '../../utils/schedule-labels'

interface ScheduleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicle: Vehicle
  schedule?: Schedule | null
}

const RULE_OPTIONS = SCHEDULE_TRIGGER_RULES.map((value) => ({
  value,
  label: TRIGGER_RULE_LABELS[value]
}))

function toInt(value: string): number | null {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : null
}

export function ScheduleFormDialog({
  open,
  onOpenChange,
  vehicle,
  schedule
}: ScheduleFormDialogProps) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={schedule ? 'Editar plano' : 'Novo plano preventivo'}
      description="Avisamos pelo que vencer primeiro: tempo ou quilometragem."
    >
      {open && (
        <ScheduleForm
          key={schedule?.id ?? 'new'}
          vehicle={vehicle}
          schedule={schedule}
          onDone={() => onOpenChange(false)}
        />
      )}
    </ResponsiveDialog>
  )
}

function ScheduleForm({
  vehicle,
  schedule,
  onDone
}: {
  vehicle: Vehicle
  schedule?: Schedule | null
  onDone: () => void
}) {
  const [title, setTitle] = useState(schedule?.title ?? '')
  const [description, setDescription] = useState(schedule?.description ?? '')
  const [triggerRule, setTriggerRule] = useState<ScheduleTriggerRule>(
    schedule?.triggerRule ?? 'WHICHEVER_COMES_FIRST'
  )
  const [intervalMonths, setIntervalMonths] = useState(
    schedule?.intervalMonths ? String(schedule.intervalMonths) : ''
  )
  const [intervalKm, setIntervalKm] = useState(
    schedule?.intervalKm ? String(schedule.intervalKm) : ''
  )
  const [lastExecutedAt, setLastExecutedAt] = useState(
    schedule?.lastExecutedAt
      ? toDateInputValue(schedule.lastExecutedAt)
      : todayDateInputValue()
  )
  const [lastExecutedOdometerKm, setLastExecutedOdometerKm] = useState(
    String(schedule?.lastExecutedOdometerKm ?? vehicle.currentOdometerKm)
  )
  const [alertDaysBefore, setAlertDaysBefore] = useState(
    String(schedule?.alertDaysBefore ?? 30)
  )
  const [alertKmBefore, setAlertKmBefore] = useState(
    String(schedule?.alertKmBefore ?? 500)
  )

  const { mutateAsync: createSchedule, isPending: isCreating } =
    useCreateSchedule()
  const { mutateAsync: updateSchedule, isPending: isUpdating } =
    useUpdateSchedule()
  const isPending = isCreating || isUpdating

  const usesTime = triggerRule !== 'ODOMETER_ONLY'
  const usesKm = triggerRule !== 'TIME_ONLY'

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const months = toInt(intervalMonths)
    const km = toInt(intervalKm)
    const lastKm = toInt(lastExecutedOdometerKm)

    if (!title.trim()) {
      toast.error('Dê um nome ao plano (ex.: Troca de óleo)')
      return
    }

    if (usesTime && !months) {
      toast.error('Informe o intervalo em meses')
      return
    }

    if (usesKm && !km) {
      toast.error('Informe o intervalo em km')
      return
    }

    if (lastKm === null || lastKm > vehicle.currentOdometerKm) {
      toast.error(
        `O km da última execução vai até o km atual (${vehicle.currentOdometerKm.toLocaleString('pt-BR')} km)`
      )
      return
    }

    const dto = {
      title: title.trim(),
      description: description.trim() || null,
      triggerRule,
      intervalMonths: usesTime ? months : null,
      intervalKm: usesKm ? km : null,
      lastExecutedAt,
      lastExecutedOdometerKm: lastKm,
      alertDaysBefore: toInt(alertDaysBefore) ?? 30,
      alertKmBefore: toInt(alertKmBefore) ?? 500
    }

    try {
      if (schedule) {
        await updateSchedule({ id: schedule.id, dto })
      } else {
        await createSchedule({ ...dto, vehicleId: vehicle.id })
      }

      onDone()
    } catch {
      // o erro já é exibido pelo toast do hook
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
      <FormField id="schedule-title" label="Plano" className="col-span-2">
        <Input
          id="schedule-title"
          placeholder="Ex.: Troca de óleo e filtro"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus={!schedule}
        />
      </FormField>
      <FormField id="schedule-rule" label="Vence por" className="col-span-2">
        <FilterSelect
          value={triggerRule}
          onChange={(value) => setTriggerRule(value as ScheduleTriggerRule)}
          options={RULE_OPTIONS}
          className="sm:w-full"
        />
      </FormField>
      {usesTime && (
        <FormField id="schedule-months" label="A cada (meses)">
          <Input
            id="schedule-months"
            inputMode="numeric"
            placeholder="6"
            value={intervalMonths}
            onChange={(e) => setIntervalMonths(e.target.value)}
          />
        </FormField>
      )}
      {usesKm && (
        <FormField id="schedule-km" label="A cada (km)">
          <Input
            id="schedule-km"
            inputMode="numeric"
            placeholder="10000"
            value={intervalKm}
            onChange={(e) => setIntervalKm(e.target.value)}
          />
        </FormField>
      )}
      <FormField
        id="schedule-last-date"
        label="Última execução"
        hint="Se não lembra, deixe hoje"
      >
        <Input
          id="schedule-last-date"
          type="date"
          max={todayDateInputValue()}
          value={lastExecutedAt}
          onChange={(e) => setLastExecutedAt(e.target.value)}
        />
      </FormField>
      <FormField id="schedule-last-km" label="Km na última execução">
        <Input
          id="schedule-last-km"
          inputMode="numeric"
          value={lastExecutedOdometerKm}
          onChange={(e) => setLastExecutedOdometerKm(e.target.value)}
        />
      </FormField>
      {usesTime && (
        <FormField id="schedule-alert-days" label="Avisar faltando (dias)">
          <Input
            id="schedule-alert-days"
            inputMode="numeric"
            value={alertDaysBefore}
            onChange={(e) => setAlertDaysBefore(e.target.value)}
          />
        </FormField>
      )}
      {usesKm && (
        <FormField id="schedule-alert-km" label="Avisar faltando (km)">
          <Input
            id="schedule-alert-km"
            inputMode="numeric"
            value={alertKmBefore}
            onChange={(e) => setAlertKmBefore(e.target.value)}
          />
        </FormField>
      )}
      <FormField
        id="schedule-description"
        label="Especificação"
        className="col-span-2"
      >
        <Input
          id="schedule-description"
          placeholder="Opcional (ex.: 4L de 5W30 API SP)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </FormField>
      <Button type="submit" disabled={isPending} className="col-span-2">
        {isPending && <Loader2 className="size-3.5 animate-spin" />}
        {schedule ? 'Salvar alterações' : 'Criar plano'}
      </Button>
    </form>
  )
}
