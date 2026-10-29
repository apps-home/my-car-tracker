import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { getCurrentUser } from '@/shared/lib/current-user'

import VehiclesClient from './VehiclesClient'

async function VehiclesContent() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/sign-in')
  }

  return <VehiclesClient />
}

export default function VehiclesPage() {
  return (
    <Suspense>
      <VehiclesContent />
    </Suspense>
  )
}

export const metadata: Metadata = {
  title: 'My Car Tracker | Veículos',
  description: 'Cadastro dos seus carros e quilometragem atual'
}
