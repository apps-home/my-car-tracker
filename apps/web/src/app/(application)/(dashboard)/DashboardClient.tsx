'use client'

import { Skeleton } from '@lib/ui/components/skeleton'
import { CalendarDays, Fuel, Gauge, Route } from 'lucide-react'

import { MonthlyCostChart } from '@/features/dashboard/components/MonthlyCostChart'
import { RecentEntries } from '@/features/dashboard/components/RecentEntries'
import { buildMonthlyCosts } from '@/features/dashboard/utils/monthly-costs'
import { useExpenses } from '@/features/expenses/hooks/use-expenses'
import { EthanolComparatorCard } from '@/features/fuel-logs/components/EthanolComparatorCard'
import {
  useFuelLogSummary,
  useFuelLogs
} from '@/features/fuel-logs/hooks/use-fuel-logs'
import { useActiveVehicle } from '@/features/vehicles/hooks/use-active-vehicle'
import { NoVehicleState } from '@/shared/components/NoVehicleState'
import { PageHeader } from '@/shared/components/PageHeader'
import { StatCard } from '@/shared/components/StatCard'
import { formatCurrency } from '@/shared/utils/format-currency'
import { formatDecimal, formatKm } from '@/shared/utils/format-number'
import { MONTH_NAMES } from '@/shared/utils/month-names'

export default function DashboardClient() {
  const { vehicle, isLoading: isLoadingVehicle } = useActiveVehicle()

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const { data: fuelLogs = [], isLoading: isLoadingFuel } = useFuelLogs(
    { vehicleId: vehicle?.id, year },
    !!vehicle
  )
  const { data: expenses = [], isLoading: isLoadingExpenses } = useExpenses(
    { vehicleId: vehicle?.id, year },
    !!vehicle
  )
  const { data: yearSummary } = useFuelLogSummary(
    vehicle ? { vehicleId: vehicle.id, year } : null
  )
  const { data: allTimeSummary } = useFuelLogSummary(
    vehicle ? { vehicleId: vehicle.id } : null
  )

  if (isLoadingVehicle) {
    return (
      <main className="container mx-auto flex flex-col gap-4 p-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-20" />
          ))}
        </div>
      </main>
    )
  }

  if (!vehicle) {
    return (
      <main className="container mx-auto flex flex-col gap-4 p-4">
        <PageHeader
          title="Bem-vindo ao My Car Tracker"
          description="Abastecimentos, despesas e manutenções do seu carro em um lugar."
        />
        <NoVehicleState />
      </main>
    )
  }

  const monthlyCosts = buildMonthlyCosts(fuelLogs, expenses)
  const currentMonth = monthlyCosts[month]
  const isLoadingData = isLoadingFuel || isLoadingExpenses

  return (
    <main className="container mx-auto flex flex-col gap-4 p-4 pb-24">
      <PageHeader
        title={vehicle.name}
        description={`${vehicle.brand} ${vehicle.model} ${vehicle.modelYear}`}
      />

      {isLoadingData ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-20" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={CalendarDays}
            label={`Gasto em ${MONTH_NAMES[month].toLowerCase()}`}
            value={formatCurrency(currentMonth.total)}
            hint={`Combustível ${formatCurrency(currentMonth.fuel)}`}
          />
          <StatCard
            icon={Gauge}
            label={`Consumo médio em ${year}`}
            value={
              yearSummary?.consumptionKmPerLiter != null
                ? `${formatDecimal(yearSummary.consumptionKmPerLiter)} km/L`
                : '—'
            }
            hint="Entre tanques cheios"
          />
          <StatCard
            icon={Fuel}
            label="Combustível por km"
            value={
              yearSummary?.costPerKm != null
                ? formatCurrency(yearSummary.costPerKm)
                : '—'
            }
            hint={`Em ${year}`}
          />
          <StatCard
            icon={Route}
            label="Km atual"
            value={formatKm(vehicle.currentOdometerKm)}
            hint={`${formatKm(vehicle.currentOdometerKm - vehicle.initialOdometerKm)} desde o cadastro`}
          />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MonthlyCostChart data={monthlyCosts} year={year} />
        </div>
        <RecentEntries fuelLogs={fuelLogs} expenses={expenses} />
      </div>

      {allTimeSummary && <EthanolComparatorCard summary={allTimeSummary} />}
    </main>
  )
}
