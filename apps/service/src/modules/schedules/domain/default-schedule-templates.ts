import type { ScheduleTriggerRule } from './schedule-types'

export interface ScheduleTemplate {
  key: string
  title: string
  description: string
  triggerRule: ScheduleTriggerRule
  intervalMonths: number | null
  intervalKm: number | null
}

/** Planos preventivos sugeridos ao cadastrar um veículo (seção 5.2 do conceito) */
export const DEFAULT_SCHEDULE_TEMPLATES: ScheduleTemplate[] = [
  {
    key: 'oil-change',
    title: 'Troca de óleo e filtro de óleo',
    description: 'Use a especificação do manual (ex.: 5W30 API SP).',
    triggerRule: 'WHICHEVER_COMES_FIRST',
    intervalMonths: 6,
    intervalKm: 10_000
  },
  {
    key: 'air-filters',
    title: 'Filtro de ar do motor e de cabine',
    description: 'Filtro do ar-condicionado incluso.',
    triggerRule: 'WHICHEVER_COMES_FIRST',
    intervalMonths: 12,
    intervalKm: 10_000
  },
  {
    key: 'alignment-tires',
    title: 'Alinhamento, balanceamento e rodízio de pneus',
    description: 'Confira também a calibragem e o desgaste.',
    triggerRule: 'WHICHEVER_COMES_FIRST',
    intervalMonths: 6,
    intervalKm: 10_000
  },
  {
    key: 'brake-fluid',
    title: 'Fluido de freio (DOT 4)',
    description: 'O fluido absorve umidade com o tempo, mesmo rodando pouco.',
    triggerRule: 'TIME_ONLY',
    intervalMonths: 24,
    intervalKm: null
  },
  {
    key: 'coolant',
    title: 'Fluido de arrefecimento (aditivo do radiador)',
    description: 'Use o aditivo indicado no manual.',
    triggerRule: 'WHICHEVER_COMES_FIRST',
    intervalMonths: 24,
    intervalKm: 40_000
  },
  {
    key: 'spark-plugs-belt',
    title: 'Velas de ignição, correia e óleo de câmbio',
    description: 'Confira no manual os intervalos específicos do seu motor.',
    triggerRule: 'WHICHEVER_COMES_FIRST',
    intervalMonths: 48,
    intervalKm: 60_000
  },
  {
    key: 'wiper-blades',
    title: 'Palhetas do limpador de para-brisa',
    description: 'Troque antes se estiverem riscando o vidro.',
    triggerRule: 'TIME_ONLY',
    intervalMonths: 12,
    intervalKm: null
  }
]
