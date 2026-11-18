import type { z } from 'zod'
import type { Enums } from './database'
import type { engineMappingSchema, mappingResultSchema, profileMappingSchema } from '../schemas/tech-profile'

export type MappingStatus = Enums<'mapping_status'>

export type EngineMapping = z.infer<typeof engineMappingSchema>

/** Resultado do mapeamento de uma versão FIPE: carroceria, geração, motor e câmbio. */
export type ProfileMapping = z.infer<typeof profileMappingSchema>

export type MappingResult = z.infer<typeof mappingResultSchema>

/** Perfil técnico gravado: o mesmo formato do mapeamento, com o id do banco. */
export type TechProfile = ProfileMapping & { id: number }

/** Perfil de uma versão FIPE. Até o mapeamento rodar, só a situação é conhecida. */
export type VehicleProfile
  = | { status: 'mapped', techProfile: TechProfile }
    | { status: Exclude<MappingStatus, 'mapped'> }
