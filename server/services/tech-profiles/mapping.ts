import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '#shared/types/database'
import type { VehicleType } from '#shared/types/catalog'
import type { MappingResult, ProfileMapping } from '#shared/types/tech-profile'
import { mappingResultSchema } from '#shared/schemas/tech-profile'
import { buildProfileKeys } from '#shared/utils/tech-profile-key'
import { findModelYearById, markMappingFailed } from '../../repositories/fipe-model-years'
import { saveProfileMapping } from '../../repositories/tech-profiles'
import type { AiProvider, StructureResult } from '../ai/provider'
import { buildMappingPrompt } from '../ai/prompts/mapping'

type Db = SupabaseClient<Database>

type MappingOutcome = { mapping: ProfileMapping } | { failure: unknown }

/**
 * Etapa 0 da IA (ADR-0004): identifica o perfil técnico de uma versão FIPE pelo nome, ano e combustível.
 * Motor, câmbio e perfil com a mesma chave são reaproveitados: é o que evita pesquisar
 * de novo uma mecânica que já tem conteúdo (ADR-0002).
 *
 * Versão que já tem perfil é devolvida sem chamar a IA. Resposta fora do schema, de outro tipo de veículo
 * ou "não identificada" marca a versão como `failed`, sem gravar nada parcial. Se o provedor não responder,
 * o `AiUnavailableError` sobe e a versão continua pendente, para tentar de novo.
 * Devolve o id do perfil, ou `null` quando o mapeamento falhou.
 */
export async function mapModelYear(db: Db, ai: AiProvider, modelYearId: number): Promise<number | null> {
  const version = await findModelYearById(db, modelYearId)

  if (!version) {
    throw createError({ statusCode: 404, message: 'Versão não encontrada.' })
  }

  if (version.techProfile) {
    return version.techProfile.id
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
  const outcome = toMappingOutcome(result, brand.vehicleType)
  const context = { modelYearId, promptVersion: prompt.version, model: result.model }

  if ('failure' in outcome) {
    logger.warn('Mapeamento falhou', { ...context, error: outcome.failure })
    await markMappingFailed(db, modelYearId)

    return null
  }

  const techProfileId = await saveProfileMapping(db, modelYearId, outcome.mapping, buildProfileKeys(brand.name, outcome.mapping))

  logger.info('Versão mapeada', { ...context, techProfileId })

  return techProfileId
}

function toMappingOutcome(result: StructureResult<MappingResult>, vehicleType: VehicleType): MappingOutcome {
  if (!result.success) {
    return { failure: result.error }
  }

  if (result.data.status === 'unidentified') {
    return { failure: 'A IA não identificou a versão' }
  }

  if (result.data.profile.vehicleType !== vehicleType) {
    return { failure: `A IA devolveu outro tipo de veículo: ${result.data.profile.vehicleType}` }
  }

  return { mapping: result.data.profile }
}
