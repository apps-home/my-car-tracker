'use client'

import { FilterSelect } from '@lib/ui/components/FilterSelect'
import { Skeleton } from '@lib/ui/components/skeleton'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@lib/ui/components/tabs'
import {
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  Fuel,
  Gauge,
  LayoutDashboard,
  Route,
  Wrench
} from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { Activity } from 'react'

import { MaintenanceAlertsCard } from '@/features/dashboard/components/MaintenanceAlertsCard'
import { MonthlyCostChart } from '@/features/dashboard/components/MonthlyCostChart'
import { RecentEntries } from '@/features/dashboard/components/RecentEntries'
import { TcoBreakdownCard } from '@/features/dashboard/components/TcoBreakdownCard'
import {
  useAnalyticsOverview,
  useMonthlyCosts
} from '@/features/dashboard/hooks/use-analytics'
import {
  buildMonthlyCosts,
  toMonthlyCostSeries
} from '@/features/dashboard/utils/monthly-costs'
import { useExpenses } from '@/features/expenses/hooks/use-expenses'
import { EthanolComparatorCard } from '@/features/fuel-logs/components/EthanolComparatorCard'
import {
  useFuelLogSummary,
  useFuelLogs
} from '@/features/fuel-logs/hooks/use-fuel-logs'
import { useMaintenances } from '@/features/maintenances/hooks/use-maintenances'
import { useSchedules } from '@/features/schedules/hooks/use-schedules'
import { useActiveVehicle } from '@/features/vehicles/hooks/use-active-vehicle'
import { NoVehicleState } from '@/shared/components/NoVehicleState'
import { PageHeader } from '@/shared/components/PageHeader'
import { StatCard } from '@/shared/components/StatCard'
import { formatCurrency } from '@/shared/utils/format-currency'
import { formatDecimal, formatKm } from '@/shared/utils/format-number'
import { MONTH_NAMES } from '@/shared/utils/month-names'
import { ALL_YEARS, parseYear, yearOptions } from '@/shared/utils/year-options'

const TABS = {
  OVERVIEW: 'overview',
  ANALYTICS: 'analytics'
} as const

