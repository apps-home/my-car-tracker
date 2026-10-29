// Datas de calendário (ex.: data do abastecimento) chegam como 00:00 UTC.
// Formatar em UTC evita exibir o dia anterior em fusos negativos (Brasil).
export function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(
    new Date(value)
  )
}

/** Converte a data para o valor de um `<input type="date">` (YYYY-MM-DD) */
export function toDateInputValue(value: string | Date): string {
  return new Date(value).toISOString().slice(0, 10)
}

/** Hoje no fuso do usuário, como YYYY-MM-DD (o dia que ele vê no celular) */
export function todayDateInputValue(): string {
  return new Date().toLocaleDateString('en-CA')
}
