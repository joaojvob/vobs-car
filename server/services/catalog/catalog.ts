import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '#shared/types/database'
import type { CatalogModelYear, CatalogOption, CatalogVehicle, VehicleType } from '#shared/types/catalog'
import type { VehicleProfile } from '#shared/types/tech-profile'
import { findBrandById, listBrandsByType, markBrandModelsSynced, upsertBrands } from '../../repositories/fipe-brands'
import { findModelById, listModelsByBrand, markModelYearsSynced, upsertModels } from '../../repositories/fipe-models'
import type { ModelYearRecord } from '../../repositories/fipe-model-years'
import { findModelYearById, listModelYearsByModel, markPriceSynced, upsertModelYears } from '../../repositories/fipe-model-years'
import { findLatestPrice, upsertPrice } from '../../repositories/fipe-prices'
import type { FipeQuote } from './fipe-api'
import { FipeUnavailableError, fetchFipeBrands, fetchFipeModels, fetchFipeQuote, fetchFipeYears } from './fipe-api'

/*
 * Catálogo FIPE com espelho local (docs/ARCHITECTURE.md, seção 13).
 * Cada lista é lida do banco e só vai à API quando nunca foi buscada ou passou do prazo,
 * o que mantém o consumo bem abaixo do limite diário. Se a FIPE falhar, o espelho antigo é servido.
 * As funções recebem o client com service role porque, além de ler, gravam o espelho;
 * a rota já exigiu membro (ADR-0006).
 */

type Db = SupabaseClient<Database>

// A FIPE publica uma tabela por mês: listas mudam pouco, preços mudam todo mês.
const LIST_TTL_DAYS = 30
const PRICE_TTL_DAYS = 7
const DAY_MS = 24 * 60 * 60 * 1000

const nameCollator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true })

export async function listBrands(db: Db, vehicleType: VehicleType): Promise<CatalogOption[]> {
  const mirrored = await listBrandsByType(db, vehicleType)

  if (!isStale(newestSync(mirrored.map(brand => brand.syncedAt)), LIST_TTL_DAYS)) {
    return sortByName(mirrored)
  }

  const synced = await withFipeFallback(async () => {
    await upsertBrands(db, vehicleType, await fetchFipeBrands(vehicleType), new Date().toISOString())

    return true
  }, { hasMirror: mirrored.length > 0, context: { vehicleType } })

  return sortByName(synced ? await listBrandsByType(db, vehicleType) : mirrored)
}

export async function listModels(db: Db, brandId: number): Promise<CatalogOption[]> {
  const brand = await findBrandById(db, brandId)

  if (!brand) {
    throw createError({ statusCode: 404, message: 'Marca não encontrada.' })
  }

  if (isStale(brand.modelsSyncedAt, LIST_TTL_DAYS)) {
    await withFipeFallback(async () => {
      const syncedAt = new Date().toISOString()

      await upsertModels(db, brand.id, await fetchFipeModels(brand.vehicleType, brand.fipeCode), syncedAt)
      await markBrandModelsSynced(db, brand.id, syncedAt)
    }, { hasMirror: brand.modelsSyncedAt !== null, context: { brandId } })
  }

  return sortByName(await listModelsByBrand(db, brand.id))
}

export async function listModelYears(db: Db, modelId: number): Promise<CatalogModelYear[]> {
  const model = await findModelById(db, modelId)

  if (!model) {
    throw createError({ statusCode: 404, message: 'Modelo não encontrado.' })
  }

  if (isStale(model.yearsSyncedAt, LIST_TTL_DAYS)) {
    await withFipeFallback(async () => {
      const syncedAt = new Date().toISOString()
      const years = await fetchFipeYears(model.brand.vehicleType, model.brand.fipeCode, model.fipeCode)

      await upsertModelYears(db, model.id, years, syncedAt)
      await markModelYearsSynced(db, model.id, syncedAt)
    }, { hasMirror: model.yearsSyncedAt !== null, context: { modelId } })
  }

  return listModelYearsByModel(db, model.id)
}

/** Versão escolhida com o preço mais recente e o perfil técnico. Sem a FIPE, a versão é devolvida sem preço novo. */
export async function getVehicle(db: Db, modelYearId: number): Promise<CatalogVehicle> {
  const version = await findModelYearById(db, modelYearId)

  if (!version) {
    throw createError({ statusCode: 404, message: 'Versão não encontrada.' })
  }

  const quote = isStale(version.priceSyncedAt, PRICE_TTL_DAYS)
    ? await withFipeFallback(() => refreshQuote(db, version), { hasMirror: true, context: { modelYearId } })
    : null
  const { model } = version

  return {
    id: version.id,
    vehicleType: model.brand.vehicleType,
    brand: { id: model.brand.id, name: model.brand.name },
    model: { id: model.id, name: model.name },
    modelYear: version.modelYear,
    fuel: version.fuel,
    fipeCode: quote?.fipeVehicleCode ?? version.fipeVehicleCode,
    price: await findLatestPrice(db, version.id),
    profile: toVehicleProfile(version),
  }
}

/** O banco garante que versão mapeada tem perfil, e que sem perfil a situação é pendente ou falha. */
function toVehicleProfile(version: ModelYearRecord): VehicleProfile {
  if (version.techProfile) {
    return { status: 'mapped', techProfile: version.techProfile }
  }

  return { status: version.mappingStatus === 'failed' ? 'failed' : 'pending' }
}

async function refreshQuote(db: Db, version: ModelYearRecord): Promise<FipeQuote> {
  const { model } = version
  const quote = await fetchFipeQuote(model.brand.vehicleType, model.brand.fipeCode, model.fipeCode, version.fipeYearCode)

  await upsertPrice(db, version.id, { cents: quote.priceCents, referenceMonth: quote.referenceMonth })
  await markPriceSynced(db, version.id, { fipeVehicleCode: quote.fipeVehicleCode, syncedAt: new Date().toISOString() })

  return quote
}

/**
 * Roda uma sincronização com a FIPE. Se a FIPE falhar e já houver espelho, registra o aviso
 * e devolve `null` para seguir com o que está no banco; sem espelho, responde 503.
 * Erros do banco não são tratados aqui.
 */
async function withFipeFallback<T>(
  task: () => Promise<T>,
  options: { hasMirror: boolean, context: Record<string, unknown> },
): Promise<T | null> {
  try {
    return await task()
  }
  catch (error) {
    if (!(error instanceof FipeUnavailableError)) {
      throw error
    }

    logger.warn('FIPE indisponível', { ...options.context, hasMirror: options.hasMirror, error, cause: error.cause })

    if (!options.hasMirror) {
      throw createError({ statusCode: 503, message: 'A tabela FIPE está fora do ar. Tente de novo em alguns minutos.' })
    }

    return null
  }
}

function isStale(syncedAt: string | null, ttlDays: number): boolean {
  return syncedAt === null || Date.now() - Date.parse(syncedAt) > ttlDays * DAY_MS
}

function newestSync(dates: string[]): string | null {
  return dates.reduce<string | null>((newest, date) => (newest === null || Date.parse(date) > Date.parse(newest) ? date : newest), null)
}

function sortByName(options: CatalogOption[]): CatalogOption[] {
  return options
    .map(({ id, name }) => ({ id, name }))
    .sort((a, b) => nameCollator.compare(a.name, b.name))
}
