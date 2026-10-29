'use client'

import { Button } from '@lib/ui/components/button'
import { FilterSelect } from '@lib/ui/components/FilterSelect'
import { Input } from '@lib/ui/components/input'
import { cn } from '@lib/ui/lib/utils'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { Vehicle } from '@/features/vehicles/api/types'
import { FormField } from '@/shared/components/FormField'
import { ResponsiveDialog } from '@/shared/components/ResponsiveDialog'
import { formatCurrency } from '@/shared/utils/format-currency'
import { formatCurrencyInput } from '@/shared/utils/format-currency-input'
import {
  toDateInputValue,
  todayDateInputValue
} from '@/shared/utils/format-date'
import { parseValue } from '@/shared/utils/parse-value'
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  type PaymentMethod
} from '@/shared/utils/payment-methods'

import {
  EXPENSE_CATEGORIES,
  type Expense,
  type ExpenseCategory,
  type ExpenseSuggestion
} from '../../api/types'
import {
  useCreateExpense,
  useExpenseSuggestions,
  useUpdateExpense
} from '../../hooks/use-expenses'
import {
  EXPENSE_CATEGORY_ICONS,
  EXPENSE_CATEGORY_LABELS
} from '../../utils/category-labels'

interface ExpenseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicle: Vehicle
  /** Sem despesa, o formulário registra uma nova */
  expense?: Expense | null
  defaultCategory?: ExpenseCategory
}

const NO_PAYMENT = 'NONE'

const CATEGORY_OPTIONS = EXPENSE_CATEGORIES.map((value) => ({
  value,
  label: EXPENSE_CATEGORY_LABELS[value]
}))

const PAYMENT_OPTIONS = [
  { value: NO_PAYMENT, label: 'Não informado' },
  ...PAYMENT_METHODS.map((value) => ({
    value,
    label: PAYMENT_METHOD_LABELS[value]
  }))
]

function toCurrencyInput(value: number) {
  return formatCurrencyInput(value.toFixed(2))
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  vehicle,
  expense,
  defaultCategory
}: ExpenseFormDialogProps) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={expense ? 'Editar despesa' : 'Nova despesa'}
      description={vehicle.name}
    >
      {open && (
        <ExpenseForm
          key={expense?.id ?? 'new'}
          vehicle={vehicle}
          expense={expense}
          defaultCategory={defaultCategory}
          onDone={() => onOpenChange(false)}
        />
      )}
    </ResponsiveDialog>
  )
}

