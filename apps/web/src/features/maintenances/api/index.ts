import { apiClient } from '@/infrastructure/services/api-client'

import type {
  ActiveWarranty,
  CreateMaintenanceDTO,
  CreateMaintenanceTaskDTO,
  CreateResponse,
  InvoiceUrl,
  ListMaintenancesParams,
  Maintenance,
  MaintenanceTask,
  MutationResponse,
  UpdateMaintenanceDTO,
  UpdateMaintenanceTaskDTO
} from './types'

const BASE_URL = '/maintenances'

export async function listMaintenances(
  params?: ListMaintenancesParams
): Promise<Maintenance[]> {
  const response = await apiClient.get<Maintenance[]>(BASE_URL, { params })
  return response.data
}

export async function listActiveWarranties(params?: {
  vehicleId?: string
}): Promise<ActiveWarranty[]> {
  const response = await apiClient.get<ActiveWarranty[]>(
    `${BASE_URL}/warranties`,
    { params }
  )
  return response.data
}

export async function createMaintenance(
  dto: CreateMaintenanceDTO
): Promise<CreateResponse> {
  const response = await apiClient.post<CreateResponse>(BASE_URL, dto)
  return response.data
}

export async function updateMaintenance(
  id: string,
  dto: UpdateMaintenanceDTO
): Promise<MutationResponse> {
  const response = await apiClient.patch<MutationResponse>(
    `${BASE_URL}/${id}`,
    dto
  )
  return response.data
}

export async function deleteMaintenance(id: string): Promise<MutationResponse> {
  const response = await apiClient.delete<MutationResponse>(`${BASE_URL}/${id}`)
  return response.data
}

/** Foto ou PDF da nota fiscal / OS */
export async function uploadMaintenanceInvoice(
  id: string,
  file: File
): Promise<MutationResponse> {
  const data = new FormData()
  data.append('file', file)

  const response = await apiClient.post<MutationResponse>(
    `${BASE_URL}/${id}/upload-invoice`,
    data,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return response.data
}

/** Link assinado e temporário para baixar a nota */
export async function getMaintenanceInvoiceUrl(
  id: string
): Promise<InvoiceUrl> {
  const response = await apiClient.get<InvoiceUrl>(`${BASE_URL}/${id}/invoice`)
  return response.data
}

export async function listMaintenanceTasks(params?: {
  vehicleId?: string
  includeCompleted?: boolean
}): Promise<MaintenanceTask[]> {
  const response = await apiClient.get<MaintenanceTask[]>(
    `${BASE_URL}/tasks`,
    { params }
  )
  return response.data
}

export async function createMaintenanceTask(
  dto: CreateMaintenanceTaskDTO
): Promise<CreateResponse> {
  const response = await apiClient.post<CreateResponse>(
    `${BASE_URL}/tasks`,
    dto
  )
  return response.data
}

export async function updateMaintenanceTask(
  id: string,
  dto: UpdateMaintenanceTaskDTO
): Promise<MutationResponse> {
  const response = await apiClient.patch<MutationResponse>(
    `${BASE_URL}/tasks/${id}`,
    dto
  )
  return response.data
}

export async function deleteMaintenanceTask(
  id: string
): Promise<MutationResponse> {
  const response = await apiClient.delete<MutationResponse>(
    `${BASE_URL}/tasks/${id}`
  )
  return response.data
}
