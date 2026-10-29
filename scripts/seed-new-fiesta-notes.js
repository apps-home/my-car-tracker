/**
 * Script de migração histórica das 3 notas do iPhone Notes (New Fiesta: 2022–2026).
 *
 * Como executar (a partir da raiz do monorepo):
 *   node scripts/seed-new-fiesta-notes.js
 *
 * Opcionalmente defina USER_EMAIL="seu@email.com" se houver mais de 1 usuário no banco.
 */
import { randomUUID } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadEnv } from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')

loadEnv({ path: resolve(rootDir, '.env') })
loadEnv({ path: resolve(rootDir, 'packages/lib-my-car-tracker-db/.env') })
loadEnv({ path: resolve(rootDir, 'apps/service/.env') })

const { prisma } = await import('@lib/my-car-tracker-db')

function utcDate(isoDate) {
  return new Date(`${isoDate}T00:00:00.000Z`)
}

function addMonthsUtc(date, months) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() + months,
      date.getUTCDate()
    )
  )
}

const MAINTENANCES = [
  {
    date: '2022-05-16',
    odometerKm: 89_651,
    type: 'PREVENTIVE',
    title: 'Troca de óleo e filtro de óleo',
    laborCost: 0,
    partsCost: 0,
    totalAmount: 0,
    items: [
      { name: 'Óleo do motor 5W30', brand: 'Ipiranga', unitPrice: 0 },
      { name: 'Filtro de óleo', unitPrice: 0 }
    ]
  },
  {
    date: '2022-11-09',
    odometerKm: 92_000,
    type: 'CORRECTIVE',
    title: 'Troca da bateria',
    laborCost: 0,
    partsCost: 550,
    totalAmount: 550,
    items: [
      {
        name: 'Bateria',
        brand: 'Moura',
        unitPrice: 550,
        warrantyMonths: 24
      }
    ]
  },
  {
    date: '2023-05-25',
    odometerKm: 95_780,
    type: 'PREVENTIVE',
    title: 'Troca de filtros (combustível, ar e cabine)',
    laborCost: 0,
    partsCost: 135,
    totalAmount: 135,
    items: [
      { name: 'Filtro do combustível', unitPrice: 45 },
      { name: 'Filtro de ar', unitPrice: 45 },
      { name: 'Filtro ar condicionado', unitPrice: 45 }
    ]
  },
  {
    date: '2023-09-12',
    odometerKm: 97_000,
    type: 'PREVENTIVE',
    title: 'Troca de óleo e filtro de óleo',
    laborCost: 0,
    partsCost: 190,
    totalAmount: 190,
    items: [
      { name: 'Óleo do motor 5W30', brand: 'Mobil', unitPrice: 150 },
      { name: 'Filtro de óleo', unitPrice: 40 }
    ]
  },
  {
    date: '2023-11-30',
    odometerKm: 98_000,
    type: 'PREVENTIVE',
    title: 'Revisão de freios, suspensão e ignição',
    laborCost: 0,
    partsCost: 1388,
    totalAmount: 1388,
    items: [
      { name: 'Pastilhas de freio', unitPrice: 0 },
      { name: 'Fluído do freio', unitPrice: 0 },
      { name: 'Bieleta da suspensão', unitPrice: 0 },
      { name: 'Coxim do câmbio', unitPrice: 0 },
      { name: 'Regulagem freio de mão', unitPrice: 0 },
      { name: 'Velas de ignição', unitPrice: 0 },
      { name: 'Cabos de velas', unitPrice: 0 },
      { name: 'Junta da tampa de válvula', unitPrice: 0 }
    ]
  },
  {
    date: '2024-04-15',
    odometerKm: 99_440,
    type: 'CORRECTIVE',
    title: 'Suspensão dianteira e alinhamento',
    laborCost: 0,
    partsCost: 1400,
    totalAmount: 1400,
    items: [
      { name: 'Amortecedor dianteiro', unitPrice: 0 },
      { name: 'Kit amortecedor dianteiro', unitPrice: 0 },
      { name: 'Alinhamento', unitPrice: 0 }
    ]
  },
  {
    date: '2024-08-16',
    odometerKm: 101_100,
    type: 'PREVENTIVE',
    title: 'Filtros e junta da tampa de válvula',
    laborCost: 0,
    partsCost: 268,
    totalAmount: 268,
    items: [
      { name: 'Filtro de ar', unitPrice: 54 },
      { name: 'Filtro ar condicionado', unitPrice: 54 },
      { name: 'Junta da tampa de válvula', unitPrice: 160 }
    ]
  },
  {
    date: '2024-09-24',
    odometerKm: 101_450,
    type: 'CORRECTIVE',
    title: 'Suspensão traseira e filtro de combustível',
    laborCost: 270,
    partsCost: 484,
    totalAmount: 754,
    items: [
      { name: 'Amortecedor traseiro', unitPrice: 0 },
      { name: 'Kit amortecedor traseiro', unitPrice: 0 },
      { name: 'Filtro do combustível', unitPrice: 0 }
    ]
  },
  {
    date: '2024-10-20',
    odometerKm: 101_600,
    type: 'CORRECTIVE',
    title: 'Troca do braço axial',
    laborCost: 0,
    partsCost: 150,
    totalAmount: 150,
    items: [{ name: 'Braço axial', unitPrice: 150 }]
  },
  {
    date: '2024-12-02',
    odometerKm: 101_800,
    type: 'CORRECTIVE',
    title: 'Funilaria e lanternagem frontal (sinistro seguro)',
    laborCost: 0,
    partsCost: 0,
    totalAmount: 0,
    notes: 'Valor da franquia (R$ 3.287) lançado em despesas de seguro.',
    items: [
      { name: 'Pára-choque dianteiro', unitPrice: 0 },
      { name: 'Paralamas direito', unitPrice: 0 },
      { name: 'Faróis', unitPrice: 0 },
      { name: 'Farol de milha direito', unitPrice: 0 }
    ]
  },
  {
    date: '2024-12-06',
    odometerKm: 101_900,
    type: 'CORRECTIVE',
    title: 'Bandeja da suspensão, alinhamento e balanceamento',
    laborCost: 100,
    partsCost: 390,
    totalAmount: 490,
    items: [
      { name: 'Bandeja da suspensão', unitPrice: 390 },
      { name: 'Alinhamento', unitPrice: 50 },
      { name: 'Balanceamento', unitPrice: 50 }
    ]
  },
  {
    date: '2024-12-17',
    odometerKm: 102_200,
    type: 'PREVENTIVE',
    title: 'Correia dentada, bomba d’água e arrefecimento',
    laborCost: 0,
    partsCost: 1230,
    totalAmount: 1230,
    items: [
      { name: 'Bomba d’água e polia', unitPrice: 0 },
      { name: 'Correia dentada e rolamento', unitPrice: 0 },
      { name: 'Junta da tampa de válvula', unitPrice: 0 },
      { name: 'Aditivos de arrefecimento', unitPrice: 0 }
    ]
  },
  {
    date: '2025-03-03',
    odometerKm: 103_200,
    type: 'PREVENTIVE',
    title: 'Troca de óleo e filtro de óleo',
    laborCost: 0,
    partsCost: 214,
    totalAmount: 214,
    items: [
      { name: 'Óleo do motor 5W30', brand: 'Mobil', unitPrice: 174 },
      { name: 'Filtro de óleo', unitPrice: 40 }
    ]
  },
  {
    date: '2025-06-12',
    odometerKm: 105_200,
    type: 'CORRECTIVE',
    title: 'Corpo de borboleta, bucha do câmbio e calço da mola',
    laborCost: 480,
    partsCost: 754,
    totalAmount: 1234,
    items: [
      { name: 'Corpo de borboleta', unitPrice: 620 },
      { name: 'Bucha do câmbio', unitPrice: 44 },
      { name: 'Calço da mola', unitPrice: 90 }
    ]
  },
  {
    date: '2025-10-28',
    odometerKm: 107_500,
    type: 'PREVENTIVE',
    title: 'Revisão de óleo, filtros e limpeza de bicos',
    laborCost: 100,
    partsCost: 400,
    totalAmount: 500,
    items: [
      { name: 'Óleo 5W30', brand: 'Motorcraft', unitPrice: 0 },
      { name: 'Filtro de óleo', unitPrice: 0 },
      { name: 'Filtro de ar', unitPrice: 0 },
      { name: 'Filtro de combustível', unitPrice: 0 },
      { name: 'Filtro de cabine', unitPrice: 245 },
      { name: 'Troca bujão do óleo', unitPrice: 25 },
      { name: 'Limpeza de bicos', unitPrice: 130 }
    ]
  },
  {
    date: '2026-07-14',
    odometerKm: 114_000,
    type: 'PREVENTIVE',
    title: 'Revisão de óleo e kit filtros',
    laborCost: 140,
    partsCost: 245,
    totalAmount: 385,
    notes:
      'Kit filtros adquirido em 04/2026 (R$ 245) + mão de obra em 07/2026 (R$ 140).',
    items: [
      { name: 'Óleo 5W30', brand: 'Motorcraft', unitPrice: 0 },
      { name: 'Filtro de óleo', unitPrice: 0 },
      { name: 'Filtro de ar', unitPrice: 0 },
      { name: 'Filtro de combustível', unitPrice: 0 },
      { name: 'Filtro de cabine', unitPrice: 245 }
    ]
  },
  {
    date: '2026-07-21',
    odometerKm: 114_200,
    type: 'PREVENTIVE',
    title: '2 pneus dianteiros, alinhamento e balanceamento',
    laborCost: 0,
    partsCost: 0,
    totalAmount: 0,
    items: [
      { name: '2 Pneus dianteiros', quantity: 2, unitPrice: 0 },
      { name: 'Alinhamento', unitPrice: 0 },
      { name: 'Balanceamento', unitPrice: 0 }
    ]
  }
]

