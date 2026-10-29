import { apiClient } from '@/infrastructure/services/api-client'

import type {
  CreateResponse,
  CreateVehicleDTO,
  ListVehiclesParams,
  MutationResponse,
  UpdateVehicleDTO,
  Vehicle
} from './types'

const BASE_URL = '/vehicles'

export async function listVehicles(
  params?: ListVehiclesParams
): Promise<Vehicle[]> {
  const response = await apiClient.get<Vehicle[]>(BASE_URL, { params })
  return response.data
}

export async function getVehicleById(id: string): Promise<Vehicle> {
  const response = await apiClient.get<Vehicle>(`${BASE_URL}/${id}`)
  return response.data
}

export async function createVehicle(
  dto: CreateVehicleDTO
): Promise<CreateResponse> {
  const response = await apiClient.post<CreateResponse>(BASE_URL, dto)
  return response.data
}

export async function updateVehicle(
  id: string,
  dto: UpdateVehicleDTO
): Promise<MutationResponse> {
  const response = await apiClient.patch<MutationResponse>(
    `${BASE_URL}/${id}`,
    dto
  )
  return response.data
}

export async function deleteVehicle(id: string): Promise<MutationResponse> {
  const response = await apiClient.delete<MutationResponse>(`${BASE_URL}/${id}`)
  return response.data
}
