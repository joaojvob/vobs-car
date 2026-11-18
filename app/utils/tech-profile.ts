import type { Enums } from '#shared/types/database'
import type { TechProfile } from '#shared/types/tech-profile'

const TRANSMISSION_LABELS: Record<Enums<'transmission_type'>, string> = {
  manual: 'Manual',
  automatic: 'Automático',
  cvt: 'CVT',
  dct: 'Dupla embreagem',
  amt: 'Automatizado',
}

const ASPIRATION_LABELS: Record<Enums<'aspiration'>, string | null> = {
  natural: null,
  turbo: 'turbo',
  supercharged: 'com compressor',
}

const HYBRID_LABELS: Record<'hybrid' | 'phev', string> = {
  hybrid: 'híbrido',
  phev: 'híbrido plug-in',
}

const FINAL_DRIVE_LABELS: Record<Enums<'final_drive'>, string> = {
  chain: 'corrente',
  belt: 'correia',
  shaft: 'cardã',
  gear: 'engrenagem',
}

/** "Mk3 (2014–2019)"; geração ainda em produção termina em "atual". */
export function formatGeneration(profile: TechProfile): string {
  return `${profile.generation} (${profile.yearStart}–${profile.yearEnd ?? 'atual'})`
}

/** "Ford Sigma 1.6", "Volkswagen EA211 1.0 turbo", "Honda 160 cc", "BYD elétrico". */
export function formatEngine(profile: TechProfile): string {
  const { engine } = profile

  if (engine.powertrain === 'ev') {
    return joinWords([engine.manufacturer, engine.code, 'elétrico'])
  }

  const displacement = profile.vehicleType === 'car'
    ? (engine.displacementCc / 1000).toFixed(1)
    : `${engine.displacementCc} cc`

  return joinWords([
    engine.manufacturer,
    engine.code,
    displacement,
    ASPIRATION_LABELS[engine.aspiration],
    engine.powertrain === 'ice' ? null : HYBRID_LABELS[engine.powertrain],
  ])
}

/** "Manual de 5 marchas", "Dupla embreagem de 6 marchas (DPS6)"; em motos, com a transmissão final. */
export function formatTransmission(profile: TechProfile): string {
  const { transmission } = profile
  const kind = transmission.type === 'cvt'
    ? TRANSMISSION_LABELS.cvt
    : `${TRANSMISSION_LABELS[transmission.type]} de ${transmission.gears} ${transmission.gears === 1 ? 'marcha' : 'marchas'}`
  const label = transmission.code ? `${kind} (${transmission.code})` : kind

  return profile.vehicleType === 'motorcycle'
    ? `${label}, transmissão final por ${FINAL_DRIVE_LABELS[profile.transmission.finalDrive]}`
    : label
}

function joinWords(parts: ReadonlyArray<string | null>): string {
  return parts.filter(part => part !== null && part !== '').join(' ')
}
