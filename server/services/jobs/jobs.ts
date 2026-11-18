import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '#shared/types/database'
import type { GenerationJob } from '#shared/types/jobs'
import type { JobRecord } from '../../repositories/generation-jobs'
import { expireJob, findJobById } from '../../repositories/generation-jobs'

type Db = SupabaseClient<Database>

/** Um job ativo além deste prazo morreu sem registrar o fim, por exemplo com a função encerrada no meio. */
const JOB_TIMEOUT_MS = 5 * 60 * 1000

/** Job para o front acompanhar. Um job travado é encerrado como falho nesta leitura (ADR-0005). */
export async function getJob(db: Db, jobId: string): Promise<GenerationJob> {
  const job = await findJobById(db, jobId)

  if (!job) {
    throw createError({ statusCode: 404, message: 'Geração não encontrada.' })
  }

  return toGenerationJob(await settleStaleJob(db, job))
}

/** Encerra como falho o job ativo que passou do prazo e devolve o job como ficou. */
export async function settleStaleJob(db: Db, job: JobRecord): Promise<JobRecord> {
  const isActive = job.status === 'pending' || job.status === 'running'

  if (!isActive || Date.now() - Date.parse(job.createdAt) <= JOB_TIMEOUT_MS) {
    return job
  }

  await expireJob(db, job.id)
  logger.warn('Job encerrado por tempo esgotado', { jobId: job.id, type: job.type })

  return { ...job, status: 'failed' }
}

export function toGenerationJob(job: JobRecord): GenerationJob {
  return { id: job.id, type: job.type, status: job.status }
}
