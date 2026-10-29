import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

import { APP_COLORS } from '@/shared/lib/app-icon'
import Providers from '@/shared/providers'
import '../index.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'My Car Tracker',
  applicationName: 'My Car Tracker',
  description: 'Gastos, abastecimentos e manutenções do seu carro em um lugar',
  // iOS: abre em tela cheia quando adicionado à tela de início
  appleWebApp: {
    capable: true,
    title: 'Car Tracker',
    statusBarStyle: 'default'
  },
  // Impede o Safari de transformar valores monetários e placas em links de telefone
  formatDetection: { telephone: false }
}

export const viewport: Viewport = {
  themeColor: [
    {
      media: '(prefers-color-scheme: light)',
      color: APP_COLORS.backgroundLight
    },
    { media: '(prefers-color-scheme: dark)', color: APP_COLORS.background }
  ]
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
