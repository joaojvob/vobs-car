import type { FuelType } from '#shared/types/catalog'

export const FUEL_LABELS: Record<FuelType, string> = {
  gasoline: 'Gasolina',
  ethanol: 'Etanol',
  flex: 'Flex',
  diesel: 'Diesel',
  hybrid: 'Híbrido',
  electric: 'Elétrico',
}

/** A FIPE trata o zero km como um ano à parte; aqui ele aparece por extenso. */
export function formatModelYear(modelYear: number | null): string {
  return modelYear === null ? 'Zero km' : String(modelYear)
}
