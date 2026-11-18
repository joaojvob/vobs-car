import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '#shared/types/database'
import type { ProfileMapping } from '#shared/types/tech-profile'
import { buildProfileKeys } from '#shared/utils/tech-profile-key'
import { findModelYearById } from '../../repositories/fipe-model-years'
import { saveProfileMapping } from '../../repositories/tech-profiles'

type Db = SupabaseClient<Database>

/**
 * Liga uma versão FIPE ao perfil técnico a partir do resultado do mapeamento
 * (etapa 0 da IA, ADR-0004), que já chega validado pelo `profileMappingSchema`.
 * Motor, câmbio e perfil com a mesma chave são reaproveitados: é o que evita pesquisar
 * de novo uma mecânica que já tem conteúdo (ADR-0002). Devolve o id do perfil.
 */
export async function applyProfileMapping(db: Db, modelYearId: number, mapping: ProfileMapping): Promise<number> {
  const version = await findModelYearById(db, modelYearId)

  if (!version) {
    throw createError({ statusCode: 404, message: 'Versão não encontrada.' })
  }

  const { brand } = version.model

  if (mapping.vehicleType !== brand.vehicleType) {
    throw createError({ statusCode: 422, message: 'O mapeamento não corresponde ao tipo do veículo.' })
  }

  return saveProfileMapping(db, modelYearId, mapping, buildProfileKeys(brand.name, mapping))
}
