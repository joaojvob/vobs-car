<script setup lang="ts">
import type { CatalogVehicle } from '#shared/types/catalog'
import type { MappingState } from '~/composables/useProfileMapping'

const { vehicle, mappingState, mappingError } = defineProps<{
  vehicle: CatalogVehicle
  mappingState: MappingState
  mappingError: string | null
}>()

const emit = defineEmits<{
  retryMapping: []
}>()

const headingId = useId()

const mappingFailed = computed(() => vehicle.profile.status !== 'mapped'
  && mappingState !== 'running'
  && (mappingState === 'failed' || vehicle.profile.status === 'failed'))

// A página mostra a mecânica considerada para o usuário notar um mapeamento errado (ADR-0002).
const profileRows = computed(() => {
  const { profile } = vehicle

  if (profile.status !== 'mapped') {
    return [{ label: 'Motor e câmbio', value: describeMapping() }]
  }

  return [
    { label: 'Geração', value: formatGeneration(profile.techProfile) },
    { label: 'Motor', value: formatEngine(profile.techProfile) },
    { label: 'Câmbio', value: formatTransmission(profile.techProfile) },
  ]
})

const rows = computed(() => [
  { label: 'Ano-modelo', value: formatModelYear(vehicle.modelYear) },
  { label: 'Combustível', value: FUEL_LABELS[vehicle.fuel] },
  ...profileRows.value,
  { label: 'Código FIPE', value: vehicle.fipeCode ?? 'Indisponível' },
  { label: 'Valor FIPE', value: vehicle.price ? formatCurrency(vehicle.price.cents) : 'Indisponível' },
  { label: 'Referência', value: vehicle.price ? formatReferenceMonth(vehicle.price.referenceMonth) : 'Indisponível' },
])

function describeMapping(): string {
  if (mappingState === 'running') {
    return 'Identificando…'
  }

  return mappingFailed.value ? 'Não foi possível identificar' : 'Ainda não identificados'
}
</script>

<template>
  <BasePanel
    class="flex flex-col gap-4"
    :aria-labelledby="headingId"
  >
    <div class="flex flex-col gap-1">
      <p class="type-label">
        {{ vehicle.brand.name }}
      </p>
      <h2
        :id="headingId"
        class="type-heading"
      >
        {{ vehicle.model.name }}
      </h2>
    </div>

    <DataList :items="rows" />

    <p
      v-if="mappingState === 'running'"
      role="status"
      class="type-body-sm flex items-center gap-2 text-ink-muted"
    >
      <Icon
        name="tabler:loader-2"
        class="size-5 animate-spin"
        aria-hidden="true"
      />
      Identificando o motor e o câmbio desta versão…
    </p>
    <div
      v-else-if="mappingFailed"
      class="flex flex-col items-start gap-3"
    >
      <p
        role="alert"
        class="type-body-sm text-severity-high"
      >
        {{ mappingError ?? 'Não foi possível identificar o motor e o câmbio desta versão.' }}
      </p>
      <BaseButton
        variant="secondary"
        @click="emit('retryMapping')"
      >
        <Icon
          name="tabler:refresh"
          class="size-5"
          aria-hidden="true"
        />
        Tentar de novo
      </BaseButton>
    </div>

    <p class="type-caption text-ink-muted">
      {{ vehicle.price
        ? 'Preço médio de mercado segundo a tabela FIPE.'
        : 'A tabela FIPE não respondeu agora. O valor aparece na próxima consulta.' }}
    </p>
  </BasePanel>
</template>
