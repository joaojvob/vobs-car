import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '#shared/types/database'
import type { CatalogOption, VehicleType } from '#shared/types/catalog'

type Db = SupabaseClient<Database>

/** Marca resumida, com o que é preciso para montar as URLs da FIPE. */
export interface BrandRef {
  id: number
  vehicleType: VehicleType
  fipeCode: string
  name: string
}

export interface ModelRecord {
  id: number
  fipeCode: string
  name: string
  yearsSyncedAt: string | null
  brand: BrandRef
}

export async function listModelsByBrand(db: Db, brandId: number): Promise<CatalogOption[]> {
  const { data, error } = await db
    .from('fipe_models')
    .select('id, name')
    .eq('brand_id', brandId)

  if (error) {
    throw error
  }

  return data
}

export async function findModelById(db: Db, id: number): Promise<ModelRecord | null> {
  const { data, error } = await db
    .from('fipe_models')
    .select('id, fipe_code, name, years_synced_at, brand:fipe_brands (id, vehicle_type, fipe_code, name)')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  return {
    id: data.id,
    fipeCode: data.fipe_code,
    name: data.name,
    yearsSyncedAt: data.years_synced_at,
    brand: {
      id: data.brand.id,
      vehicleType: data.brand.vehicle_type,
      fipeCode: data.brand.fipe_code,
      name: data.brand.name,
    },
  }
}

/** Grava a lista da FIPE numa única chamada. Modelos já espelhados só têm nome e `synced_at` atualizados. */
export async function upsertModels(
  db: Db,
  brandId: number,
  items: ReadonlyArray<{ code: string, name: string }>,
  syncedAt: string,
): Promise<void> {
  if (items.length === 0) {
    return
  }

  const rows = items.map(item => ({ brand_id: brandId, fipe_code: item.code, name: item.name, synced_at: syncedAt }))
  const { error } = await db
    .from('fipe_models')
    .upsert(rows, { onConflict: 'brand_id,fipe_code' })

  if (error) {
    throw error
  }
}

export async function markModelYearsSynced(db: Db, id: number, syncedAt: string): Promise<void> {
  const { error } = await db
    .from('fipe_models')
    .update({ years_synced_at: syncedAt })
    .eq('id', id)

  if (error) {
    throw error
  }
}
