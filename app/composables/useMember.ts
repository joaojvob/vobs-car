import type { Member } from '#shared/types/member'

/**
 * Membro da sessão atual. O estado é compartilhado entre servidor e cliente (`useState`)
 * e carregado pelo middleware global; `null` significa ainda não carregado ou sem acesso.
 */
export function useMember() {
  const member = useState<Member | null>('member', () => null)
  const supabase = useSupabaseClient()
  const requestFetch = useRequestFetch()

  /** Lê o membro da sessão. Retorna `null` se o usuário não tiver perfil. */
  async function load(): Promise<Member | null> {
    member.value = await nullOnForbidden(requestFetch<Member>('/api/me'))

    return member.value
  }

  /** Confere a allowlist após o login e cria o perfil no primeiro acesso. */
  async function claim(): Promise<Member | null> {
    member.value = await nullOnForbidden(requestFetch<Member>('/api/auth/membership', { method: 'POST' }))

    return member.value
  }

  async function signOut() {
    await supabase.auth.signOut()
    member.value = null
    await navigateTo('/login', { replace: true })
  }

  return { member: readonly(member), load, claim, signOut }
}

async function nullOnForbidden<T>(request: Promise<T>): Promise<T | null> {
  try {
    return await request
  }
  catch (error) {
    if ((error as { statusCode?: number }).statusCode === 403) {
      return null
    }

    throw error
  }
}
