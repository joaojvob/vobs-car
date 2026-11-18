import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '#shared/types/database'
import { modelYearParamsSchema } from '#shared/schemas/catalog'
import { geminiProvider } from '../../../services/ai/gemini'
import { requestMapping, runMappingJob } from '../../../services/jobs/mapping-job'

/** Pede o mapeamento da versão e responde na hora com o job; a IA roda depois da resposta (ADR-0005). */
export default defineEventHandler(async (event) => {
  const member = await requireMember(event)
  const { modelYearId } = await getValidatedRouterParams(event, params => modelYearParamsSchema.parse(params))
  const db = serverSupabaseServiceRole<Database>(event)
  const { job, created } = await requestMapping(db, member.id, modelYearId)

  if (created) {
    event.waitUntil(runMappingJob(db, geminiProvider, job.id, modelYearId))
  }

  setResponseStatus(event, 202)

  return job
})
