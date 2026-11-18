import { z } from 'zod'
import { Constants, type Enums } from '../types/database'

/*
 * Resultado do mapeamento de uma versão FIPE para o perfil técnico (ADR-0002).
 * É o contrato da etapa 0 da IA (ADR-0004) e também o formato em que o perfil é lido do banco.
 * Uniões por vehicleType e powertrain (ADR-0008): combinações inválidas não passam na validação.
 */

const { aspiration, final_drive: finalDrive } = Constants.public.Enums

const shortText = z.string().trim().min(1).max(60)
const modelYear = z.number().int().min(1900).max(2100)

const COMBUSTION_POWERTRAINS = ['ice', 'hybrid', 'phev'] as const satisfies ReadonlyArray<Enums<'powertrain'>>
const ENGINE_FUELS = ['gasoline', 'ethanol', 'flex', 'diesel'] as const satisfies ReadonlyArray<Enums<'fuel_type'>>
const GEARED_TRANSMISSIONS = ['manual', 'automatic', 'dct', 'amt'] as const satisfies ReadonlyArray<Enums<'transmission_type'>>
const CAR_BODY_TYPES = ['hatch', 'sedan', 'suv', 'pickup', 'van'] as const satisfies ReadonlyArray<Enums<'body_type'>>
const MOTORCYCLE_BODY_TYPES = [
  'moto_street', 'moto_naked', 'moto_sport', 'moto_trail', 'moto_scooter', 'moto_custom',
] as const satisfies ReadonlyArray<Enums<'body_type'>>

export const engineMappingSchema = z.discriminatedUnion('powertrain', [
  z.object({
    powertrain: z.enum(COMBUSTION_POWERTRAINS),
    manufacturer: shortText,
    code: shortText.nullable(),
    displacementCc: z.number().int().min(50).max(10000),
    cylinders: z.number().int().min(1).max(16),
    aspiration: z.enum(aspiration),
    fuel: z.enum(ENGINE_FUELS),
  }),
  z.object({
    powertrain: z.literal('ev'),
    manufacturer: shortText,
    code: shortText.nullable(),
  }),
])

const gearedTransmission = z.object({
  type: z.enum(GEARED_TRANSMISSIONS),
  code: shortText.nullable(),
  gears: z.number().int().min(1).max(12),
})

const cvtTransmission = z.object({
  type: z.literal('cvt'),
  code: shortText.nullable(),
})

const carTransmissionSchema = z.discriminatedUnion('type', [gearedTransmission, cvtTransmission])

const motorcycleTransmissionSchema = z.discriminatedUnion('type', [
  gearedTransmission.extend({ finalDrive: z.enum(finalDrive) }),
  cvtTransmission.extend({ finalDrive: z.enum(finalDrive) }),
])

const generationFields = {
  family: shortText,
  generation: shortText,
  yearStart: modelYear,
  yearEnd: modelYear.nullable(),
  engine: engineMappingSchema,
}

export const profileMappingSchema = z
  .discriminatedUnion('vehicleType', [
    z.object({
      vehicleType: z.literal('car'),
      bodyType: z.enum(CAR_BODY_TYPES),
      ...generationFields,
      transmission: carTransmissionSchema,
    }),
    z.object({
      vehicleType: z.literal('motorcycle'),
      bodyType: z.enum(MOTORCYCLE_BODY_TYPES),
      ...generationFields,
      transmission: motorcycleTransmissionSchema,
    }),
  ])
  .refine(mapping => mapping.yearEnd === null || mapping.yearEnd >= mapping.yearStart, {
    path: ['yearEnd'],
    message: 'O último ano da geração não pode ser anterior ao primeiro.',
  })

/** Resposta da etapa 0. A IA pode dizer que não reconheceu a versão, em vez de inventar um perfil. */
export const mappingResultSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('identified'), profile: profileMappingSchema }),
  z.object({ status: z.literal('unidentified') }),
])
