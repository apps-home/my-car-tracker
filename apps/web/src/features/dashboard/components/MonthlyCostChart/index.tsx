'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@lib/ui/components/card'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

import { formatCurrency } from '@/shared/utils/format-currency'

import { COST_SERIES, type MonthlyCost } from '../../utils/monthly-costs'

interface MonthlyCostChartProps {
  data: MonthlyCost[]
  year: number
}

function compactCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value)
}

function ChartTooltip({
  active,
  payload,
  label
}: {
  active?: boolean
  payload?: { payload: MonthlyCost }[]
  label?: string
}) {
  const month = payload?.[0]?.payload

  if (!active || !month || month.total === 0) return null

  return (
    <div className="min-w-44 rounded-md border bg-popover p-2.5 text-popover-foreground text-xs shadow-md">
      <p className="mb-1.5 font-medium">{label}</p>
      {COST_SERIES.filter((series) => month[series.key] > 0).map((series) => (
        <div key={series.key} className="flex items-center gap-2 py-0.5">
          <span
            className="size-2.5 rounded-xs"
            style={{ backgroundColor: series.color }}
          />
          <span className="text-muted-foreground">{series.label}</span>
          <span className="ml-auto tabular-nums">
            {formatCurrency(month[series.key])}
          </span>
        </div>
      ))}
      <div className="mt-1.5 flex justify-between border-t pt-1.5 font-medium">
        <span>Total</span>
        <span className="tabular-nums">{formatCurrency(month.total)}</span>
      </div>
    </div>
  )
}

/** Custo mensal empilhado por tipo de gasto */
export function MonthlyCostChart({ data, year }: MonthlyCostChartProps) {
  const yearTotal = data.reduce((sum, month) => sum + month.total, 0)
  const usedSeries = COST_SERIES.filter((series) =>
    data.some((month) => month[series.key] > 0)
  )

  return (
    <Card data-slot="monthly-cost-chart">
      <CardHeader>
        <CardTitle>Custo mensal em {year}</CardTitle>
        <CardDescription>
          Total no ano:{' '}
          <span className="font-semibold text-foreground">
            {formatCurrency(yearTotal)}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {usedSeries.length > 1 && (
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-xs">
            {usedSeries.map((series) => (
              <li key={series.key} className="flex items-center gap-1.5">
                <span
                  className="size-2.5 rounded-xs"
                  style={{ backgroundColor: series.color }}
                />
                {series.label}
              </li>
            ))}
          </ul>
        )}
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeDasharray="0"
              />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                interval={0}
              />
              <YAxis
                width={56}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                tickFormatter={compactCurrency}
              />
              <Tooltip
                cursor={{ fill: 'var(--muted)', opacity: 0.6 }}
                content={<ChartTooltip />}
              />
              {usedSeries.map((series, index) => (
                <Bar
                  key={series.key}
                  dataKey={series.key}
                  name={series.label}
                  stackId="cost"
                  fill={series.color}
                  stroke="var(--card)"
                  strokeWidth={2}
                  maxBarSize={28}
                  radius={index === usedSeries.length - 1 ? [4, 4, 0, 0] : 0}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground">
            Ver em tabela
          </summary>
          <table className="mt-2 w-full tabular-nums">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-1 text-left font-normal">Mês</th>
                {usedSeries.map((series) => (
                  <th key={series.key} className="py-1 text-right font-normal">
                    {series.label}
                  </th>
                ))}
                <th className="py-1 text-right font-normal">Total</th>
              </tr>
            </thead>
            <tbody>
              {data
                .filter((month) => month.total > 0)
                .map((month) => (
                  <tr key={month.month} className="border-t">
                    <td className="py-1">{month.month}</td>
                    {usedSeries.map((series) => (
                      <td key={series.key} className="py-1 text-right">
                        {formatCurrency(month[series.key])}
                      </td>
                    ))}
                    <td className="py-1 text-right font-medium">
                      {formatCurrency(month.total)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </details>
      </CardContent>
    </Card>
  )
}
