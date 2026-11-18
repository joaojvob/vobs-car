import type { CatalogModelYear, CatalogOption, CatalogVehicle, VehicleType } from '#shared/types/catalog'

/**
 * Escolha marca → modelo → ano de um tipo de veículo. Trocar a marca limpa o modelo,
 * e trocar o modelo limpa o ano. As marcas vêm no SSR; o resto, conforme a escolha.
 */
export function useCatalogPicker(vehicleType: VehicleType) {
  const requestFetch = useRequestFetch()

  const brandId = ref<number | null>(null)
  const modelId = ref<number | null>(null)
  const modelYearId = ref<number | null>(null)

  watch(brandId, () => {
    modelId.value = null
  })
  watch(modelId, () => {
    modelYearId.value = null
  })

  const brands = useFetch<CatalogOption[]>('/api/catalog/brands', {
    key: `catalog-brands-${vehicleType}`,
    query: { type: vehicleType },
    default: () => [],
  })

  const models = useAsyncData(
    () => `catalog-models-${brandId.value}`,
    () => brandId.value === null
      ? Promise.resolve([])
      : requestFetch<CatalogOption[]>(`/api/catalog/brands/${brandId.value}/models`),
    { default: () => [] },
  )

  const modelYears = useAsyncData(
    () => `catalog-years-${modelId.value}`,
    () => modelId.value === null
      ? Promise.resolve([])
      : requestFetch<CatalogModelYear[]>(`/api/catalog/models/${modelId.value}/years`),
    { default: () => [] },
  )

  const vehicle = useAsyncData(
    () => `catalog-vehicle-${modelYearId.value}`,
    () => modelYearId.value === null
      ? Promise.resolve(null)
      : requestFetch<CatalogVehicle>(`/api/catalog/model-years/${modelYearId.value}`),
    { default: () => null },
  )

  const hasError = computed(() => [brands, models, modelYears, vehicle].some(request => request.error.value))

  /** Repete só as consultas que falharam. */
  async function retry() {
    const failed = [brands, models, modelYears, vehicle].filter(request => request.error.value)

    await Promise.all(failed.map(request => request.refresh()))
  }

  return { brandId, modelId, modelYearId, brands, models, modelYears, vehicle, hasError, retry }
}
