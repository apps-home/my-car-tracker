export function formatQuantity(value: number, maximumFractionDigits = 5) {
  return value.toLocaleString('pt-BR', { maximumFractionDigits })
}

export function formatKm(value: number) {
  return `${value.toLocaleString('pt-BR')} km`
}

export function formatDecimal(value: number, fractionDigits = 2) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  })
}
