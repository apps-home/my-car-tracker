import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { ANALYTICS_QUERY_KEY } from '@/features/dashboard/hooks/use-analytics'
import { SCHEDULES_QUERY_KEY } from '@/features/schedules/hooks/use-schedules'
import { VEHICLES_QUERY_KEY } from '@/features/vehicles/hooks/use-vehicles'
import { queryClient } from '@/shared/providers/query-client'

import {
  createFuelLog,
  deleteFuelLog,
  getFuelLogSummary,
  listFuelLogs,
  updateFuelLog
} from '../api'
import type {
  CreateFuelLogDTO,
  FuelLogSummaryParams,
  ListFuelLogsParams,
  UpdateFuelLogDTO
} from '../api/types'

export const FUEL_LOGS_QUERY_KEY = 'fuel-logs'

/** Um abastecimento muda o consumo dos vizinhos, o km do veículo e os planos */
function invalidateAfterWrite() {
  queryClient.invalidateQueries({ queryKey: [FUEL_LOGS_QUERY_KEY] })
  queryClient.invalidateQueries({ queryKey: [VEHICLES_QUERY_KEY] })
  queryClient.invalidateQueries({ queryKey: [SCHEDULES_QUERY_KEY] })
  queryClient.invalidateQueries({ queryKey: [ANALYTICS_QUERY_KEY] })
}

export function useFuelLogs(params?: ListFuelLogsParams, enabled = true) {
  return useQuery({
    queryKey: [FUEL_LOGS_QUERY_KEY, 'list', params],
    queryFn: () => listFuelLogs(params),
    placeholderData: (prev) => prev,
    enabled
  })
}

export function useFuelLogSummary(params: FuelLogSummaryParams | null) {
  return useQuery({
    queryKey: [FUEL_LOGS_QUERY_KEY, 'summary', params],
    queryFn: () => getFuelLogSummary(params as FuelLogSummaryParams),
    placeholderData: (prev) => prev,
    enabled: !!params
  })
}

export function useCreateFuelLog() {
  return useMutation({
    mutationFn: (dto: CreateFuelLogDTO) => createFuelLog(dto),
    onSuccess: () => {
      invalidateAfterWrite()
      toast.success('Abastecimento registrado!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao registrar abastecimento')
    }
  })
}

export function useUpdateFuelLog() {
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateFuelLogDTO }) =>
      updateFuelLog(id, dto),
    onSuccess: () => {
      invalidateAfterWrite()
      toast.success('Abastecimento atualizado!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar abastecimento')
    }
  })
}

export function useDeleteFuelLog() {
  return useMutation({
    mutationFn: (id: string) => deleteFuelLog(id),
    onSuccess: () => {
      invalidateAfterWrite()
      toast.success('Abastecimento excluído!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir abastecimento')
    }
  })
}
