import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '#shared/types/database'
import { modelYearParamsSchema } from '#shared/schemas/catalog'
import { getVehicle } from '../../../services/catalog/catalog'

export default defineEventHandler(async (event) => {
  await requireMember(event)
  const { modelYearId } = await getValidatedRouterParams(event, params => modelYearParamsSchema.parse(params))

  return getVehicle(serverSupabaseServiceRole<Database>(event), modelYearId)
})
