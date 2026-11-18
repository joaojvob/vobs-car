import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '#shared/types/database'
import type { GenerationJob } from '#shared/types/jobs'
import { findModelYearById } from '../../repositories/fipe-model-years'
import type { JobResult } from '../../repositories/generation-jobs'
import { countJobsSince, findActiveMappingJob, finishJob, insertMappingJob, markJobRunning } from '../../repositories/generation-jobs'
import type { AiProvider } from '../ai/provider'
import { AiUnavailableError } from '../ai/provider'
import type { MappingOutcome } from '../tech-profiles/mapping'
import { mapModelYear } from '../tech-profiles/mapping'
import { settleStaleJob, toGenerationJob } from './jobs'

type Db = SupabaseClient<Database>

const DAY_MS = 24 * 60 * 60 * 1000
const MAX_ATTEMPTS = 2
const RETRY_DELAY_MS = 2000
const ERROR_MAX_LENGTH = 500

export interface MappingRequest {
  job: GenerationJob
  created: boolean
}

/**
 * Pede o mapeamento de uma versão FIPE (ADR-0005) e devolve o job ativo da versão, novo ou já existente.
 * Só job novo conta no limite diário. Com `created`, quem chama roda `runMappingJob` em segundo plano.
 * A trava é o índice único do banco: com dois pedidos ao mesmo tempo, só um job é criado.
 */
export async function requestMapping(db: Db, userId: string, modelYearId: number): Promise<MappingRequest> {
  const version = await findModelYearById(db, modelYearId)

  if (!version) {
    throw createError({ statusCode: 404, message: 'Versão não encontrada.' })
  }

  if (version.techProfile) {
    throw createError({ statusCode: 409, message: 'O motor e o câmbio desta versão já foram identificados.' })
  }

  const active = await findLiveMappingJob(db, modelYearId)

  if (active) {
    return { job: active, created: false }
  }

  await assertWithinDailyLimit(db, userId)

  const created = await insertMappingJob(db, modelYearId, userId)

  if (created) {
    return { job: toGenerationJob(created), created: true }
  }

  // Outro pedido criou o job entre a consulta e a gravação.
  const concurrent = await findActiveMappingJob(db, modelYearId)

  if (!concurrent) {
    throw createError({ statusCode: 409, message: 'O mapeamento desta versão acabou de mudar. Tente de novo.' })
  }

  return { job: toGenerationJob(concurrent), created: false }
}

/**
 * Executa o job em segundo plano e nunca lança: todo desfecho fica no job e no log.
 * Só a indisponibilidade do provedor ganha nova tentativa; resposta inválida já é um desfecho.
 */
export async function runMappingJob(db: Db, ai: AiProvider, jobId: string, modelYearId: number): Promise<void> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await markJobRunning(db, jobId, attempt)
      await finishJob(db, jobId, toJobResult(await mapModelYear(db, ai, modelYearId)))

      return
    }
    catch (error) {
      const context = { jobId, modelYearId, attempt, error, cause: error instanceof Error ? error.cause : undefined }

      if (!(error instanceof AiUnavailableError) || attempt === MAX_ATTEMPTS) {
        logger.error('Job de mapeamento falhou', context)
        await failJob(db, jobId, error)

        return
      }

      logger.warn('IA indisponível, nova tentativa', context)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
    }
  }
}

async function findLiveMappingJob(db: Db, modelYearId: number): Promise<GenerationJob | null> {
  const active = await findActiveMappingJob(db, modelYearId)

  if (!active) {
    return null
  }

  const settled = await settleStaleJob(db, active)

  return settled.status === 'failed' ? null : toGenerationJob(settled)
}

/** Contar e criar não é atômico: dois pedidos simultâneos podem passar do limite por um, o que é aceitável. */
async function assertWithinDailyLimit(db: Db, userId: string): Promise<void> {
  const limit = useRuntimeConfig().generationDailyLimit
  const used = await countJobsSince(db, userId, new Date(Date.now() - DAY_MS).toISOString())

  if (used >= limit) {
    throw createError({ statusCode: 429, message: `Você chegou ao limite de ${limit} gerações em 24 horas. Tente de novo mais tarde.` })
  }
}

function toJobResult(outcome: MappingOutcome): JobResult {
  const usage = outcome.usage ? { mapping: outcome.usage } : null

  return outcome.status === 'mapped'
    ? { status: 'succeeded', error: null, usage }
    : { status: 'failed', error: outcome.reason.slice(0, ERROR_MAX_LENGTH), usage }
}

async function failJob(db: Db, jobId: string, error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : String(error)

  await finishJob(db, jobId, { status: 'failed', error: message.slice(0, ERROR_MAX_LENGTH), usage: null })
    .catch(finishError => logger.error('Não foi possível registrar a falha do job', { jobId, error: finishError }))
}
