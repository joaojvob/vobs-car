import type { VehicleType } from '../types/catalog'
import type { EngineMapping, ProfileMapping } from '../types/tech-profile'

/*
 * Chaves que evitam motores, câmbios e perfis duplicados (ADR-0002).
 * O mapeamento vem da IA e o texto varia entre chamadas ("Ford" e "FORD", 1596 cc e 1598 cc),
 * então cada parte é normalizada e a cilindrada é arredondada antes de entrar na chave.
 * Duplicatas que escaparem são unificadas à mão.
 */

export interface ProfileKeys {
  engineSlug: string
  transmissionSlug: string
  normalizedKey: string
}

/** `brandName` é o nome da marca na FIPE, o mesmo que o perfil grava. */
export function buildProfileKeys(brandName: string, mapping: ProfileMapping): ProfileKeys {
  const engineSlug = buildEngineSlug(mapping.vehicleType, mapping.engine)
  const transmissionSlug = buildTransmissionSlug(brandName, mapping)
  const normalizedKey = [mapping.vehicleType, brandName, mapping.family, mapping.generation]
    .map(slugify)
    .concat(engineSlug, transmissionSlug)
    .join(':')

  return { engineSlug, transmissionSlug, normalizedKey }
}

/**
 * O combustível fica de fora: a FIPE chama o mesmo motor de "Flex" num ano e de "Gasolina" em outro,
 * e isso dividiria um perfil em dois. A exceção é o diesel, que é sempre outro motor.
 */
export function buildEngineSlug(vehicleType: VehicleType, engine: EngineMapping): string {
  if (engine.powertrain === 'ev') {
    return joinSlug([engine.manufacturer, engine.code, 'ev'])
  }

  return joinSlug([
    engine.manufacturer,
    engine.code,
    formatDisplacement(vehicleType, engine.displacementCc),
    engine.aspiration === 'natural' ? null : engine.aspiration,
    engine.fuel === 'diesel' ? 'diesel' : null,
    engine.powertrain === 'ice' ? null : engine.powertrain,
  ])
}

/**
 * Com código, o câmbio é o mesmo em qualquer marca (o DQ200 equipa VW e Audi).
 * Sem código, fica restrito à marca: "manual de 5 marchas" sozinho juntaria câmbios diferentes.
 */
export function buildTransmissionSlug(brandName: string, mapping: ProfileMapping): string {
  const { transmission } = mapping
  const gears = transmission.type === 'cvt' ? null : String(transmission.gears)
  const identity = transmission.code ? [transmission.type, transmission.code] : [brandName, transmission.type, gears]

  return joinSlug([...identity, mapping.vehicleType === 'motorcycle' ? mapping.transmission.finalDrive : null])
}

/** Minúsculas, sem acentos e com hífen no lugar de qualquer outro caractere. */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Carros em litros com uma casa (1596 cc vira 1.6); motos em cc, arredondados a 10 (162,7 cc vira 160). */
function formatDisplacement(vehicleType: VehicleType, displacementCc: number): string {
  return vehicleType === 'car'
    ? (Math.round(displacementCc / 100) / 10).toFixed(1)
    : `${Math.round(displacementCc / 10) * 10}cc`
}

function joinSlug(parts: ReadonlyArray<string | null>): string {
  return parts
    .filter(part => part !== null)
    .map(slugify)
    .filter(part => part !== '')
    .join('-')
}