const FUEL_MONTHS = [
  // 2022
  {
    date: '2022-05-28',
    odometerKm: 89_800,
    totalCost: 150,
    pricePerLiter: 7.29,
    days: '19, 28'
  },
  {
    date: '2022-06-28',
    odometerKm: 90_300,
    totalCost: 500,
    pricePerLiter: 7.39,
    days: '5, 15, 16, 28'
  },
  {
    date: '2022-07-30',
    odometerKm: 90_700,
    totalCost: 250,
    pricePerLiter: 5.89,
    days: '15, 30'
  },
  {
    date: '2022-08-23',
    odometerKm: 91_100,
    totalCost: 200,
    pricePerLiter: 5.49,
    days: '6, 23'
  },
  {
    date: '2022-09-22',
    odometerKm: 91_500,
    totalCost: 225,
    pricePerLiter: 5.19,
    days: '11, 22'
  },
  {
    date: '2022-10-25',
    odometerKm: 91_800,
    totalCost: 100,
    pricePerLiter: 4.99,
    days: '13, 25'
  },
  {
    date: '2022-11-01',
    odometerKm: 92_000,
    totalCost: 100,
    pricePerLiter: 5.09,
    days: '1'
  },
  {
    date: '2022-12-06',
    odometerKm: 92_400,
    totalCost: 150,
    pricePerLiter: 5.09,
    days: '6'
  },

  // 2023
  {
    date: '2023-01-17',
    odometerKm: 92_900,
    totalCost: 100,
    pricePerLiter: 5.19,
    days: '17'
  },
  {
    date: '2023-02-02',
    odometerKm: 93_400,
    totalCost: 100,
    pricePerLiter: 5.19,
    days: '2'
  },
  {
    date: '2023-03-30',
    odometerKm: 94_200,
    totalCost: 250,
    pricePerLiter: 5.49,
    days: '1, 16, 23, 30'
  },
  {
    date: '2023-04-20',
    odometerKm: 95_000,
    totalCost: 250,
    pricePerLiter: 5.49,
    days: '11, 20'
  },
  {
    date: '2023-05-25',
    odometerKm: 95_780,
    totalCost: 260,
    pricePerLiter: 5.39,
    days: '4, 16, 25'
  },
  {
    date: '2023-06-20',
    odometerKm: 96_050,
    totalCost: 100,
    pricePerLiter: 5.39,
    days: '15, 20'
  },
  {
    date: '2023-07-20',
    odometerKm: 96_350,
    totalCost: 100,
    pricePerLiter: 5.49,
    days: '20'
  },
  {
    date: '2023-08-24',
    odometerKm: 96_750,
    totalCost: 220,
    pricePerLiter: 5.69,
    days: '1, 19, 24'
  },
  {
    date: '2023-09-25',
    odometerKm: 97_200,
    totalCost: 200,
    pricePerLiter: 5.79,
    days: '7, 25'
  },
  {
    date: '2023-10-26',
    odometerKm: 97_550,
    totalCost: 100,
    pricePerLiter: 5.69,
    days: '12, 26'
  },
  {
    date: '2023-11-30',
    odometerKm: 98_000,
    totalCost: 200,
    pricePerLiter: 5.69,
    days: '9, 30'
  },
  {
    date: '2023-12-28',
    odometerKm: 98_250,
    totalCost: 100,
    pricePerLiter: 5.59,
    days: '28'
  },

  // 2024
  {
    date: '2024-01-27',
    odometerKm: 98_500,
    totalCost: 100,
    pricePerLiter: 5.59,
    days: '27'
  },
  {
    date: '2024-02-25',
    odometerKm: 98_800,
    totalCost: 140,
    pricePerLiter: 5.69,
    days: '1, 16, 24, 25'
  },
  {
    date: '2024-03-24',
    odometerKm: 99_100,
    totalCost: 150,
    pricePerLiter: 5.69,
    days: '3, 24'
  },
  {
    date: '2024-04-28',
    odometerKm: 99_550,
    totalCost: 200,
    pricePerLiter: 5.79,
    days: '7, 28'
  },
  {
    date: '2024-05-22',
    odometerKm: 99_950,
    totalCost: 243.24,
    pricePerLiter: 5.79,
    days: '12, 22'
  },
  {
    date: '2024-06-16',
    odometerKm: 100_300,
    totalCost: 80,
    pricePerLiter: 5.79,
    days: '2, 16',
    reimbursedAmount: 80,
    sharedWith: 'Alex'
  },
  {
    date: '2024-07-17',
    odometerKm: 100_700,
    totalCost: 195.61,
    pricePerLiter: 5.89,
    days: '3, 17'
  },
  {
    date: '2024-08-21',
    odometerKm: 101_150,
    totalCost: 197,
    pricePerLiter: 5.99,
    days: '12, 21'
  },
  {
    date: '2024-09-29',
    odometerKm: 101_500,
    totalCost: 195,
    pricePerLiter: 5.99,
    days: '1, 18, 22, 29',
    reimbursedAmount: 100,
    sharedWith: 'Pai (R$ 100)'
  },
  {
    date: '2024-10-25',
    odometerKm: 101_650,
    totalCost: 95,
    pricePerLiter: 5.99
  },
  {
    date: '2024-11-20',
    odometerKm: 101_750,
    totalCost: 50,
    pricePerLiter: 5.99,
    reimbursedAmount: 50,
    sharedWith: 'Cláudio'
  },
  {
    date: '2024-12-29',
    odometerKm: 102_350,
    totalCost: 386,
    pricePerLiter: 6.09,
    days: '2, 4, 8, 15, 18, 29'
  },

  // 2025
  {
    date: '2025-01-29',
    odometerKm: 102_650,
    totalCost: 231,
    pricePerLiter: 6.19,
    days: '8, 22, 29'
  },
  {
    date: '2025-02-16',
    odometerKm: 102_950,
    totalCost: 198,
    pricePerLiter: 6.19,
    days: '16'
  },
  {
    date: '2025-03-30',
    odometerKm: 103_450,
    totalCost: 150,
    pricePerLiter: 6.19,
    days: '12, 16, 24, 30'
  },
  {
    date: '2025-04-27',
    odometerKm: 104_050,
    totalCost: 320,
    pricePerLiter: 6.19,
    days: '9, 16, 22, 25, 27'
  },
  {
    date: '2025-05-28',
    odometerKm: 104_650,
    totalCost: 340,
    pricePerLiter: 6.19,
    days: '11, 23, 28'
  },
  {
    date: '2025-06-29',
    odometerKm: 105_350,
    totalCost: 360,
    pricePerLiter: 6.19,
    days: '1, 15, 29'
  },
  {
    date: '2025-07-27',
    odometerKm: 105_750,
    totalCost: 200,
    pricePerLiter: 6.19,
    days: '27'
  },
  {
    date: '2025-08-31',
    odometerKm: 106_250,
    totalCost: 250,
    pricePerLiter: 6.19,
    days: '3, 17, 31'
  },
  {
    date: '2025-09-24',
    odometerKm: 106_800,
    totalCost: 160,
    pricePerLiter: 6.19,
    days: '3, 24',
    reimbursedAmount: 100,
    sharedWith: 'Annalik (R$ 100)'
  },
  {
    date: '2025-10-22',
    odometerKm: 107_400,
    totalCost: 250,
    pricePerLiter: 6.19,
    days: '8, 22'
  },
  {
    date: '2025-11-23',
    odometerKm: 108_100,
    totalCost: 150,
    pricePerLiter: 6.19,
    days: '9, 16, 23',
    reimbursedAmount: 150,
    sharedWith: 'Pai (R$ 100), Annalik (R$ 50)'
  },
  {
    date: '2025-12-21',
    odometerKm: 108_900,
    totalCost: 325,
    pricePerLiter: 6.19,
    days: '3, 10, 21',
    reimbursedAmount: 100,
    sharedWith: 'Annalik (R$ 50), Mãe (R$ 50)'
  },

  // 2026
  {
    date: '2026-01-29',
    odometerKm: 109_800,
    totalCost: 500,
    pricePerLiter: 6.29,
    days: '4, 7, 21, 25, 29',
    reimbursedAmount: 250,
    sharedWith: 'Mãe (R$ 200), Pai (R$ 50)'
  },
  {
    date: '2026-02-22',
    odometerKm: 110_600,
    totalCost: 350,
    pricePerLiter: 6.29,
    days: '4, 11, 16, 22',
    reimbursedAmount: 150,
    sharedWith: 'Annalik (R$ 100), Mãe (R$ 50)'
  },
  {
    date: '2026-03-22',
    odometerKm: 111_500,
    totalCost: 427,
    pricePerLiter: 6.29,
    days: '1, 8, 15, 22',
    reimbursedAmount: 350,
    sharedWith: 'Mãe (R$ 200), Annalik (R$ 100), Pai (R$ 50)'
  },
  {
    date: '2026-04-29',
    odometerKm: 112_300,
    totalCost: 420,
    pricePerLiter: 6.29,
    days: '1, 12, 29',
    reimbursedAmount: 100,
    sharedWith: 'Pai (R$ 100)'
  },
  {
    date: '2026-05-31',
    odometerKm: 113_100,
    totalCost: 500,
    pricePerLiter: 6.29,
    days: '10, 17, 24, 31',
    reimbursedAmount: 250,
    sharedWith: 'Mãe (R$ 150), Pai (R$ 100)'
  },
  {
    date: '2026-06-28',
    odometerKm: 113_700,
    totalCost: 400,
    pricePerLiter: 6.29,
    days: '10, 28'
  },
  {
    date: '2026-07-29',
    odometerKm: 114_350,
    totalCost: 347,
    pricePerLiter: 6.29,
    days: '12, 19, 26, 29',
    reimbursedAmount: 50,
    sharedWith: 'Pai (R$ 50)'
  },
  {
    date: '2026-08-23',
    odometerKm: 115_000,
    totalCost: 395,
    pricePerLiter: 6.29,
    days: '5, 19, 23',
    reimbursedAmount: 150,
    sharedWith: 'Mãe (R$ 150)'
  },
  {
    date: '2026-09-27',
    odometerKm: 115_700,
    totalCost: 450,
    pricePerLiter: 6.29,
    days: '2, 9, 20, 27',
    reimbursedAmount: 100,
    sharedWith: 'Ajuda (R$ 100)'
  },
  {
    date: '2026-10-25',
    odometerKm: 116_200,
    totalCost: 250,
    pricePerLiter: 6.29,
    days: '4, 11, 18, 25',
    reimbursedAmount: 100,
    sharedWith: 'Pai (R$ 100)'
  },
  {
    date: '2026-11-01',
    odometerKm: 116_400,
    totalCost: 115,
    pricePerLiter: 6.29
  }
]

