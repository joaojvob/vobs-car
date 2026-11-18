import type { Enums } from './database'
import type { VehicleProfile } from './tech-profile'

export type VehicleType = Enums<'vehicle_type'>
export type FuelType = Enums<'fuel_type'>

/** Item de lista do catálogo (marca ou modelo). O `id` é do espelho local, não o código FIPE. */
export interface CatalogOption {
  id: number
  name: string
}

/** Versão FIPE na lista de anos de um modelo. `modelYear` nulo significa zero km. */
export interface CatalogModelYear {
  id: number
  modelYear: number | null
  fuel: FuelType
}

/** Preço médio da FIPE. `referenceMonth` é o dia 1 do mês de referência (`AAAA-MM-01`). */
export interface FipePrice {
  cents: number
  referenceMonth: string
}

/** Versão FIPE escolhida, com marca, modelo, o preço mais recente e o perfil técnico. */
export interface CatalogVehicle {
  id: number
  vehicleType: VehicleType
  brand: CatalogOption
  model: CatalogOption
  modelYear: number | null
  fuel: FuelType
  fipeCode: string | null
  price: FipePrice | null
  profile: VehicleProfile
}
