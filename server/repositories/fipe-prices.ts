import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '#shared/types/database'
import type { FipePrice } from '#shared/types/catalog'

type Db = SupabaseClient<Database>

export async function findLatestPrice(db: Db, modelYearId: number): Promise<FipePrice | null> {
  const { data, error } = await db
    .from('fipe_prices')
    .select('price_cents, reference_month')
    .eq('model_year_id', modelYearId)
    .order('reference_month', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data ? { cents: data.price_cents, referenceMonth: data.reference_month } : null
}

/** Um preço por mês de referência: consultar de novo no mesmo mês só corrige o valor. */
export async function upsertPrice(db: Db, modelYearId: number, price: FipePrice): Promise<void> {
  const { error } = await db
    .from('fipe_prices')
    .upsert(
      { model_year_id: modelYearId, reference_month: price.referenceMonth, price_cents: price.cents },
      { onConflict: 'model_year_id,reference_month' },
    )

  if (error) {
    throw error
  }
}
