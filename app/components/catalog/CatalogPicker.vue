<script setup lang="ts">
import type { CatalogOption, VehicleType } from '#shared/types/catalog'

const { vehicleType } = defineProps<{
  vehicleType: VehicleType
}>()

const { brandId, modelId, modelYearId, brands, models, modelYears, vehicle, hasError, retry } = useCatalogPicker(vehicleType)

const { data: vehicleData, status: vehicleStatus, error: vehicleError, refresh: refreshVehicle } = vehicle

const { state: mappingState, error: mappingError, retry: retryMapping } = useProfileMapping(vehicleData, () => refreshVehicle())

const brandField = computed(() => ({
  options: brands.data.value.map(toOption),
  loading: brands.status.value === 'pending',
  error: brands.error.value ? describeFetchError(brands.error.value) : null,
}))

const modelField = computed(() => ({
  options: models.data.value.map(toOption),
  loading: models.status.value === 'pending',
  error: models.error.value ? describeFetchError(models.error.value) : null,
}))

const yearField = computed(() => ({
  options: modelYears.data.value.map(year => ({
    value: year.id,
    label: `${formatModelYear(year.modelYear)} · ${FUEL_LABELS[year.fuel]}`,
  })),
  loading: modelYears.status.value === 'pending',
  error: modelYears.error.value ? describeFetchError(modelYears.error.value) : null,
}))

function toOption(item: CatalogOption) {
  return { value: item.id, label: item.name }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="grid gap-4 md:grid-cols-[1fr_2fr_1fr]">
      <BaseCombobox
        v-model="brandId"
        label="Marca"
        placeholder="Buscar marca"
        empty-text="Nenhuma marca encontrada."
        v-bind="brandField"
      />
      <BaseCombobox
        v-model="modelId"
        label="Modelo"
        :placeholder="brandId === null ? 'Escolha a marca' : 'Buscar modelo'"
        empty-text="Nenhum modelo encontrado."
        :disabled="brandId === null"
        v-bind="modelField"
      />
      <BaseCombobox
        v-model="modelYearId"
        label="Ano"
        :placeholder="modelId === null ? 'Escolha o modelo' : 'Buscar ano'"
        empty-text="Nenhum ano encontrado."
        :disabled="modelId === null"
        v-bind="yearField"
      />
    </div>

    <div v-if="hasError">
      <BaseButton
        variant="secondary"
        @click="retry"
      >
        <Icon
          name="tabler:refresh"
          class="size-5"
          aria-hidden="true"
        />
        Tentar de novo
      </BaseButton>
    </div>

    <CatalogVehicleSummary
      v-if="vehicleData"
      :vehicle="vehicleData"
      :mapping-state="mappingState"
      :mapping-error="mappingError"
      @retry-mapping="retryMapping"
    />
    <p
      v-else-if="vehicleStatus === 'pending'"
      class="type-body-sm flex items-center gap-2 text-ink-muted"
    >
      <Icon
        name="tabler:loader-2"
        class="size-5 animate-spin"
        aria-hidden="true"
      />
      Consultando a tabela FIPE…
    </p>
    <p
      v-else-if="vehicleError"
      role="alert"
      class="type-body-sm text-severity-high"
    >
      {{ describeFetchError(vehicleError) }}
    </p>
    <p
      v-else
      class="type-body-sm text-ink-muted"
    >
      Escolha marca, modelo e ano para ver a versão.
    </p>
  </div>
</template>
