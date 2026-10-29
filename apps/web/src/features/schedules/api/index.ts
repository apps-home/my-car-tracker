import { apiClient } from '@/infrastructure/services/api-client'

import type {
  CreateResponse,
  CreateScheduleDTO,
  ListSchedulesParams,
  MutationResponse,
  Schedule,
  ScheduleTemplate,
  SeedDefaultSchedulesDTO,
  SeedDefaultSchedulesResponse,
  UpdateScheduleDTO
} from './types'

const BASE_URL = '/schedules'

export async function listSchedules(
  params?: ListSchedulesParams
): Promise<Schedule[]> {
  const response = await apiClient.get<Schedule[]>(BASE_URL, { params })
  return response.data
}

export async function listScheduleTemplates(): Promise<ScheduleTemplate[]> {
  const response = await apiClient.get<ScheduleTemplate[]>(
    `${BASE_URL}/templates`
  )
  return response.data
}

export async function createSchedule(
  dto: CreateScheduleDTO
): Promise<CreateResponse> {
  const response = await apiClient.post<CreateResponse>(BASE_URL, dto)
  return response.data
}

export async function seedDefaultSchedules(
  dto: SeedDefaultSchedulesDTO
): Promise<SeedDefaultSchedulesResponse> {
  const response = await apiClient.post<SeedDefaultSchedulesResponse>(
    `${BASE_URL}/seed-defaults`,
    dto
  )
  return response.data
}

export async function updateSchedule(
  id: string,
  dto: UpdateScheduleDTO
): Promise<MutationResponse> {
  const response = await apiClient.patch<MutationResponse>(
    `${BASE_URL}/${id}`,
    dto
  )
  return response.data
}

export async function deleteSchedule(id: string): Promise<MutationResponse> {
  const response = await apiClient.delete<MutationResponse>(`${BASE_URL}/${id}`)
  return response.data
}
