import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '#shared/types/database'
import { jobParamsSchema } from '#shared/schemas/jobs'
import { getJob } from '../../services/jobs/jobs'

/**
 * Situação de um job, para o front acompanhar quando o Realtime não entrega:
 * conexão caída ou job pedido por outro membro, que o RLS não deixa assinar.
 */
export default defineEventHandler(async (event) => {
  await requireMember(event)
  const { jobId } = await getValidatedRouterParams(event, params => jobParamsSchema.parse(params))

  return getJob(serverSupabaseServiceRole<Database>(event), jobId)
})
