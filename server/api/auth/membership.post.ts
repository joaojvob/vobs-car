import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '#shared/types/database'
import { claimMembership } from '../../services/membership'

/** Chamado após o login com Google: confere a allowlist e cria o perfil no primeiro acesso. */
export default defineEventHandler(async (event) => {
  const claims = await requireUser(event)
  const fullName: unknown = claims.user_metadata?.full_name ?? claims.user_metadata?.name

  const member = await claimMembership(serverSupabaseServiceRole<Database>(event), {
    userId: claims.sub,
    email: claims.email,
    name: typeof fullName === 'string' ? fullName : undefined,
  })

  if (!member) {
    logger.warn('Login recusado: e-mail fora da allowlist', { userId: claims.sub })
    throw createError({ statusCode: 403, message: 'Seu e-mail não está na lista de convidados.' })
  }

  return member
})
