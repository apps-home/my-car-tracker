import { Badge } from '@lib/ui/components/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@lib/ui/components/card'
import { Scale } from 'lucide-react'

import { formatCurrency } from '@/shared/utils/format-currency'
import { formatDecimal } from '@/shared/utils/format-number'

import type { FuelLogSummary, FuelTypeSummary } from '../../api/types'

const GASOLINE = ['GASOLINE_COMMON', 'GASOLINE_ADDITIVE', 'GASOLINE_PREMIUM']

/** Gasolina mais recente entre os tipos de gasolina já usados */
function latestGasoline(byFuelType: FuelTypeSummary[]) {
  return byFuelType
    .filter(
      (item) =>
        GASOLINE.includes(item.fuelType) && item.consumptionKmPerLiter !== null
    )
    .sort((a, b) => b.count - a.count)[0]
}

/**
 * Compara o R$/km do etanol e da gasolina com o consumo real do carro
 * e o último preço pago de cada um.
 */
export function EthanolComparatorCard({
  summary
}: {
  summary: FuelLogSummary
}) {
  const ethanol = summary.byFuelType.find(
    (item) => item.fuelType === 'ETHANOL' && item.consumptionKmPerLiter !== null
  )
  const gasoline = latestGasoline(summary.byFuelType)

  if (!summary.ethanolParity || !ethanol || !gasoline) {
    return null
  }

  const ethanolCostPerKm =
    ethanol.lastPricePerLiter / (ethanol.consumptionKmPerLiter as number)
  const gasolineCostPerKm =
    gasoline.lastPricePerLiter / (gasoline.consumptionKmPerLiter as number)
  const priceRatio = ethanol.lastPricePerLiter / gasoline.lastPricePerLiter
  const ethanolWins = ethanolCostPerKm < gasolineCostPerKm

  return (
    <Card data-slot="ethanol-comparator-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="size-4 text-primary" />
          Etanol ou gasolina?
          <Badge variant={ethanolWins ? 'default' : 'secondary'}>
            {ethanolWins ? 'Etanol compensa' : 'Gasolina compensa'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Paridade real do seu carro:{' '}
          <span className="font-semibold text-foreground">
            {formatDecimal(summary.ethanolParity * 100, 1)}%
          </span>{' '}
          (o etanol compensa quando custa menos que isso do preço da gasolina).
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-md border p-3">
          <p className="text-muted-foreground">Etanol</p>
          <p className="font-semibold text-sm">
            {formatCurrency(ethanolCostPerKm)}/km
          </p>
          <p className="text-muted-foreground">
            {formatDecimal(ethanol.consumptionKmPerLiter as number)} km/L ·{' '}
            {formatCurrency(ethanol.lastPricePerLiter)}/L
          </p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-muted-foreground">Gasolina</p>
          <p className="font-semibold text-sm">
            {formatCurrency(gasolineCostPerKm)}/km
          </p>
          <p className="text-muted-foreground">
            {formatDecimal(gasoline.consumptionKmPerLiter as number)} km/L ·{' '}
            {formatCurrency(gasoline.lastPricePerLiter)}/L
          </p>
        </div>
        <p className="col-span-2 text-muted-foreground">
          Com os últimos preços pagos, o etanol está a{' '}
          {formatDecimal(priceRatio * 100, 1)}% da gasolina.
        </p>
      </CardContent>
    </Card>
  )
}
