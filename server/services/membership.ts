import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '#shared/types/database'
import type { Member } from '#shared/types/member'
import { isEmailAllowed } from '../repositories/allowed-emails'
import { createMember, findMemberById } from '../repositories/profiles'

const DISPLAY_NAME_MAX_LENGTH = 80

interface MembershipClaim {
  userId: string
  email: string | undefined
  name: string | undefined
}

/**
 * Garante que o usuário autenticado é membro (ADR-0006): o perfil só é criado
 * se o e-mail estiver na allowlist. Retorna `null` quando o acesso é negado.
 */
export async function claimMembership(db: SupabaseClient<Database>, claim: MembershipClaim): Promise<Member | null> {
  const existing = await findMemberById(db, claim.userId)

  if (existing) {
    return existing
  }

  const email = claim.email?.trim().toLowerCase()

  if (!email || !(await isEmailAllowed(db, email))) {
    return null
  }

  return createMember(db, {
    id: claim.userId,
    displayName: resolveDisplayName(claim.name, email),
  })
}

/** Nome vindo do Google; sem ele, a parte do e-mail antes do @. */
function resolveDisplayName(name: string | undefined, email: string): string {
  const fallback = email.split('@')[0] ?? email
  const candidate = name?.trim() || fallback

  return candidate.slice(0, DISPLAY_NAME_MAX_LENGTH)
}
