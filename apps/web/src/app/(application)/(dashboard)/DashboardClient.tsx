'use client'

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from '@lib/ui/components/card'

export default function DashboardClient() {
  return (
    <main className="container mx-auto flex flex-col gap-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>My Car Tracker</CardTitle>
          <CardDescription>
            Gastos, abastecimentos e manutenções do seu carro aparecem aqui.
          </CardDescription>
        </CardHeader>
      </Card>
    </main>
  )
}
