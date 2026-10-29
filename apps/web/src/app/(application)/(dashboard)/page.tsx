import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { getCurrentUser } from '@/shared/lib/current-user'

import DashboardClient from './DashboardClient'

async function DashboardContent() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/sign-in')
  }

  return <DashboardClient />
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  )
}

export const metadata: Metadata = {
  title: 'My Car Tracker | Dashboard',
  description: 'Gastos, abastecimentos e manutenções do seu carro em um lugar'
}
