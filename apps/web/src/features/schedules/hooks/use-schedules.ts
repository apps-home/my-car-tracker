import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { queryClient } from '@/shared/providers/query-client'

import {
  createSchedule,
  deleteSchedule,
  listSchedules,
  listScheduleTemplates,
  seedDefaultSchedules,
  updateSchedule
} from '../api'
import type {
  CreateScheduleDTO,
  ListSchedulesParams,
  SeedDefaultSchedulesDTO,
  UpdateScheduleDTO
} from '../api/types'

export const SCHEDULES_QUERY_KEY = 'schedules'

export function useSchedules(params?: ListSchedulesParams, enabled = true) {
  return useQuery({
    queryKey: [SCHEDULES_QUERY_KEY, 'list', params],
    queryFn: () => listSchedules(params),
    placeholderData: (prev) => prev,
    enabled
  })
}

export function useScheduleTemplates() {
  return useQuery({
    queryKey: [SCHEDULES_QUERY_KEY, 'templates'],
    queryFn: listScheduleTemplates,
    staleTime: Number.POSITIVE_INFINITY
  })
}

function invalidate() {
  queryClient.invalidateQueries({ queryKey: [SCHEDULES_QUERY_KEY] })
}

export function useCreateSchedule() {
  return useMutation({
    mutationFn: (dto: CreateScheduleDTO) => createSchedule(dto),
    onSuccess: () => {
      invalidate()
      toast.success('Plano criado!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar plano')
    }
  })
}

export function useSeedDefaultSchedules() {
  return useMutation({
    mutationFn: (dto: SeedDefaultSchedulesDTO) => seedDefaultSchedules(dto),
    onSuccess: ({ created }) => {
      invalidate()
      toast.success(
        created
          ? `${created} plano${created === 1 ? '' : 's'} ativado${created === 1 ? '' : 's'}!`
          : 'Esses planos já estavam ativos'
      )
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao ativar planos')
    }
  })
}

export function useUpdateSchedule() {
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateScheduleDTO }) =>
      updateSchedule(id, dto),
    onSuccess: () => {
      invalidate()
      toast.success('Plano atualizado!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar plano')
    }
  })
}

export function useDeleteSchedule() {
  return useMutation({
    mutationFn: (id: string) => deleteSchedule(id),
    onSuccess: () => {
      invalidate()
      toast.success('Plano excluído!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir plano')
    }
  })
}