const EXPENSES = [
  {
    date: '2024-12-02',
    category: 'INSURANCE',
    amount: 3287,
    description: 'Franquia do seguro (reparo frontal)',
    odometerKm: 101_800
  },
  {
    date: '2025-02-16',
    category: 'ACCESSORY',
    amount: 50,
    description: 'Manopla do câmbio',
    odometerKm: 102_950
  }
]

const SCHEDULES = [
  {
    title: 'Troca de óleo do motor e filtro',
    description: 'Óleo 5W30 Motorcraft + filtro de óleo',
    triggerRule: 'WHICHEVER_COMES_FIRST',
    intervalMonths: 12,
    intervalKm: 10_000,
    lastExecutedAt: '2026-07-14',
    lastExecutedOdometerKm: 114_000,
    alertStatus: 'ON_TRACK'
  },
  {
    title: 'Filtro de ar do motor',
    triggerRule: 'WHICHEVER_COMES_FIRST',
    intervalMonths: 12,
    intervalKm: 10_000,
    lastExecutedAt: '2026-07-14',
    lastExecutedOdometerKm: 114_000,
    alertStatus: 'ON_TRACK'
  },
  {
    title: 'Filtro de combustível',
    triggerRule: 'WHICHEVER_COMES_FIRST',
    intervalMonths: 12,
    intervalKm: 10_000,
    lastExecutedAt: '2026-07-14',
    lastExecutedOdometerKm: 114_000,
    alertStatus: 'ON_TRACK'
  },
  {
    title: 'Filtro de cabine (ar-condicionado)',
    triggerRule: 'WHICHEVER_COMES_FIRST',
    intervalMonths: 12,
    intervalKm: 10_000,
    lastExecutedAt: '2026-07-14',
    lastExecutedOdometerKm: 114_000,
    alertStatus: 'ON_TRACK'
  },
  {
    title: 'Alinhamento, balanceamento e rodízio de pneus',
    triggerRule: 'WHICHEVER_COMES_FIRST',
    intervalMonths: 6,
    intervalKm: 10_000,
    lastExecutedAt: '2026-07-21',
    lastExecutedOdometerKm: 114_200,
    alertStatus: 'ON_TRACK'
  },
  {
    title: 'Fluído de freio',
    description: 'A cada 2 anos (última troca em 11/2023)',
    triggerRule: 'TIME_ONLY',
    intervalMonths: 24,
    intervalKm: null,
    lastExecutedAt: '2023-11-30',
    lastExecutedOdometerKm: 98_000,
    alertStatus: 'OVERDUE'
  },
  {
    title: 'Líquido de arrefecimento',
    description: 'A cada 2 a 3 anos (última troca em 12/2024)',
    triggerRule: 'WHICHEVER_COMES_FIRST',
    intervalMonths: 24,
    intervalKm: 40_000,
    lastExecutedAt: '2024-12-17',
    lastExecutedOdometerKm: 102_200,
    alertStatus: 'ON_TRACK'
  },
  {
    title: 'Limpeza de bicos injetores',
    triggerRule: 'TIME_ONLY',
    intervalMonths: 24,
    intervalKm: null,
    lastExecutedAt: '2025-10-28',
    lastExecutedOdometerKm: 107_500,
    alertStatus: 'ON_TRACK'
  },
  {
    title: 'Limpeza do TBI (corpo de borboleta)',
    triggerRule: 'TIME_ONLY',
    intervalMonths: 24,
    intervalKm: null,
    lastExecutedAt: '2025-06-12',
    lastExecutedOdometerKm: 105_200,
    alertStatus: 'ON_TRACK'
  },
  {
    title: 'Bomba d’água',
    triggerRule: 'ODOMETER_ONLY',
    intervalMonths: null,
    intervalKm: 60_000,
    lastExecutedAt: '2024-12-17',
    lastExecutedOdometerKm: 102_200,
    alertStatus: 'ON_TRACK'
  },
  {
    title: 'Correia dentada e rolamento',
    description: '3 a 5 anos ou 60.000 km',
    triggerRule: 'WHICHEVER_COMES_FIRST',
    intervalMonths: 48,
    intervalKm: 60_000,
    lastExecutedAt: '2024-12-17',
    lastExecutedOdometerKm: 102_200,
    alertStatus: 'ON_TRACK'
  },
  {
    title: 'Velas de ignição',
    triggerRule: 'ODOMETER_ONLY',
    intervalMonths: null,
    intervalKm: 20_000,
    lastExecutedAt: '2023-11-30',
    lastExecutedOdometerKm: 98_000,
    alertStatus: 'DUE_SOON'
  },
  {
    title: 'Cabos de velas',
    description: '30.000 km a 40.000 km',
    triggerRule: 'ODOMETER_ONLY',
    intervalMonths: null,
    intervalKm: 35_000,
    lastExecutedAt: '2023-11-30',
    lastExecutedOdometerKm: 98_000,
    alertStatus: 'ON_TRACK'
  },
  {
    title: 'Pastilhas de freio',
    description: '20.000 km a 30.000 km',
    triggerRule: 'ODOMETER_ONLY',
    intervalMonths: null,
    intervalKm: 25_000,
    lastExecutedAt: '2023-11-30',
    lastExecutedOdometerKm: 98_000,
    alertStatus: 'ON_TRACK'
  },
  {
    title: 'Disco de freio',
    triggerRule: 'ODOMETER_ONLY',
    intervalMonths: null,
    intervalKm: 40_000,
    lastExecutedAt: '2023-11-30',
    lastExecutedOdometerKm: 98_000,
    alertStatus: 'ON_TRACK'
  },
  {
    title: 'Bateria',
    description: '3 a 5 anos (Moura trocada em 11/2022)',
    triggerRule: 'TIME_ONLY',
    intervalMonths: 48,
    intervalKm: null,
    lastExecutedAt: '2022-11-09',
    lastExecutedOdometerKm: 92_000,
    alertStatus: 'DUE_SOON'
  },
  {
    title: 'Pneus',
    description: '5 anos ou 40.000 km',
    triggerRule: 'WHICHEVER_COMES_FIRST',
    intervalMonths: 60,
    intervalKm: 40_000,
    lastExecutedAt: '2026-07-21',
    lastExecutedOdometerKm: 114_200,
    alertStatus: 'ON_TRACK'
  },
  {
    title: 'Amortecedores e molas',
    triggerRule: 'ODOMETER_ONLY',
    intervalMonths: null,
    intervalKm: 30_000,
    lastExecutedAt: '2024-09-24',
    lastExecutedOdometerKm: 101_450,
    alertStatus: 'ON_TRACK'
  }
]

