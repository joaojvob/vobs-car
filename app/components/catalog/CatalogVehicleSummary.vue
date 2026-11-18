<script setup lang="ts">
import type { CatalogVehicle } from '#shared/types/catalog'

const { vehicle } = defineProps<{
  vehicle: CatalogVehicle
}>()

const headingId = useId()

// A página mostra a mecânica considerada para o usuário notar um mapeamento errado (ADR-0002).
const profileRows = computed(() => {
  const { profile } = vehicle

  if (profile.status !== 'mapped') {
    return [{ label: 'Motor e câmbio', value: profile.status === 'failed' ? 'Não foi possível identificar' : 'Ainda não identificados' }]
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

    <p class="type-caption text-ink-muted">
      {{ vehicle.price
        ? 'Preço médio de mercado segundo a tabela FIPE.'
        : 'A tabela FIPE não respondeu agora. O valor aparece na próxima consulta.' }}
    </p>
  </BasePanel>
</template>
