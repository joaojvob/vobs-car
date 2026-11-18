import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '#shared/types/database'
import type { VehicleType } from '#shared/types/catalog'
import type { MappingResult, ProfileMapping } from '#shared/types/tech-profile'
import { mappingResultSchema } from '#shared/schemas/tech-profile'
import { buildProfileKeys } from '#shared/utils/tech-profile-key'
import { findModelYearById, markMappingFailed } from '../../repositories/fipe-model-years'
import { saveProfileMapping } from '../../repositories/tech-profiles'
import type { AiProvider, StageUsage, StructureResult } from '../ai/provider'
import { buildMappingPrompt } from '../ai/prompts/mapping'

type Db = SupabaseClient<Database>

/** Desfecho da etapa 0. `usage` é nulo quando a IA não foi chamada, porque a versão já tinha perfil. */
export type MappingOutcome
  = | { status: 'mapped', techProfileId: number, usage: StageUsage | null }
    | { status: 'failed', reason: string, usage: StageUsage }

type MappingReading = { mapping: ProfileMapping } | { failure: string }

/**
 * Etapa 0 da IA (ADR-0004): identifica o perfil técnico de uma versão FIPE pelo nome, ano e combustível.
 * Motor, câmbio e perfil com a mesma chave são reaproveitados: é o que evita pesquisar
 * de novo uma mecânica que já tem conteúdo (ADR-0002).
 *
 * Versão que já tem perfil é devolvida sem chamar a IA. Resposta fora do schema, de outro tipo de veículo
 * ou "não identificada" marca a versão como `failed`, sem gravar nada parcial. Se o provedor não responder,
 * o `AiUnavailableError` sobe e a versão continua pendente, para tentar de novo.
 */
export async function mapModelYear(db: Db, ai: AiProvider, modelYearId: number): Promise<MappingOutcome> {
  const version = await findModelYearById(db, modelYearId)

  if (!version) {
    throw createError({ statusCode: 404, message: 'Versão não encontrada.' })
  }

  if (version.techProfile) {
    return { status: 'mapped', techProfileId: version.techProfile.id, usage: null }
  }

  const { brand } = version.model
  const prompt = buildMappingPrompt({
    vehicleType: brand.vehicleType,
    brandName: brand.name,
    modelName: version.model.name,
    modelYear: version.modelYear,
    fuel: version.fuel,
  })
  const result = await ai.structure({ stage: 'mapping', prompt, schema: mappingResultSchema })
  const reading = readMapping(result, brand.vehicleType)
  const usage: StageUsage = { model: result.model, promptVersion: prompt.version, ...result.usage }

  if ('failure' in reading) {
    logger.warn('Mapeamento falhou', { modelYearId, ...usage, error: reading.failure })
    await markMappingFailed(db, modelYearId)

    return { status: 'failed', reason: reading.failure, usage }
  }

  const techProfileId = await saveProfileMapping(db, modelYearId, reading.mapping, buildProfileKeys(brand.name, reading.mapping))

  logger.info('Versão mapeada', { modelYearId, ...usage, techProfileId })

  return { status: 'mapped', techProfileId, usage }
}

function readMapping(result: StructureResult<MappingResult>, vehicleType: VehicleType): MappingReading {
  if (!result.success) {
    return { failure: result.error instanceof Error ? result.error.message : String(result.error) }
  }

  if (result.data.status === 'unidentified') {
    return { failure: 'A IA não identificou a versão' }
  }

  if (result.data.profile.vehicleType !== vehicleType) {
    return { failure: `A IA devolveu outro tipo de veículo: ${result.data.profile.vehicleType}` }
  }

  return { mapping: result.data.profile }
}
