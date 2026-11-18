import type { CatalogVehicle } from '#shared/types/catalog'
import type { GenerationJob } from '#shared/types/jobs'

export type MappingState = 'idle' | 'running' | 'failed'

/**
 * Identifica o motor e o câmbio da versão escolhida (etapa 0 da IA) quando ela ainda não tem perfil.
 * Versão pendente dispara o pedido sozinha, uma vez a cada escolha; depois de uma falha, só o botão
 * tenta de novo, para uma falha não virar uma sequência de chamadas. Ao fim do job, a versão é recarregada.
 */
export function useProfileMapping(vehicle: Ref<CatalogVehicle | null>, refresh: () => Promise<void>) {
  const job = ref<GenerationJob | null>(null)
  const requesting = ref(false)
  const error = ref<string | null>(null)
  const { status: jobStatus } = useGenerationJob(job)

  const state = computed<MappingState>(() => {
    if (requesting.value || jobStatus.value === 'pending' || jobStatus.value === 'running') {
      return 'running'
    }

    return error.value || jobStatus.value === 'failed' ? 'failed' : 'idle'
  })

  async function request() {
    const modelYearId = vehicle.value?.id

    if (modelYearId === undefined) {
      return
    }

    requesting.value = true
    error.value = null

    try {
      const created = await $fetch<GenerationJob>(`/api/vehicles/${modelYearId}/mapping`, { method: 'POST' })

      // A escolha pode ter mudado enquanto o pedido estava em andamento.
      if (vehicle.value?.id === modelYearId) {
        job.value = created
      }
    }
    catch (requestError) {
      // 409: a versão já foi identificada, por exemplo pelo pedido de outro membro.
      if ((requestError as { statusCode?: number }).statusCode === 409) {
        await refresh()
      }
      else {
        error.value = describeFetchError(requestError)
      }
    }
    finally {
      requesting.value = false
    }
  }

  watch(() => vehicle.value?.id, () => {
    job.value = null
    error.value = null

    if (vehicle.value?.profile.status === 'pending') {
      void request()
    }
  })

  watch(jobStatus, async (status) => {
    if (status === 'succeeded' || status === 'failed') {
      await refresh()
    }
  })

  return { state, error: readonly(error), retry: request }
}
