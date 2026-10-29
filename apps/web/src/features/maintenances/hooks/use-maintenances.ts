import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { ANALYTICS_QUERY_KEY } from '@/features/dashboard/hooks/use-analytics'
import { SCHEDULES_QUERY_KEY } from '@/features/schedules/hooks/use-schedules'
import { VEHICLES_QUERY_KEY } from '@/features/vehicles/hooks/use-vehicles'
import { queryClient } from '@/shared/providers/query-client'

import {
  createMaintenance,
  createMaintenanceTask,
  deleteMaintenance,
  deleteMaintenanceTask,
  getMaintenanceInvoiceUrl,
  listActiveWarranties,
  listMaintenanceTasks,
  listMaintenances,
  updateMaintenance,
  updateMaintenanceTask,
  uploadMaintenanceInvoice
} from '../api'
import type {
  CreateMaintenanceDTO,
  CreateMaintenanceTaskDTO,
  ListMaintenancesParams,
  UpdateMaintenanceDTO,
  UpdateMaintenanceTaskDTO
} from '../api/types'

export const MAINTENANCES_QUERY_KEY = 'maintenances'

/** Uma manutenção renova planos e pode subir o km do veículo */
function invalidateAfterWrite() {
  queryClient.invalidateQueries({ queryKey: [MAINTENANCES_QUERY_KEY] })
  queryClient.invalidateQueries({ queryKey: [SCHEDULES_QUERY_KEY] })
  queryClient.invalidateQueries({ queryKey: [VEHICLES_QUERY_KEY] })
  queryClient.invalidateQueries({ queryKey: [ANALYTICS_QUERY_KEY] })
}

export function useMaintenances(
  params?: ListMaintenancesParams,
  enabled = true
) {
  return useQuery({
    queryKey: [MAINTENANCES_QUERY_KEY, 'list', params],
    queryFn: () => listMaintenances(params),
    placeholderData: (prev) => prev,
    enabled
  })
}

export function useActiveWarranties(vehicleId?: string) {
  return useQuery({
    queryKey: [MAINTENANCES_QUERY_KEY, 'warranties', vehicleId],
    queryFn: () => listActiveWarranties({ vehicleId }),
    enabled: !!vehicleId
  })
}

export function useMaintenanceTasks(vehicleId?: string) {
  return useQuery({
    queryKey: [MAINTENANCES_QUERY_KEY, 'tasks', vehicleId],
    queryFn: () => listMaintenanceTasks({ vehicleId }),
    enabled: !!vehicleId
  })
}

export function useCreateMaintenanceTask() {
  return useMutation({
    mutationFn: (dto: CreateMaintenanceTaskDTO) => createMaintenanceTask(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [MAINTENANCES_QUERY_KEY, 'tasks']
      })
      toast.success('Pendência adicionada!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao adicionar pendência')
    }
  })
}

export function useUpdateMaintenanceTask() {
  return useMutation({
    mutationFn: ({
      id,
      dto
    }: {
      id: string
      dto: UpdateMaintenanceTaskDTO
    }) => updateMaintenanceTask(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [MAINTENANCES_QUERY_KEY, 'tasks']
      })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar pendência')
    }
  })
}

export function useDeleteMaintenanceTask() {
  return useMutation({
    mutationFn: (id: string) => deleteMaintenanceTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [MAINTENANCES_QUERY_KEY, 'tasks']
      })
      toast.success('Pendência removida!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao remover pendência')
    }
  })
}

/**
 * Salva a manutenção e, se houver arquivo, envia a nota em seguida.
 * Falha só no upload mantém a manutenção salva e avisa.
 */
export function useSaveMaintenance() {
  return useMutation({
    mutationFn: async ({
      id,
      dto,
      invoice
    }: {
      id?: string
      dto: CreateMaintenanceDTO | UpdateMaintenanceDTO
      invoice?: File | null
    }) => {
      let savedId = id

      if (savedId) {
        await updateMaintenance(savedId, dto)
      } else {
        savedId = (await createMaintenance(dto as CreateMaintenanceDTO)).id
      }

      if (invoice) {
        try {
          await uploadMaintenanceInvoice(savedId, invoice)
        } catch (error: any) {
          toast.error(
            `Manutenção salva, mas a nota não subiu: ${error.message || 'tente de novo'}`
          )
        }
      }

      return { id: savedId, isNew: !id }
    },
    onSuccess: ({ isNew }) => {
      invalidateAfterWrite()
      toast.success(isNew ? 'Manutenção registrada!' : 'Manutenção atualizada!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao salvar manutenção')
    }
  })
}

export function useDeleteMaintenance() {
  return useMutation({
    mutationFn: (id: string) => deleteMaintenance(id),
    onSuccess: () => {
      invalidateAfterWrite()
      toast.success('Manutenção excluída!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir manutenção')
    }
  })
}

/**
 * Abre a nota numa aba nova. A aba é aberta no próprio toque e só depois recebe
 * o link assinado: o Safari do iPhone bloqueia `window.open` após um `await`.
 */
export async function openMaintenanceInvoice(id: string) {
  const tab = window.open('about:blank', '_blank')

  try {
    const { url } = await getMaintenanceInvoiceUrl(id)

    if (tab) tab.location.href = url
    else window.location.href = url
  } catch (error: any) {
    tab?.close()
    toast.error(error.message || 'Erro ao abrir a nota')
  }
}
