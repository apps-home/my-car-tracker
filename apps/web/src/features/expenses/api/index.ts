import { apiClient } from '@/infrastructure/services/api-client'

import type {
  CreateExpenseDTO,
  CreateResponse,
  Expense,
  ExpenseSuggestion,
  ExpenseSuggestionsParams,
  ListExpensesParams,
  MutationResponse,
  UpdateExpenseDTO
} from './types'

const BASE_URL = '/expenses'

export async function listExpenses(
  params?: ListExpensesParams
): Promise<Expense[]> {
  const response = await apiClient.get<Expense[]>(BASE_URL, { params })
  return response.data
}

export async function listExpenseSuggestions(
  params: ExpenseSuggestionsParams
): Promise<ExpenseSuggestion[]> {
  const response = await apiClient.get<ExpenseSuggestion[]>(
    `${BASE_URL}/suggestions`,
    { params }
  )
  return response.data
}

export async function getExpenseById(id: string): Promise<Expense> {
  const response = await apiClient.get<Expense>(`${BASE_URL}/${id}`)
  return response.data
}

export async function createExpense(
  dto: CreateExpenseDTO
): Promise<CreateResponse> {
  const response = await apiClient.post<CreateResponse>(BASE_URL, dto)
  return response.data
}

export async function updateExpense(
  id: string,
  dto: UpdateExpenseDTO
): Promise<MutationResponse> {
  const response = await apiClient.patch<MutationResponse>(
    `${BASE_URL}/${id}`,
    dto
  )
  return response.data
}

export async function deleteExpense(id: string): Promise<MutationResponse> {
  const response = await apiClient.delete<MutationResponse>(`${BASE_URL}/${id}`)
  return response.data
}
