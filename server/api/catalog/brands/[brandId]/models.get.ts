import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '#shared/types/database'
import { brandParamsSchema } from '#shared/schemas/catalog'
import { listModels } from '../../../../services/catalog/catalog'

export default defineEventHandler(async (event) => {
  await requireMember(event)
  const { brandId } = await getValidatedRouterParams(event, params => brandParamsSchema.parse(params))

  return listModels(serverSupabaseServiceRole<Database>(event), brandId)
})