const TASKS = [
  // PRÓXIMA MANUTENÇÃO: 2026
  {
    title: 'Para-barro esquerdo',
    priority: 'NEXT_VISIT',
    targetYear: 2026
  },
  {
    title: 'Fluído de freio',
    priority: 'NEXT_VISIT',
    targetYear: 2026,
    notes: 'Verificar'
  },
  {
    title: 'Revisar suspensão / direção',
    priority: 'NEXT_VISIT',
    targetYear: 2026
  },
  {
    title: 'Revisar disco de freio',
    priority: 'NEXT_VISIT',
    targetYear: 2026
  },
  { title: 'Marcha ruim', priority: 'NEXT_VISIT', targetYear: 2026 },
  {
    title: 'Trocar refletor motorista',
    priority: 'NEXT_VISIT',
    targetYear: 2026
  },

  // FUTURAS MANUTENÇÕES
  { title: 'Sensor de ré', priority: 'FUTURE', targetYear: null },
  { title: 'Insulfilm', priority: 'FUTURE', targetYear: null },
  {
    title: 'Fechadura da porta',
    priority: 'FUTURE',
    targetYear: null
  },
  {
    title: 'Alto-falante porta traseira',
    priority: 'FUTURE',
    targetYear: null
  },
  {
    title: 'Retrovisor motorista',
    priority: 'FUTURE',
    targetYear: null
  },
  { title: 'Velas', priority: 'FUTURE', targetYear: 2027 },
  { title: 'Freios', priority: 'FUTURE', targetYear: 2027 },
  { title: 'Pneus traseiros', priority: 'FUTURE', targetYear: 2027 },
  { title: 'Bateria', priority: 'FUTURE', targetYear: 2027 }
]

