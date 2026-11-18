import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '#shared/types/database'
import { modelParamsSchema } from '#shared/schemas/catalog'
import { listModelYears } from '../../../../services/catalog/catalog'

export default defineEventHandler(async (event) => {
  await requireMember(event)
  const { modelId } = await getValidatedRouterParams(event, params => modelParamsSchema.parse(params))

  return listModelYears(serverSupabaseServiceRole<Database>(event), modelId)
})
