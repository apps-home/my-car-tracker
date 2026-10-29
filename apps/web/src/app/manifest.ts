import { env } from '@my-car-tracker/env/web'
import type { MetadataRoute } from 'next'

import { APP_COLORS } from '@/shared/lib/app-icon'

// URLs do manifest não recebem o basePath automaticamente
const basePath = env.NEXT_PUBLIC_BASE_PATH

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: `${basePath}/`,
    name: 'My Car Tracker',
    short_name: 'Car Tracker',
    description:
      'Gastos, abastecimentos e manutenções do seu carro em um lugar',
    lang: 'pt-BR',
    dir: 'ltr',
    start_url: `${basePath}/`,
    scope: `${basePath}/`,
    display: 'standalone',
    background_color: APP_COLORS.background,
    theme_color: APP_COLORS.background,
    categories: ['productivity', 'utilities'],
    shortcuts: [
      {
        name: 'Novo abastecimento',
        short_name: 'Abastecer',
        url: `${basePath}/fuel-logs?new=1`,
        icons: [{ src: `${basePath}/icon/192`, sizes: '192x192' }]
      },
      {
        name: 'Nova despesa',
        short_name: 'Despesa',
        url: `${basePath}/expenses?new=1`,
        icons: [{ src: `${basePath}/icon/192`, sizes: '192x192' }]
      }
    ],
    icons: [
      {
        src: `${basePath}/icon/192`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: `${basePath}/icon/512`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: `${basePath}/icon/512`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  }
}
