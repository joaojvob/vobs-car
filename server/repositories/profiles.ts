import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '#shared/types/database'
import type { Member } from '#shared/types/member'

type Db = SupabaseClient<Database>

const MEMBER_COLUMNS = 'id, display_name, home_uf, role'

export async function findMemberById(db: Db, id: string): Promise<Member | null> {
  const { data, error } = await db
    .from('profiles')
    .select(MEMBER_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data ? toMember(data) : null
}

/**
 * Cria o perfil se ainda não existir. Em logins simultâneos do mesmo usuário,
 * o segundo insert é ignorado e o perfil existente é lido.
 */
export async function createMember(db: Db, input: { id: string, displayName: string }): Promise<Member> {
  const { data, error } = await db
    .from('profiles')
    .upsert({ id: input.id, display_name: input.displayName }, { onConflict: 'id', ignoreDuplicates: true })
    .select(MEMBER_COLUMNS)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (data) {
    return toMember(data)
  }

  const existing = await findMemberById(db, input.id)

  if (!existing) {
    throw new Error('Perfil não encontrado após a criação')
  }

  return existing
}

function toMember(row: Pick<Tables<'profiles'>, 'id' | 'display_name' | 'home_uf' | 'role'>): Member {
  return {
    id: row.id,
    displayName: row.display_name,
    homeUf: row.home_uf,
    role: row.role,
  }
}
