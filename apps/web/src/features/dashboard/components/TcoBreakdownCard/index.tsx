'use client'

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@lib/ui/components/card'

import {
	EXPENSE_CATEGORY_ICONS,
	EXPENSE_CATEGORY_LABELS
} from '@/features/expenses/utils/category-labels'
import { formatCurrency } from '@/shared/utils/format-currency'
import { formatDecimal } from '@/shared/utils/format-number'

import type { AnalyticsOverview } from '../../api/types'
import { COST_SERIES, type CostSeriesKey } from '../../utils/monthly-costs'

interface TcoBreakdownCardProps {
	overview: AnalyticsOverview
}

const SERIES_META = Object.fromEntries(
	COST_SERIES.map((series) => [series.key, series])
) as Record<CostSeriesKey, (typeof COST_SERIES)[number]>

export function TcoBreakdownCard({ overview }: TcoBreakdownCardProps) {
	const activeSeries = overview.bySeries
		.filter((item) => item.totalAmount > 0)
		.sort((a, b) => b.totalAmount - a.totalAmount)

	const sortedCategories = [...overview.byExpenseCategory].sort(
		(a, b) => b.totalAmount - a.totalAmount
	)

	const { maintenanceBreakdown } = overview

	return (
		<div
			data-slot="tco-breakdown-card"
			className="grid gap-4 lg:grid-cols-2"
		>
			<Card>
				<CardHeader>
					<CardTitle>Composição do TCO por grupo</CardTitle>
					<CardDescription>
						Participação de cada frente no custo total de{' '}
						<span className="font-semibold text-foreground">
							{formatCurrency(overview.totalCost)}
						</span>
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
					{activeSeries.length === 0 ? (
						<p className="text-muted-foreground text-xs">
							Nenhum gasto registrado no período selecionado.
						</p>
					) : (
						<>
							<div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
								{activeSeries.map((item) => {
									const meta = SERIES_META[item.series]
									return (
										<div
											key={item.series}
											style={{
												width: `${Math.max(item.sharePercent, 2)}%`,
												backgroundColor: meta.color
											}}
										/>
									)
								})}
							</div>
							<ul className="divide-y text-xs">
								{activeSeries.map((item) => {
									const meta = SERIES_META[item.series]
									return (
										<li
											key={item.series}
											className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0"
										>
											<span
												className="size-2.5 shrink-0 rounded-xs"
												style={{ backgroundColor: meta.color }}
											/>
											<div className="min-w-0 flex-1">
												<p className="truncate font-medium">{meta.label}</p>
												<p className="text-muted-foreground">
													{item.count}{' '}
													{item.count === 1 ? 'registro' : 'registros'}
												</p>
											</div>
											<div className="text-right tabular-nums">
												<p className="font-medium">
													{formatCurrency(item.totalAmount)}
												</p>
												<p className="text-muted-foreground">
													{formatDecimal(item.sharePercent, 1)}%
												</p>
											</div>
										</li>
									)
								})}
							</ul>
						</>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Detalhamento operacional e oficina</CardTitle>
					<CardDescription>
						Categorias de despesa e divisão entre peças e mão de obra
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4 text-xs">
					{maintenanceBreakdown.count > 0 && (
						<div className="rounded-lg border bg-muted/30 p-3">
							<div className="mb-2 flex items-center justify-between">
								<span className="font-medium">
									Oficina ({maintenanceBreakdown.count}{' '}
									{maintenanceBreakdown.count === 1 ? 'ida' : 'idas'})
								</span>
								<span className="font-semibold tabular-nums">
									{formatCurrency(maintenanceBreakdown.totalAmount)}
								</span>
							</div>
							<div className="grid grid-cols-2 gap-2 text-muted-foreground sm:grid-cols-3">
								<div>
									<span className="block">Peças</span>
									<span className="font-medium text-foreground tabular-nums">
										{formatCurrency(maintenanceBreakdown.partsCost)}
									</span>
								</div>
								<div>
									<span className="block">Mão de obra</span>
									<span className="font-medium text-foreground tabular-nums">
										{formatCurrency(maintenanceBreakdown.laborCost)}
									</span>
								</div>
								<div>
									<span className="block">Preventiva vs. Corretiva</span>
									<span className="font-medium text-foreground tabular-nums">
										{formatCurrency(maintenanceBreakdown.preventiveCost)} /{' '}
										{formatCurrency(maintenanceBreakdown.correctiveCost)}
									</span>
								</div>
							</div>
						</div>
					)}

					{sortedCategories.length === 0 ? (
						<p className="text-muted-foreground">
							Nenhuma despesa operacional registrada neste período.
						</p>
					) : (
						<ul className="divide-y">
							{sortedCategories.map((item) => {
								const Icon = EXPENSE_CATEGORY_ICONS[item.category]
								return (
									<li
										key={item.category}
										className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0"
									>
										<Icon className="size-4 shrink-0 text-muted-foreground" />
										<span className="min-w-0 flex-1 truncate">
											{EXPENSE_CATEGORY_LABELS[item.category]}
											<span className="ml-1.5 text-muted-foreground">
												({item.count})
											</span>
										</span>
										<span className="text-muted-foreground tabular-nums">
											{formatDecimal(item.sharePercent, 1)}%
										</span>
										<span className="w-24 text-right font-medium tabular-nums">
											{formatCurrency(item.totalAmount)}
										</span>
									</li>
								)
							})}
						</ul>
					)}
				</CardContent>
			</Card>
		</div>
	)
}

