import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '#shared/types/database'
import { brandsQuerySchema } from '#shared/schemas/catalog'
import { listBrands } from '../../../services/catalog/catalog'

export default defineEventHandler(async (event) => {
  await requireMember(event)
  const { type } = await getValidatedQuery(event, query => brandsQuerySchema.parse(query))

  return listBrands(serverSupabaseServiceRole<Database>(event), type)
})
