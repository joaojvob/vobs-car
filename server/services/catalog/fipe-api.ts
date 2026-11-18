import { z } from 'zod'
import type { FuelType, VehicleType } from '#shared/types/catalog'

const FIPE_BASE_URL = 'https://fipe.parallelum.com.br/api/v2'
const REQUEST_TIMEOUT_MS = 8000
const ZERO_KM_YEAR = 32000

const VEHICLE_PATHS: Record<VehicleType, string> = {
  car: 'cars',
  motorcycle: 'motorcycles',
}

// O nome do ano vem como "2020 Gasolina"; a comparação ignora acento e caixa.
const FUELS_BY_NAME: Record<string, FuelType> = {
  gasolina: 'gasoline',
  alcool: 'ethanol',
  flex: 'flex',
  diesel: 'diesel',
  hibrido: 'hybrid',
  eletrico: 'electric',
}

const MONTHS = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

const itemListSchema = z.array(z.object({
  code: z.string().min(1),
  name: z.string().min(1),
}))

const quoteSchema = z.object({
  codeFipe: z.string().min(1),
  price: z.string().regex(/^R\$\s?[\d.]+,\d{2}$/),
  referenceMonth: z.string().min(1),
})

export interface FipeItem {
  code: string
  name: string
}

export interface FipeYear {
  code: string
  modelYear: number | null
  fuel: FuelType
}

export interface FipeQuote {
  fipeVehicleCode: string
  priceCents: number
  referenceMonth: string
}

/** A API da FIPE falhou ou respondeu num formato inesperado. Quem chama decide se há espelho para servir. */
export class FipeUnavailableError extends Error {
  constructor(message: string, options?: { cause: unknown }) {
    super(message, options)
    this.name = 'FipeUnavailableError'
  }
}

export function fetchFipeBrands(vehicleType: VehicleType): Promise<FipeItem[]> {
  return fipeGet(`/${VEHICLE_PATHS[vehicleType]}/brands`, itemListSchema)
}

export function fetchFipeModels(vehicleType: VehicleType, brandCode: string): Promise<FipeItem[]> {
  return fipeGet(`/${VEHICLE_PATHS[vehicleType]}/brands/${brandCode}/models`, itemListSchema)
}

export async function fetchFipeYears(vehicleType: VehicleType, brandCode: string, modelCode: string): Promise<FipeYear[]> {
  const items = await fipeGet(`/${VEHICLE_PATHS[vehicleType]}/brands/${brandCode}/models/${modelCode}/years`, itemListSchema)

  return items.flatMap((item) => {
    const year = toFipeYear(item)

    if (!year) {
      logger.warn('Ano da FIPE ignorado: combustível desconhecido', { code: item.code, name: item.name })
    }

    return year ? [year] : []
  })
}

export async function fetchFipeQuote(vehicleType: VehicleType, brandCode: string, modelCode: string, yearCode: string): Promise<FipeQuote> {
  const quote = await fipeGet(`/${VEHICLE_PATHS[vehicleType]}/brands/${brandCode}/models/${modelCode}/years/${yearCode}`, quoteSchema)
  const referenceMonth = parseReferenceMonth(quote.referenceMonth)

  if (!referenceMonth) {
    throw new FipeUnavailableError(`Mês de referência inesperado: ${quote.referenceMonth}`)
  }

  return {
    fipeVehicleCode: quote.codeFipe,
    priceCents: Number(quote.price.replace(/\D/g, '')),
    referenceMonth,
  }
}

/** Busca e valida. Erro de rede, de status ou de formato vira `FipeUnavailableError`. */
async function fipeGet<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const { fipeApiToken } = useRuntimeConfig()
  let body: unknown

  try {
    body = await $fetch(path, {
      baseURL: FIPE_BASE_URL,
      timeout: REQUEST_TIMEOUT_MS,
      retry: 1,
      // 429 fica de fora: repetir só gastaria mais cota.
      retryStatusCodes: [500, 502, 503, 504],
      headers: fipeApiToken ? { 'X-Subscription-Token': fipeApiToken } : undefined,
    })
  }
  catch (error) {
    throw new FipeUnavailableError(`Falha ao consultar a FIPE: ${path}`, { cause: error })
  }

  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    throw new FipeUnavailableError(`Resposta inesperada da FIPE: ${path}`, { cause: parsed.error })
  }

  return parsed.data
}

/** "2020-1" vira 2020; o ano 32000 é como a FIPE marca o zero km. */
function toFipeYear(item: FipeItem): FipeYear | null {
  const yearNumber = Number(item.code.split('-')[0])
  const fuel = FUELS_BY_NAME[normalize(item.name.replace(/^\d+\s*/, ''))]

  if (!fuel || !Number.isInteger(yearNumber)) {
    return null
  }

  return {
    code: item.code,
    modelYear: yearNumber === ZERO_KM_YEAR ? null : yearNumber,
    fuel,
  }
}

/** "novembro de 2026" vira "2026-11-01". */
function parseReferenceMonth(text: string): string | null {
  const match = normalize(text).match(/^([a-z]+) de (\d{4})$/)
  const monthIndex = match ? MONTHS.indexOf(match[1] ?? '') : -1

  if (!match || monthIndex < 0) {
    return null
  }

  return `${match[2]}-${String(monthIndex + 1).padStart(2, '0')}-01`
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase()
}
