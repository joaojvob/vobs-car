import type { JwtPayload } from '@supabase/supabase-js'
import type { H3Event } from 'h3'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '#shared/types/database'
import type { Member } from '#shared/types/member'
import { findMemberById } from '../repositories/profiles'

/** Exige sessão válida. Os claims vêm do JWT verificado pelo Supabase. */
export async function requireUser(event: H3Event): Promise<JwtPayload> {
  const claims = await serverSupabaseUser(event).catch(() => null)

  if (!claims) {
    throw createError({ statusCode: 401, message: 'Faça login para continuar.' })
  }

  return claims
}

/** Exige membro: sessão válida e perfil criado a partir da allowlist (ADR-0006). */
export async function requireMember(event: H3Event): Promise<Member> {
  const claims = await requireUser(event)
  const member = await findMemberById(serverSupabaseServiceRole<Database>(event), claims.sub)

  if (!member) {
    throw createError({ statusCode: 403, message: 'Acesso restrito a convidados.' })
  }

  return member
}
