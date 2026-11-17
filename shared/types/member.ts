import type { Enums } from './database'

/** Membro do app: usuário autenticado cujo e-mail passou pela allowlist (ADR-0006). */
export interface Member {
  id: string
  displayName: string
  homeUf: string | null
  role: Enums<'user_role'>
}
