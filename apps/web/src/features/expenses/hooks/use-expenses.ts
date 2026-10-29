import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { VEHICLES_QUERY_KEY } from '@/features/vehicles/hooks/use-vehicles'
import { queryClient } from '@/shared/providers/query-client'

import {
  createExpense,
  deleteExpense,
  listExpenseSuggestions,
  listExpenses,
  updateExpense
} from '../api'
import type {
  CreateExpenseDTO,
  ExpenseSuggestionsParams,
  ListExpensesParams,
  UpdateExpenseDTO
} from '../api/types'

export const EXPENSES_QUERY_KEY = 'expenses'

/** Uma despesa com km pode subir o odômetro do veículo */
function invalidateAfterWrite() {
  queryClient.invalidateQueries({ queryKey: [EXPENSES_QUERY_KEY] })
  queryClient.invalidateQueries({ queryKey: [VEHICLES_QUERY_KEY] })
}

export function useExpenses(params?: ListExpensesParams, enabled = true) {
  return useQuery({
    queryKey: [EXPENSES_QUERY_KEY, 'list', params],
    queryFn: () => listExpenses(params),
    placeholderData: (prev) => prev,
    enabled
  })
}

export function useExpenseSuggestions(params: ExpenseSuggestionsParams | null) {
  return useQuery({
    queryKey: [EXPENSES_QUERY_KEY, 'suggestions', params],
    queryFn: () => listExpenseSuggestions(params as ExpenseSuggestionsParams),
    enabled: !!params
  })
}

export function useCreateExpense() {
  return useMutation({
    mutationFn: (dto: CreateExpenseDTO) => createExpense(dto),
    onSuccess: () => {
      invalidateAfterWrite()
      toast.success('Despesa registrada!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao registrar despesa')
    }
  })
}

export function useUpdateExpense() {
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateExpenseDTO }) =>
      updateExpense(id, dto),
    onSuccess: () => {
      invalidateAfterWrite()
      toast.success('Despesa atualizada!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar despesa')
    }
  })
}

export function useDeleteExpense() {
  return useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => {
      invalidateAfterWrite()
      toast.success('Despesa excluída!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir despesa')
    }
  })
}
