import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { getCurrentUser } from '@/shared/lib/current-user'

import MaintenancesClient from './MaintenancesClient'

async function MaintenancesContent() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/sign-in')
  }

  return <MaintenancesClient />
}

export default function MaintenancesPage() {
  return (
    <Suspense>
      <MaintenancesContent />
    </Suspense>
  )
}

export const metadata: Metadata = {
  title: 'My Car Tracker | Manutenções',
  description: 'Histórico de oficina, peças trocadas, garantias e notas fiscais'
}
