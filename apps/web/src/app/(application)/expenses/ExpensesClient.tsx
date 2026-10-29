'use client'

import { Button } from '@lib/ui/components/button'
import { ConfirmDeleteDialog } from '@lib/ui/components/ConfirmDeleteDialog'
import { FilterSelect } from '@lib/ui/components/FilterSelect'
import { Input } from '@lib/ui/components/input'
import { Skeleton } from '@lib/ui/components/skeleton'
import { Plus, Receipt, Search } from 'lucide-react'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { useState } from 'react'

import {
  EXPENSE_CATEGORIES,
  type Expense,
  type ExpenseCategory
} from '@/features/expenses/api/types'
import { ExpenseFormDialog } from '@/features/expenses/components/ExpenseFormDialog'
import { ExpenseList } from '@/features/expenses/components/ExpenseList'
import {
  useDeleteExpense,
  useExpenses
} from '@/features/expenses/hooks/use-expenses'
import { EXPENSE_CATEGORY_LABELS } from '@/features/expenses/utils/category-labels'
import { useActiveVehicle } from '@/features/vehicles/hooks/use-active-vehicle'
import { EmptyState } from '@/shared/components/EmptyState'
import { NoVehicleState } from '@/shared/components/NoVehicleState'
import { PageHeader } from '@/shared/components/PageHeader'
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value'
import { formatCurrency } from '@/shared/utils/format-currency'
import { parseYear, yearOptions } from '@/shared/utils/year-options'

const ALL_CATEGORIES = 'all'

const CATEGORY_OPTIONS = [
  { value: ALL_CATEGORIES, label: 'Todas as categorias' },
  ...EXPENSE_CATEGORIES.map((value) => ({
    value,
    label: EXPENSE_CATEGORY_LABELS[value]
  }))
]

export default function ExpensesClient() {
  const { vehicle, isLoading: isLoadingVehicle } = useActiveVehicle()

  const [year, setYear] = useQueryState(
    'year',
    parseAsString.withDefault(String(new Date().getFullYear()))
  )
  const [categoryFilter, setCategoryFilter] = useQueryState(
    'category',
    parseAsString.withDefault(ALL_CATEGORIES)
  )
  const [search, setSearch] = useQueryState('q', parseAsString.withDefault(''))
  const [isCreating, setIsCreating] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false)
  )
  const [editing, setEditing] = useState<Expense | null>(null)
  const [deleting, setDeleting] = useState<Expense | null>(null)

  const debouncedSearch = useDebouncedValue(search)
  const category =
    categoryFilter === ALL_CATEGORIES
      ? undefined
      : (categoryFilter as ExpenseCategory)

  const { data: expenses = [], isLoading } = useExpenses(
    {
      vehicleId: vehicle?.id,
      category,
      year: parseYear(year),
      search: debouncedSearch.trim() || undefined
    },
    !!vehicle
  )
  const { mutateAsync: deleteExpense, isPending: isDeleting } =
    useDeleteExpense()

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  if (isLoadingVehicle) {
    return (
      <main className="container mx-auto flex flex-col gap-4 p-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40" />
      </main>
    )
  }

  if (!vehicle) {
    return (
      <main className="container mx-auto flex flex-col gap-4 p-4">
        <PageHeader title="Despesas" />
        <NoVehicleState />
      </main>
    )
  }

  return (
    <main className="container mx-auto flex flex-col gap-4 p-4 pb-24">
      <PageHeader
        title="Despesas"
        description={`${vehicle.name} · pedágios, estacionamento, IPVA, seguro e mais`}
        action={
          <Button onClick={() => setIsCreating(true)}>
            <Plus /> Nova despesa
          </Button>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <FilterSelect value={year} onChange={setYear} options={yearOptions()} />
        <FilterSelect
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={CATEGORY_OPTIONS}
        />
        <div className="relative sm:w-64">
          <Search className="absolute top-2.5 left-2.5 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar descrição ou local"
            value={search}
            onChange={(e) => setSearch(e.target.value || null)}
            className="h-9 pl-8 text-xs"
          />
        </div>
        <span className="text-muted-foreground text-xs sm:ml-auto">
          Total:{' '}
          <span className="font-semibold text-foreground">
            {formatCurrency(total)}
          </span>
        </span>
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Nenhuma despesa encontrada"
          description="As despesas que você mais repete viram atalhos no formulário."
          action={
            <Button onClick={() => setIsCreating(true)}>
              <Plus /> Registrar despesa
            </Button>
          }
        />
      ) : (
        <ExpenseList
          expenses={expenses}
          onEdit={setEditing}
          onDelete={setDeleting}
        />
      )}

      <ExpenseFormDialog
        open={isCreating || !!editing}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreating(null)
            setEditing(null)
          }
        }}
        vehicle={vehicle}
        expense={editing}
        defaultCategory={category}
      />

      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir despesa"
        itemName={deleting?.description ?? ''}
        confirmLabel="Excluir"
        isPending={isDeleting}
        onConfirm={async () => {
          if (!deleting) return
          await deleteExpense(deleting.id)
          setDeleting(null)
        }}
      />
    </main>
  )
}
