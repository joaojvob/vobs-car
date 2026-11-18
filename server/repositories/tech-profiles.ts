import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables, TablesInsert } from '#shared/types/database'
import { profileMappingSchema } from '#shared/schemas/tech-profile'
import type { EngineMapping, ProfileMapping, TechProfile } from '#shared/types/tech-profile'
import type { ProfileKeys } from '#shared/utils/tech-profile-key'

type Db = SupabaseClient<Database>

/** Perfil embutido na consulta da versão FIPE, com motor e câmbio. */
export type TechProfileRow = Pick<
  Tables<'tech_profiles'>,
  'id' | 'vehicle_type' | 'body_type' | 'family' | 'generation' | 'year_start' | 'year_end'
> & {
  engine: Pick<Tables<'engines'>, 'powertrain' | 'manufacturer' | 'code' | 'displacement_cc' | 'cylinders' | 'aspiration' | 'fuel'>
  transmission: Pick<Tables<'transmissions'>, 'type' | 'code' | 'gears' | 'final_drive'>
}

/**
 * Grava o mapeamento pela função `map_model_year`: motor, câmbio, perfil e o vínculo com a versão
 * na mesma transação. Devolve o id do perfil, novo ou reaproveitado.
 */
export async function saveProfileMapping(db: Db, modelYearId: number, mapping: ProfileMapping, keys: ProfileKeys): Promise<number> {
  const { data, error } = await db.rpc('map_model_year', {
    p_model_year_id: modelYearId,
    p_engine: toEngineRow(mapping.engine, keys.engineSlug),
    p_transmission: toTransmissionRow(mapping, keys.transmissionSlug),
    p_profile: toProfileRow(mapping, keys.normalizedKey),
  })

  if (error) {
    throw error
  }

  return data
}

/** As regras do banco garantem que o perfil gravado é um mapeamento válido; o schema só devolve o tipo da união. */
export function toTechProfile(row: TechProfileRow): TechProfile {
  const { engine, transmission } = row
  const mapping = profileMappingSchema.parse({
    vehicleType: row.vehicle_type,
    bodyType: row.body_type,
    family: row.family,
    generation: row.generation,
    yearStart: row.year_start,
    yearEnd: row.year_end,
    engine: {
      powertrain: engine.powertrain,
      manufacturer: engine.manufacturer,
      code: engine.code,
      displacementCc: engine.displacement_cc,
      cylinders: engine.cylinders,
      aspiration: engine.aspiration,
      fuel: engine.fuel,
    },
    transmission: {
      type: transmission.type,
      code: transmission.code,
      gears: transmission.gears,
      finalDrive: transmission.final_drive,
    },
  })

  return { id: row.id, ...mapping }
}

function toEngineRow(engine: EngineMapping, slug: string): TablesInsert<'engines'> {
  if (engine.powertrain === 'ev') {
    return { slug, manufacturer: engine.manufacturer, code: engine.code, powertrain: 'ev', fuel: 'electric' }
  }

  return {
    slug,
    manufacturer: engine.manufacturer,
    code: engine.code,
    displacement_cc: engine.displacementCc,
    cylinders: engine.cylinders,
    aspiration: engine.aspiration,
    fuel: engine.fuel,
    powertrain: engine.powertrain,
  }
}

function toTransmissionRow(mapping: ProfileMapping, slug: string): TablesInsert<'transmissions'> {
  const { transmission } = mapping

  return {
    slug,
    type: transmission.type,
    code: transmission.code,
    gears: transmission.type === 'cvt' ? null : transmission.gears,
    final_drive: mapping.vehicleType === 'motorcycle' ? mapping.transmission.finalDrive : null,
  }
}

/** Tipo de veículo, marca, motor e câmbio do perfil são preenchidos pela função, a partir da versão. */
function toProfileRow(
  mapping: ProfileMapping,
  normalizedKey: string,
): Pick<TablesInsert<'tech_profiles'>, 'normalized_key' | 'body_type' | 'family' | 'generation' | 'year_start' | 'year_end'> {
  return {
    normalized_key: normalizedKey,
    body_type: mapping.bodyType,
    family: mapping.family,
    generation: mapping.generation,
    year_start: mapping.yearStart,
    year_end: mapping.yearEnd,
  }
}
