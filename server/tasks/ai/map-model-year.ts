import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '#shared/types/database'
import { geminiProvider } from '../../services/ai/gemini'
import { mapModelYear } from '../../services/tech-profiles/mapping'

/*
 * Mapeia uma versão FIPE à mão, enquanto os jobs (ADR-0005) não existem.
 * A rota que executa tasks só existe no servidor de desenvolvimento; com o `pnpm dev` rodando:
 *   pnpm exec nuxi task run ai:map-model-year --payload '{"modelYearId": 123}'
 * Cada execução é uma chamada real à IA e gasta cota.
 */

const payloadSchema = z.object({
  modelYearId: z.coerce.number().int().positive(),
})

export default defineTask({
  meta: {
    description: 'Mapeia uma versão FIPE para o perfil técnico com a IA',
  },
  async run({ payload }) {
    const { modelYearId } = payloadSchema.parse(payload)
    const techProfileId = await mapModelYear(createServiceRoleClient(), geminiProvider, modelYearId)

    return { result: { modelYearId, techProfileId } }
  },
})

/** Task não tem requisição, então o client não pode vir do `serverSupabaseServiceRole(event)`. */
function createServiceRoleClient(): SupabaseClient<Database> {
  const config = useRuntimeConfig()

  return createClient<Database>(config.public.supabase.url, config.supabase.secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
