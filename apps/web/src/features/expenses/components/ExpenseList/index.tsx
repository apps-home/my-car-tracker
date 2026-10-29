'use client'

import { Badge } from '@lib/ui/components/badge'
import { Button } from '@lib/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@lib/ui/components/dropdown-menu'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'

import { formatCurrency } from '@/shared/utils/format-currency'
import { formatDate } from '@/shared/utils/format-date'
import { formatKm } from '@/shared/utils/format-number'
import { PAYMENT_METHOD_LABELS } from '@/shared/utils/payment-methods'

import type { Expense } from '../../api/types'
import {
  EXPENSE_CATEGORY_ICONS,
  EXPENSE_CATEGORY_LABELS
} from '../../utils/category-labels'

interface ExpenseListProps {
  expenses: Expense[]
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}

export function ExpenseList({ expenses, onEdit, onDelete }: ExpenseListProps) {
  return (
    <ul data-slot="expense-list" className="divide-y rounded-lg border bg-card">
      {expenses.map((expense) => {
        const Icon = EXPENSE_CATEGORY_ICONS[expense.category]

        return (
          <li key={expense.id} className="flex items-start gap-3 p-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
              <Icon className="size-4 text-muted-foreground" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate font-medium text-sm">
                  {expense.description}
                </span>
                <Badge variant="outline">
                  {EXPENSE_CATEGORY_LABELS[expense.category]}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs">
                {formatDate(expense.date)}
                {expense.locationOrRoute && ` · ${expense.locationOrRoute}`}
                {expense.odometerKm !== null &&
                  ` · ${formatKm(expense.odometerKm)}`}
                {expense.paymentMethod &&
                  ` · ${PAYMENT_METHOD_LABELS[expense.paymentMethod]}`}
              </p>
            </div>
            <span className="font-semibold text-sm tabular-nums">
              {formatCurrency(expense.amount)}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon-sm" aria-label="Ações" />
                }
              >
                <MoreVertical />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36 p-1">
                <DropdownMenuItem
                  onClick={() => onEdit(expense)}
                  className="gap-2 py-2"
                >
                  <Pencil /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(expense)}
                  className="gap-2 py-2 text-destructive"
                >
                  <Trash2 /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        )
      })}
    </ul>
  )
}
