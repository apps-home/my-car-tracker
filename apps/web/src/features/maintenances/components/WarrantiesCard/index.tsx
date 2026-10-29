import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@lib/ui/components/card'
import { ShieldCheck } from 'lucide-react'

import { formatDate } from '@/shared/utils/format-date'

import type { ActiveWarranty } from '../../api/types'

const DAY_MS = 24 * 60 * 60 * 1000

/** Peças ainda na garantia, da que vence antes para a que vence depois */
export function WarrantiesCard({
  warranties
}: {
  warranties: ActiveWarranty[]
}) {
  if (!warranties.length) return null

  return (
    <Card data-slot="warranties-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" />
          Garantias ativas
        </CardTitle>
        <CardDescription>
          Guarde a nota: é ela que vale na hora de acionar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y text-xs">
          {warranties.map((warranty) => {
            const daysLeft = Math.ceil(
              (new Date(warranty.warrantyUntil).getTime() - Date.now()) / DAY_MS
            )

            return (
              <li
                key={warranty.itemId}
                className="flex items-center gap-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {warranty.name}
                    {warranty.brand && ` · ${warranty.brand}`}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {warranty.maintenanceTitle} · {formatDate(warranty.date)}
                    {warranty.workshopName && ` · ${warranty.workshopName}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    até {formatDate(warranty.warrantyUntil)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {daysLeft <= 30
                      ? `faltam ${Math.max(daysLeft, 0)} dias`
                      : `${warranty.warrantyMonths} meses`}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
