/** Arredonda para `digits` casas decimais (meio para cima) */
export function round(value: number, digits: number): number {
  const factor = 10 ** digits

  return Math.round((value + Number.EPSILON) * factor) / factor
}
