import { Skeleton } from '@lib/ui/components/skeleton'
import { Droplet, Fuel, Gauge, Wallet } from 'lucide-react'

import { StatCard } from '@/shared/components/StatCard'
import { formatCurrency } from '@/shared/utils/format-currency'
import { formatDecimal, formatKm } from '@/shared/utils/format-number'

import type { FuelLogSummary } from '../../api/types'

interface FuelSummaryCardsProps {
  summary?: FuelLogSummary
  isLoading: boolean
}

export function FuelSummaryCards({
  summary,
  isLoading
}: FuelSummaryCardsProps) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-20" />
        ))}
      </div>
    )
  }

  return (
    <div
      data-slot="fuel-summary-cards"
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
    >
      <StatCard
        icon={Wallet}
        label="Gasto com combustível"
        value={formatCurrency(summary.totalCost)}
        hint={
          summary.totalReimbursed > 0
            ? `Seu bolso: ${formatCurrency(summary.netCost)} (ajuda ${formatCurrency(summary.totalReimbursed)})`
            : `${summary.count} abastecimento${summary.count === 1 ? '' : 's'}`
        }
      />
      <StatCard
        icon={Gauge}
        label="Consumo médio"
        value={
          summary.consumptionKmPerLiter !== null
            ? `${formatDecimal(summary.consumptionKmPerLiter)} km/L`
            : '—'
        }
        hint={
          summary.distanceKm > 0
            ? `${formatKm(summary.distanceKm)} medidos`
            : 'Precisa de 2 tanques cheios'
        }
      />
      <StatCard
        icon={Fuel}
        label="Custo por km"
        value={
          summary.costPerKm !== null ? formatCurrency(summary.costPerKm) : '—'
        }
        hint="Só combustível"
      />
      <StatCard
        icon={Droplet}
        label="Litros"
        value={`${formatDecimal(summary.totalLiters, 1)} L`}
        hint={
          summary.averagePricePerLiter !== null
            ? `Média ${formatCurrency(summary.averagePricePerLiter)}/L`
            : undefined
        }
      />
    </div>
  )
}
