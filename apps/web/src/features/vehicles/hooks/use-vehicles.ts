import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { queryClient } from '@/shared/providers/query-client'

import {
  createVehicle,
  deleteVehicle,
  getVehicleById,
  listVehicles,
  updateVehicle
} from '../api'
import type {
  CreateVehicleDTO,
  ListVehiclesParams,
  UpdateVehicleDTO
} from '../api/types'

export const VEHICLES_QUERY_KEY = 'vehicles'

export function useVehicles(params?: ListVehiclesParams) {
  return useQuery({
    queryKey: [VEHICLES_QUERY_KEY, params],
    queryFn: () => listVehicles(params),
    placeholderData: (prev) => prev
  })
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: [VEHICLES_QUERY_KEY, id],
    queryFn: () => getVehicleById(id),
    enabled: !!id
  })
}

export function useCreateVehicle() {
  return useMutation({
    mutationFn: (dto: CreateVehicleDTO) => createVehicle(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VEHICLES_QUERY_KEY] })
      toast.success('Veículo cadastrado com sucesso!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao cadastrar veículo')
    }
  })
}

export function useUpdateVehicle() {
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateVehicleDTO }) =>
      updateVehicle(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VEHICLES_QUERY_KEY] })
      toast.success('Veículo atualizado com sucesso!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar veículo')
    }
  })
}

export function useDeleteVehicle() {
  return useMutation({
    mutationFn: (id: string) => deleteVehicle(id),
    onSuccess: () => {
      // Abastecimentos e despesas do veículo saem junto (cascade)
      queryClient.invalidateQueries()
      toast.success('Veículo excluído com sucesso!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir veículo')
    }
  })
}