function ExpenseForm({
  vehicle,
  expense,
  defaultCategory,
  onDone
}: {
  vehicle: Vehicle
  expense?: Expense | null
  defaultCategory?: ExpenseCategory
  onDone: () => void
}) {
  const [category, setCategory] = useState<ExpenseCategory>(
    expense?.category ?? defaultCategory ?? 'TOLL'
  )
  const [date, setDate] = useState(
    expense ? toDateInputValue(expense.date) : todayDateInputValue()
  )
  const [amount, setAmount] = useState(
    expense ? toCurrencyInput(expense.amount) : ''
  )
  const [description, setDescription] = useState(expense?.description ?? '')
  const [locationOrRoute, setLocationOrRoute] = useState(
    expense?.locationOrRoute ?? ''
  )
  const [odometerKm, setOdometerKm] = useState(
    expense?.odometerKm != null ? String(expense.odometerKm) : ''
  )
  const [paymentMethod, setPaymentMethod] = useState<string>(
    expense?.paymentMethod ?? NO_PAYMENT
  )

  const { data: suggestions = [] } = useExpenseSuggestions(
    expense ? null : { vehicleId: vehicle.id }
  )
  const { mutateAsync: createExpense, isPending: isCreating } =
    useCreateExpense()
  const { mutateAsync: updateExpense, isPending: isUpdating } =
    useUpdateExpense()
  const isPending = isCreating || isUpdating

  function applySuggestion(suggestion: ExpenseSuggestion) {
    setCategory(suggestion.category)
    setDescription(suggestion.description)
    setAmount(toCurrencyInput(suggestion.amount))
    setLocationOrRoute(suggestion.locationOrRoute ?? '')
    setPaymentMethod(suggestion.paymentMethod ?? NO_PAYMENT)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const amountValue = parseValue(amount)
    const odometer = odometerKm.trim()
      ? Number(odometerKm.replace(/\D/g, ''))
      : null

    if (!date) {
      toast.error('Informe a data')
      return
    }

    if (amountValue <= 0) {
      toast.error('Informe o valor')
      return
    }

    if (!description.trim()) {
      toast.error('Descreva a despesa (ex.: Pedágio Bandeirantes)')
      return
    }

    if (odometer !== null && odometer < vehicle.initialOdometerKm) {
      toast.error(
        `O km não pode ser menor que o de cadastro do carro (${vehicle.initialOdometerKm.toLocaleString('pt-BR')} km)`
      )
      return
    }

    const dto = {
      category,
      date,
      amount: amountValue,
      description: description.trim(),
      locationOrRoute: locationOrRoute.trim() || null,
      odometerKm: odometer,
      paymentMethod:
        paymentMethod === NO_PAYMENT ? null : (paymentMethod as PaymentMethod)
    }

    try {
      if (expense) {
        await updateExpense({ id: expense.id, dto })
      } else {
        await createExpense({ ...dto, vehicleId: vehicle.id })
      }

      onDone()
    } catch {
      // o erro já é exibido pelo toast do hook
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
      {suggestions.length > 0 && (
        <div className="col-span-2 space-y-1.5">
          <p className="text-[11px] text-muted-foreground">
            Mais frequentes (toque para preencher)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((suggestion) => {
              const Icon = EXPENSE_CATEGORY_ICONS[suggestion.category]
              const selected =
                description === suggestion.description &&
                parseValue(amount) === suggestion.amount

              return (
                <button
                  key={`${suggestion.category}-${suggestion.description}-${suggestion.amount}`}
                  type="button"
                  onClick={() => applySuggestion(suggestion)}
                  className={cn(
                    'inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors hover:bg-muted',
                    selected && 'border-primary bg-primary/10'
                  )}
                >
                  <Icon className="size-3 shrink-0 text-muted-foreground" />
                  <span className="truncate">{suggestion.description}</span>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(suggestion.amount)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
      <FormField id="expense-category" label="Categoria">
        <FilterSelect
          value={category}
          onChange={(value) => setCategory(value as ExpenseCategory)}
          options={CATEGORY_OPTIONS}
          className="sm:w-full"
        />
      </FormField>
      <FormField id="expense-amount" label="Valor (R$)">
        <Input
          id="expense-amount"
          inputMode="numeric"
          placeholder="0,00"
          value={amount}
          onChange={(e) => setAmount(formatCurrencyInput(e.target.value))}
        />
      </FormField>
      <FormField
        id="expense-description"
        label="Descrição"
        className="col-span-2"
      >
        <Input
          id="expense-description"
          placeholder="Ex.: Pedágio Bandeirantes, IPVA 1ª parcela"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </FormField>
      <FormField id="expense-date" label="Data">
        <Input
          id="expense-date"
          type="date"
          value={date}
          max={todayDateInputValue()}
          onChange={(e) => setDate(e.target.value)}
        />
      </FormField>
      <FormField id="expense-payment" label="Pagamento">
        <FilterSelect
          value={paymentMethod}
          onChange={setPaymentMethod}
          options={PAYMENT_OPTIONS}
          className="sm:w-full"
        />
      </FormField>
      <FormField id="expense-location" label="Local / rota">
        <Input
          id="expense-location"
          placeholder="Opcional"
          value={locationOrRoute}
          onChange={(e) => setLocationOrRoute(e.target.value)}
        />
      </FormField>
      <FormField
        id="expense-odometer"
        label="Km do painel"
        hint="Opcional; atualiza o km do carro"
      >
        <Input
          id="expense-odometer"
          inputMode="numeric"
          placeholder={String(vehicle.currentOdometerKm)}
          value={odometerKm}
          onChange={(e) => setOdometerKm(e.target.value)}
        />
      </FormField>
      <Button type="submit" disabled={isPending} className="col-span-2">
        {isPending && <Loader2 className="size-3.5 animate-spin" />}
        {expense ? 'Salvar alterações' : 'Registrar despesa'}
      </Button>
    </form>
  )
}
