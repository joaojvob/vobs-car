import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '#shared/types/database'
import type { VehicleType } from '#shared/types/catalog'

type Db = SupabaseClient<Database>

export interface BrandRecord {
  id: number
  vehicleType: VehicleType
  fipeCode: string
  name: string
  syncedAt: string
  modelsSyncedAt: string | null
}

const BRAND_COLUMNS = 'id, vehicle_type, fipe_code, name, synced_at, models_synced_at'

export async function listBrandsByType(db: Db, vehicleType: VehicleType): Promise<BrandRecord[]> {
  const { data, error } = await db
    .from('fipe_brands')
    .select(BRAND_COLUMNS)
    .eq('vehicle_type', vehicleType)

  if (error) {
    throw error
  }

  return data.map(toBrandRecord)
}

export async function findBrandById(db: Db, id: number): Promise<BrandRecord | null> {
  const { data, error } = await db
    .from('fipe_brands')
    .select(BRAND_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data ? toBrandRecord(data) : null
}

/** Grava a lista da FIPE numa única chamada. Marcas já espelhadas só têm nome e `synced_at` atualizados. */
export async function upsertBrands(
  db: Db,
  vehicleType: VehicleType,
  items: ReadonlyArray<{ code: string, name: string }>,
  syncedAt: string,
): Promise<void> {
  if (items.length === 0) {
    return
  }

  const rows = items.map(item => ({ vehicle_type: vehicleType, fipe_code: item.code, name: item.name, synced_at: syncedAt }))
  const { error } = await db
    .from('fipe_brands')
    .upsert(rows, { onConflict: 'vehicle_type,fipe_code' })

  if (error) {
    throw error
  }
}

export async function markBrandModelsSynced(db: Db, id: number, syncedAt: string): Promise<void> {
  const { error } = await db
    .from('fipe_brands')
    .update({ models_synced_at: syncedAt })
    .eq('id', id)

  if (error) {
    throw error
  }
}

function toBrandRecord(row: Tables<'fipe_brands'>): BrandRecord {
  return {
    id: row.id,
    vehicleType: row.vehicle_type,
    fipeCode: row.fipe_code,
    name: row.name,
    syncedAt: row.synced_at,
    modelsSyncedAt: row.models_synced_at,
  }
}
