import { apiClient } from '@/infrastructure/services/api-client'

import type {
  CreateFuelLogDTO,
  CreateResponse,
  FuelLog,
  FuelLogSummary,
  FuelLogSummaryParams,
  ListFuelLogsParams,
  MutationResponse,
  UpdateFuelLogDTO
} from './types'

const BASE_URL = '/fuel-logs'

export async function listFuelLogs(
  params?: ListFuelLogsParams
): Promise<FuelLog[]> {
  const response = await apiClient.get<FuelLog[]>(BASE_URL, { params })
  return response.data
}

export async function getFuelLogSummary(
  params: FuelLogSummaryParams
): Promise<FuelLogSummary> {
  const response = await apiClient.get<FuelLogSummary>(`${BASE_URL}/summary`, {
    params
  })
  return response.data
}

export async function getFuelLogById(id: string): Promise<FuelLog> {
  const response = await apiClient.get<FuelLog>(`${BASE_URL}/${id}`)
  return response.data
}

export async function createFuelLog(
  dto: CreateFuelLogDTO
): Promise<CreateResponse> {
  const response = await apiClient.post<CreateResponse>(BASE_URL, dto)
  return response.data
}

export async function updateFuelLog(
  id: string,
  dto: UpdateFuelLogDTO
): Promise<MutationResponse> {
  const response = await apiClient.patch<MutationResponse>(
    `${BASE_URL}/${id}`,
    dto
  )
  return response.data
}

export async function deleteFuelLog(id: string): Promise<MutationResponse> {
  const response = await apiClient.delete<MutationResponse>(`${BASE_URL}/${id}`)
  return response.data
}
