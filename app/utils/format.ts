const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

// Lida em UTC: "2026-11-01" à meia-noite no fuso do Brasil ainda seria outubro.
const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })

/** Centavos em reais: 8538600 vira "R$ 85.386,00". */
export function formatCurrency(cents: number): string {
  return currencyFormatter.format(cents / 100)
}

/** "2026-11-01" vira "novembro de 2026". */
export function formatReferenceMonth(isoDate: string): string {
  return monthFormatter.format(new Date(`${isoDate}T00:00:00Z`))
}