async function main() {
  const targetEmail = 'lucasdias067@gmail.com'
  const user = targetEmail
    ? await prisma.user.findUnique({ where: { email: targetEmail } })
    : await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } })

  if (!user) {
    throw new Error(
      'Nenhum usuário encontrado no banco. Faça login no app primeiro ou informe USER_EMAIL.'
    )
  }

  console.log(
    `Importando dados do New Fiesta para: ${user.name} (${user.email})`
  )

  let vehicle = await prisma.vehicle.findFirst({
    where: { userId: user.id, name: 'New Fiesta' }
  })

  if (vehicle) {
    await prisma.fuelLog.deleteMany({ where: { vehicleId: vehicle.id } })
    await prisma.vehicleExpense.deleteMany({ where: { vehicleId: vehicle.id } })
    await prisma.maintenanceRecord.deleteMany({
      where: { vehicleId: vehicle.id }
    })
    await prisma.maintenanceSchedule.deleteMany({
      where: { vehicleId: vehicle.id }
    })
    await prisma.maintenanceTask.deleteMany({
      where: { vehicleId: vehicle.id }
    })

    vehicle = await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: {
        initialOdometerKm: 89_651,
        currentOdometerKm: 116_400
      }
    })
  } else {
    vehicle = await prisma.vehicle.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        name: 'New Fiesta',
        brand: 'Ford',
        model: 'New Fiesta',
        modelYear: 2014,
        initialOdometerKm: 89_651,
        currentOdometerKm: 116_400,
        fuelTankCapacityLiters: 47,
        defaultFuelType: 'GASOLINE_COMMON',
        notes: 'Histórico importado do Apple Notes (2022–2026)'
      }
    })
  }

  // 1. Manutenções + Peças
  for (const entry of MAINTENANCES) {
    const date = utcDate(entry.date)
    await prisma.maintenanceRecord.create({
      data: {
        id: randomUUID(),
        vehicleId: vehicle.id,
        userId: user.id,
        type: entry.type,
        title: entry.title,
        date,
        odometerKm: entry.odometerKm,
        laborCost: entry.laborCost,
        partsCost: entry.partsCost,
        totalAmount: entry.totalAmount,
        notes: entry.notes ?? null,
        items: {
          create: entry.items.map((item) => {
            const qty = item.quantity ?? 1
            return {
              id: randomUUID(),
              name: item.name,
              brand: item.brand ?? null,
              quantity: qty,
              unitPrice: item.unitPrice,
              totalPrice: qty * item.unitPrice,
              warrantyMonths: item.warrantyMonths ?? null,
              warrantyUntil: item.warrantyMonths
                ? addMonthsUtc(date, item.warrantyMonths)
                : null
            }
          })
        }
      }
    })
  }

  // 2. Despesas
  for (const expense of EXPENSES) {
    await prisma.vehicleExpense.create({
      data: {
        id: randomUUID(),
        vehicleId: vehicle.id,
        userId: user.id,
        category: expense.category,
        date: utcDate(expense.date),
        amount: expense.amount,
        description: expense.description,
        odometerKm: expense.odometerKm
      }
    })
  }

  // 3. Abastecimentos mensais + Divisão/Ajuda
  for (const fuel of FUEL_MONTHS) {
    const liters = Number((fuel.totalCost / fuel.pricePerLiter).toFixed(3))
    await prisma.fuelLog.create({
      data: {
        id: randomUUID(),
        vehicleId: vehicle.id,
        userId: user.id,
        date: utcDate(fuel.date),
        odometerKm: fuel.odometerKm,
        fuelType: 'GASOLINE_COMMON',
        liters,
        pricePerLiter: fuel.pricePerLiter,
        totalCost: fuel.totalCost,
        reimbursedAmount: fuel.reimbursedAmount ?? 0,
        sharedWith: fuel.sharedWith ?? null,
        isFullTank: false,
        notes: fuel.days ? `Dias abastecidos no mês: ${fuel.days}` : null
      }
    })
  }

  // 4. Planos Preventivos
  for (const schedule of SCHEDULES) {
    const lastDate = utcDate(schedule.lastExecutedAt)
    await prisma.maintenanceSchedule.create({
      data: {
        id: randomUUID(),
        vehicleId: vehicle.id,
        userId: user.id,
        title: schedule.title,
        description: schedule.description ?? null,
        triggerRule: schedule.triggerRule,
        intervalMonths: schedule.intervalMonths,
        intervalKm: schedule.intervalKm,
        lastExecutedAt: lastDate,
        lastExecutedOdometerKm: schedule.lastExecutedOdometerKm,
        nextDueDate: schedule.intervalMonths
          ? addMonthsUtc(lastDate, schedule.intervalMonths)
          : null,
        nextDueOdometerKm: schedule.intervalKm
          ? schedule.lastExecutedOdometerKm + schedule.intervalKm
          : null,
        alertStatus: schedule.alertStatus
      }
    })
  }

  // 5. Pendências ("Para fazer na oficina")
  for (const task of TASKS) {
    await prisma.maintenanceTask.create({
      data: {
        id: randomUUID(),
        vehicleId: vehicle.id,
        userId: user.id,
        title: task.title,
        priority: task.priority,
        targetYear: task.targetYear,
        notes: task.notes ?? null
      }
    })
  }

  console.log('✅ Migração concluída com sucesso!')
  console.log(`- Veículo: ${vehicle.name} (${vehicle.id})`)
  console.log(`- ${MAINTENANCES.length} manutenções históricas`)
  console.log(`- ${EXPENSES.length} despesas extras`)
  console.log(
    `- ${FUEL_MONTHS.length} meses de abastecimento (com divisões/ajudas)`
  )
  console.log(`- ${SCHEDULES.length} planos preventivos/periódicos`)
  console.log(`- ${TASKS.length} pendências na lista "Para fazer"`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
