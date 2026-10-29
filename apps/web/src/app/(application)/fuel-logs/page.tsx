import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { getCurrentUser } from '@/shared/lib/current-user'

import FuelLogsClient from './FuelLogsClient'

async function FuelLogsContent() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/sign-in')
  }

  return <FuelLogsClient />
}

export default function FuelLogsPage() {
  return (
    <Suspense>
      <FuelLogsContent />
    </Suspense>
  )
}

export const metadata: Metadata = {
  title: 'My Car Tracker | Abastecimentos',
  description: 'Histórico de abastecimentos, consumo real e custo por km'
}
