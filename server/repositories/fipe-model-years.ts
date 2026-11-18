import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '#shared/types/database'
import type { CatalogModelYear, FuelType } from '#shared/types/catalog'
import type { MappingStatus, TechProfile } from '#shared/types/tech-profile'
import type { BrandRef } from './fipe-models'
import { toTechProfile } from './tech-profiles'

type Db = SupabaseClient<Database>

export interface ModelYearRecord {
  id: number
  fipeYearCode: string
  modelYear: number | null
  fuel: FuelType
  fipeVehicleCode: string | null
  priceSyncedAt: string | null
  mappingStatus: MappingStatus
  techProfile: TechProfile | null
  model: {
    id: number
    fipeCode: string
    name: string
    brand: BrandRef
  }
}

/** Zero km primeiro, depois do ano mais novo para o mais antigo. */
export async function listModelYearsByModel(db: Db, modelId: number): Promise<CatalogModelYear[]> {
  const { data, error } = await db
    .from('fipe_model_years')
    .select('id, model_year, fuel')
    .eq('model_id', modelId)
    .order('model_year', { ascending: false, nullsFirst: true })
    .order('fuel')

  if (error) {
    throw error
  }

  return data.map(row => ({ id: row.id, modelYear: row.model_year, fuel: row.fuel }))
}

export async function findModelYearById(db: Db, id: number): Promise<ModelYearRecord | null> {
  const { data, error } = await db
    .from('fipe_model_years')
    .select(`
      id, fipe_year_code, model_year, fuel, fipe_vehicle_code, price_synced_at, mapping_status,
      model:fipe_models (id, fipe_code, name, brand:fipe_brands (id, vehicle_type, fipe_code, name)),
      tech_profile:tech_profiles (
        id, vehicle_type, body_type, family, generation, year_start, year_end,
        engine:engines (powertrain, manufacturer, code, displacement_cc, cylinders, aspiration, fuel),
        transmission:transmissions (type, code, gears, final_drive)
      )
    `)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  const { model } = data

  return {
    id: data.id,
    fipeYearCode: data.fipe_year_code,
    modelYear: data.model_year,
    fuel: data.fuel,
    fipeVehicleCode: data.fipe_vehicle_code,
    priceSyncedAt: data.price_synced_at,
    mappingStatus: data.mapping_status,
    techProfile: data.tech_profile ? toTechProfile(data.tech_profile) : null,
    model: {
      id: model.id,
      fipeCode: model.fipe_code,
      name: model.name,
      brand: {
        id: model.brand.id,
        vehicleType: model.brand.vehicle_type,
        fipeCode: model.brand.fipe_code,
        name: model.brand.name,
      },
    },
  }
}

/** Grava os anos da FIPE numa única chamada, sem tocar no código FIPE e no preço já consultados. */
export async function upsertModelYears(
  db: Db,
  modelId: number,
  years: ReadonlyArray<{ code: string, modelYear: number | null, fuel: FuelType }>,
  syncedAt: string,
): Promise<void> {
  if (years.length === 0) {
    return
  }

  const rows = years.map(year => ({
    model_id: modelId,
    fipe_year_code: year.code,
    model_year: year.modelYear,
    fuel: year.fuel,
    synced_at: syncedAt,
  }))
  const { error } = await db
    .from('fipe_model_years')
    .upsert(rows, { onConflict: 'model_id,fipe_year_code' })

  if (error) {
    throw error
  }
}

/** Só vale para versão ainda sem perfil: uma versão mapeada não volta a falhar. */
export async function markMappingFailed(db: Db, id: number): Promise<void> {
  const { error } = await db
    .from('fipe_model_years')
    .update({ mapping_status: 'failed' })
    .eq('id', id)
    .is('tech_profile_id', null)

  if (error) {
    throw error
  }
}

export async function markPriceSynced(db: Db, id: number, input: { fipeVehicleCode: string, syncedAt: string }): Promise<void> {
  const { error } = await db
    .from('fipe_model_years')
    .update({ fipe_vehicle_code: input.fipeVehicleCode, price_synced_at: input.syncedAt })
    .eq('id', id)

  if (error) {
    throw error
  }
}
