/**
 * Converte o que o usuário digita (pt-BR ou não) em número.
 * "5,899" e "5.899" viram 5.899; "1.234,56" vira 1234.56. Inválido vira `null`.
 */
export function parseDecimal(value: string): number | null {
  const trimmed = value.trim()

  if (!trimmed) return null

  const normalized = trimmed.includes(',')
    ? trimmed.replace(/\./g, '').replace(',', '.')
    : trimmed

  const parsed = Number(normalized)

  return Number.isFinite(parsed) ? parsed : null
}

/** Número para um input de texto em pt-BR, sem separador de milhar */
export function toDecimalInput(value: number | null | undefined, digits = 2) {
  if (value == null) return ''

  return value
    .toFixed(digits)
    .replace(/\.?0+$/, '')
    .replace('.', ',')
}
