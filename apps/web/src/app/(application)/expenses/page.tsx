import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { getCurrentUser } from '@/shared/lib/current-user'

import ExpensesClient from './ExpensesClient'

async function ExpensesContent() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/sign-in')
  }

  return <ExpensesClient />
}

export default function ExpensesPage() {
  return (
    <Suspense>
      <ExpensesContent />
    </Suspense>
  )
}

export const metadata: Metadata = {
  title: 'My Car Tracker | Despesas',
  description: 'Pedágios, estacionamentos, IPVA, seguro, lavagens e multas'
}
