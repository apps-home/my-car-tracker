export const ALL_YEARS = 'all'

/** "Todos" e os últimos `count` anos, do atual para trás */
export function yearOptions(count = 6) {
  const current = new Date().getFullYear()

  return [
    { value: ALL_YEARS, label: 'Todos os anos' },
    ...Array.from({ length: count }, (_, index) => {
      const year = String(current - index)
      return { value: year, label: year }
    })
  ]
}

export function parseYear(value: string): number | undefined {
  return value === ALL_YEARS ? undefined : Number(value)
}
