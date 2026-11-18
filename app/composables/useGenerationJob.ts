import type { RealtimeChannel } from '@supabase/supabase-js'
import type { GenerationJob, JobStatus } from '#shared/types/jobs'
import { Constants } from '#shared/types/database'

const POLL_INTERVAL_MS = 4000
const JOB_STATUSES: ReadonlyArray<string> = Constants.public.Enums.job_status

/**
 * Acompanha um job até ele terminar (ADR-0005): Realtime no registro do job e, de reserva,
 * consulta periódica ao servidor. A reserva cobre o Realtime fora do ar, o job que terminou antes
 * da assinatura e o job pedido por outro membro, que o RLS não deixa assinar.
 */
export function useGenerationJob(job: Ref<GenerationJob | null>) {
  const supabase = useSupabaseClient()
  const status = ref<JobStatus | null>(null)
  let channel: RealtimeChannel | null = null
  let timer: ReturnType<typeof setInterval> | null = null

  function stop() {
    if (channel) {
      void supabase.removeChannel(channel)
      channel = null
    }

    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function update(next: JobStatus) {
    status.value = next

    if (next === 'succeeded' || next === 'failed') {
      stop()
    }
  }

  async function poll(jobId: string) {
    const current = await $fetch<GenerationJob>(`/api/jobs/${jobId}`).catch(() => null)

    if (current && current.id === job.value?.id) {
      update(current.status)
    }
  }

  function follow(jobId: string) {
    channel = supabase
      .channel(`generation-job:${jobId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'generation_jobs', filter: `id=eq.${jobId}` }, (payload) => {
        const next: unknown = payload.new.status

        if (isJobStatus(next)) {
          update(next)
        }
      })
      .subscribe((state) => {
        // O job pode ter terminado antes da assinatura: confere uma vez assim que ela começa.
        if (state === 'SUBSCRIBED') {
          void poll(jobId)
        }
      })
    timer = setInterval(() => void poll(jobId), POLL_INTERVAL_MS)
  }

  watch(job, (current) => {
    stop()
    status.value = current?.status ?? null

    if (current?.status === 'pending' || current?.status === 'running') {
      follow(current.id)
    }
  })

  onScopeDispose(stop)

  return { status: readonly(status) }
}

/** O Realtime entrega a linha sem tipo. A checagem é contra o enum, sem levar o Zod para o navegador. */
function isJobStatus(value: unknown): value is JobStatus {
  return typeof value === 'string' && JOB_STATUSES.includes(value)
}