export default function DashboardClient() {
  const { vehicle, isLoading: isLoadingVehicle } = useActiveVehicle()

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonthIndex = now.getMonth()

  const [tab, setTab] = useQueryState(
    'tab',
    parseAsString.withDefault(TABS.OVERVIEW)
  )
  const [analyticsYear, setAnalyticsYear] = useQueryState(
    'year',
    parseAsString.withDefault(ALL_YEARS)
  )

  const selectedYearNumber = parseYear(analyticsYear)
  const chartYear = selectedYearNumber ?? currentYear

  const { data: fuelLogs = [], isLoading: isLoadingFuel } = useFuelLogs(
    { vehicleId: vehicle?.id, year: currentYear },
    !!vehicle
  )
  const { data: expenses = [], isLoading: isLoadingExpenses } = useExpenses(
    { vehicleId: vehicle?.id, year: currentYear },
    !!vehicle
  )
  const { data: maintenances = [], isLoading: isLoadingMaintenances } =
    useMaintenances({ vehicleId: vehicle?.id, year: currentYear }, !!vehicle)
  const { data: schedules = [] } = useSchedules(
    { vehicleId: vehicle?.id },
    !!vehicle
  )
  const { data: yearSummary } = useFuelLogSummary(
    vehicle ? { vehicleId: vehicle.id, year: currentYear } : null
  )
  const { data: allTimeSummary } = useFuelLogSummary(
    vehicle ? { vehicleId: vehicle.id } : null
  )

  const { data: overview, isLoading: isLoadingOverview } = useAnalyticsOverview(
    vehicle ? { vehicleId: vehicle.id, year: selectedYearNumber } : null
  )
  const { data: monthlyCostsResponse } = useMonthlyCosts(
    vehicle ? { vehicleId: vehicle.id, year: chartYear } : null
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

  const monthlyCosts = buildMonthlyCosts(fuelLogs, expenses, maintenances)
  const currentMonth = monthlyCosts[currentMonthIndex]
  const isLoadingData =
    isLoadingFuel || isLoadingExpenses || isLoadingMaintenances

  const analyticsChartData = monthlyCostsResponse
    ? toMonthlyCostSeries(monthlyCostsResponse.months)
    : monthlyCosts

  return (
    <main className="container mx-auto flex flex-col gap-4 p-4 pb-24">
      <PageHeader
        title={vehicle.name}
        description={`${vehicle.brand} ${vehicle.model} ${vehicle.modelYear}`}
      />

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value)}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-1">
          <TabsList variant="line" className="gap-4">
            <TabsTrigger
              value={TABS.OVERVIEW}
              className="cursor-pointer gap-1.5"
            >
              <LayoutDashboard className="size-3.5" />
              Visão geral
            </TabsTrigger>
            <TabsTrigger
              value={TABS.ANALYTICS}
              className="cursor-pointer gap-1.5"
            >
              <BarChart3 className="size-3.5" />
              Análise e TCO
            </TabsTrigger>
          </TabsList>

          {tab === TABS.ANALYTICS && (
            <FilterSelect
              value={analyticsYear}
              onChange={setAnalyticsYear}
              options={yearOptions()}
            />
          )}
        </div>

        <TabsContent
          value={TABS.OVERVIEW}
          className="flex flex-col gap-4"
          keepMounted
        >
          <Activity mode={tab === TABS.OVERVIEW ? 'visible' : 'hidden'}>
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
                  label={`Gasto em ${MONTH_NAMES[currentMonthIndex].toLowerCase()}`}
                  value={formatCurrency(currentMonth.total)}
                  hint={`Combustível ${formatCurrency(currentMonth.fuel)}`}
                />
                <StatCard
                  icon={Gauge}
                  label={`Consumo médio em ${currentYear}`}
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
                  hint={`Em ${currentYear}`}
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
                <MonthlyCostChart data={monthlyCosts} year={currentYear} />
              </div>
              <RecentEntries
                fuelLogs={fuelLogs}
                expenses={expenses}
                maintenances={maintenances}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <MaintenanceAlertsCard schedules={schedules} />
              {allTimeSummary && (
                <EthanolComparatorCard summary={allTimeSummary} />
              )}
            </div>
          </Activity>
        </TabsContent>

        <TabsContent
          value={TABS.ANALYTICS}
          className="flex flex-col gap-4"
          keepMounted
        >
          <Activity mode={tab === TABS.ANALYTICS ? 'visible' : 'hidden'}>
            {isLoadingOverview || !overview ? (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className="h-20" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <StatCard
                    icon={CircleDollarSign}
                    label={
                      selectedYearNumber
                        ? `TCO em ${selectedYearNumber}`
                        : 'Custo total (TCO)'
                    }
                    value={formatCurrency(overview.totalCost)}
                    hint={
                      overview.totalFuelReimbursed > 0
                        ? `Seu bolso: ${formatCurrency(overview.netTotalCost)} (ajuda ${formatCurrency(overview.totalFuelReimbursed)})`
                        : overview.monthlyAverageCost != null
                          ? `Média de ${formatCurrency(overview.monthlyAverageCost)}/mês`
                          : `${overview.totalEntriesCount} registros`
                    }
                  />
                  <StatCard
                    icon={Gauge}
                    label="Custo total por km"
                    value={
                      overview.totalCostPerKm != null
                        ? formatCurrency(overview.totalCostPerKm)
                        : '—'
                    }
                    hint={
                      overview.fuelCostPerKm != null
                        ? `Combustível: ${formatCurrency(overview.fuelCostPerKm)}/km`
                        : 'Todos os gastos ÷ km'
                    }
                  />
                  <StatCard
                    icon={Wrench}
                    label="Total em oficina"
                    value={formatCurrency(
                      overview.maintenanceBreakdown.totalAmount
                    )}
                    hint={`Peças ${formatCurrency(overview.maintenanceBreakdown.partsCost)} · M.O. ${formatCurrency(overview.maintenanceBreakdown.laborCost)}`}
                  />
                  <StatCard
                    icon={Route}
                    label="Distância no período"
                    value={formatKm(overview.distanceDrivenKm)}
                    hint={
                      overview.consumptionKmPerLiter != null
                        ? `Consumo médio ${formatDecimal(overview.consumptionKmPerLiter)} km/L`
                        : `${overview.totalEntriesCount} lançamentos`
                    }
                  />
                </div>

                <TcoBreakdownCard overview={overview} />

                <MonthlyCostChart data={analyticsChartData} year={chartYear} />
              </>
            )}
          </Activity>
        </TabsContent>
      </Tabs>
    </main>
  )
}
