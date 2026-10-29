import type { Metadata } from 'next'

import Header from '@/shared/components/Header'

export const metadata: Metadata = {
  title: 'My Car Tracker',
  description: 'Gastos, abastecimentos e manutenções do seu carro em um lugar'
}

export default function Layout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="grid min-h-svh grid-rows-[auto_1fr]">
      <Header />
      {children}
    </div>
  )
}
