import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '#shared/types/database'
import type { JobStatus, JobType } from '#shared/types/jobs'

type Db = SupabaseClient<Database>

// Código do Postgres para violação de índice único: é a trava de job ativo recusando um segundo.
const UNIQUE_VIOLATION = '23505'
const ACTIVE_STATUSES: JobStatus[] = ['pending', 'running']
const JOB_COLUMNS = 'id, job_type, status, attempts, created_at'

export interface JobRecord {
  id: string
  type: JobType
  status: JobStatus
  attempts: number
  createdAt: string
}

export interface JobResult {
  status: Extract<JobStatus, 'succeeded' | 'failed'>
  error: string | null
  usage: Json | null
}

export async function findJobById(db: Db, id: string): Promise<JobRecord | null> {
  const { data, error } = await db
    .from('generation_jobs')
    .select(JOB_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data ? toJobRecord(data) : null
}

export async function findActiveMappingJob(db: Db, modelYearId: number): Promise<JobRecord | null> {
  const { data, error } = await db
    .from('generation_jobs')
    .select(JOB_COLUMNS)
    .eq('job_type', 'map_profile')
    .eq('fipe_model_year_id', modelYearId)
    .in('status', ACTIVE_STATUSES)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data ? toJobRecord(data) : null
}

/** Cria o job de mapeamento. Devolve `null` quando o índice único recusa: já existe um job ativo para a versão. */
export async function insertMappingJob(db: Db, modelYearId: number, requestedBy: string): Promise<JobRecord | null> {
  const { data, error } = await db
    .from('generation_jobs')
    .insert({ job_type: 'map_profile', fipe_model_year_id: modelYearId, requested_by: requestedBy })
    .select(JOB_COLUMNS)
    .single()

  if (error?.code === UNIQUE_VIOLATION) {
    return null
  }

  if (error) {
    throw error
  }

  return toJobRecord(data)
}

export async function countJobsSince(db: Db, requestedBy: string, since: string): Promise<number> {
  const { count, error } = await db
    .from('generation_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('requested_by', requestedBy)
    .gte('created_at', since)

  if (error) {
    throw error
  }

  return count ?? 0
}

export async function markJobRunning(db: Db, id: string, attempts: number): Promise<void> {
  const { error } = await db
    .from('generation_jobs')
    .update({ status: 'running', attempts, started_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    throw error
  }
}

export async function finishJob(db: Db, id: string, result: JobResult): Promise<void> {
  const { error } = await db
    .from('generation_jobs')
    .update({ ...result, finished_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    throw error
  }
}

/** Encerra como falho um job que ficou ativo além do prazo. Se ele terminou nesse meio-tempo, nada muda. */
export async function expireJob(db: Db, id: string): Promise<void> {
  const { error } = await db
    .from('generation_jobs')
    .update({ status: 'failed', error: 'Tempo esgotado', finished_at: new Date().toISOString() })
    .eq('id', id)
    .in('status', ACTIVE_STATUSES)

  if (error) {
    throw error
  }
}

function toJobRecord(row: { id: string, job_type: JobType, status: JobStatus, attempts: number, created_at: string }): JobRecord {
  return { id: row.id, type: row.job_type, status: row.status, attempts: row.attempts, createdAt: row.created_at }
}
