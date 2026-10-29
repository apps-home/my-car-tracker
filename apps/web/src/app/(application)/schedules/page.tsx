import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { getCurrentUser } from '@/shared/lib/current-user'

import SchedulesClient from './SchedulesClient'

async function SchedulesContent() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/sign-in')
  }

  return <SchedulesClient />
}

export default function SchedulesPage() {
  return (
    <Suspense>
      <SchedulesContent />
    </Suspense>
  )
}

export const metadata: Metadata = {
  title: 'My Car Tracker | Planos preventivos',
  description: 'Manutenções preventivas por tempo e quilometragem'
}
