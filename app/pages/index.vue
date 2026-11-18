<script setup lang="ts">
import type { VehicleType } from '#shared/types/catalog'

useHead({ title: 'Catálogo · vobs-car' })

const { member, signOut } = useMember()

const vehicleType = ref<VehicleType>('car')

const vehicleTabs: Array<{ value: VehicleType, label: string, icon: string }> = [
  { value: 'car', label: 'Carros', icon: 'tabler:car' },
  { value: 'motorcycle', label: 'Motos', icon: 'tabler:motorbike' },
]
</script>

<template>
  <div class="mx-auto flex min-h-dvh max-w-5xl flex-col gap-8 px-4 py-6 sm:py-10">
    <header class="flex items-center justify-between gap-4 border-b-2 border-ink pb-4">
      <p class="type-heading flex items-center gap-2">
        <Icon
          name="tabler:engine"
          class="size-6"
          aria-hidden="true"
        />
        vobs-car
      </p>

      <div class="flex items-center gap-3">
        <span
          v-if="member"
          class="type-body-sm hidden text-ink-muted sm:inline"
        >
          {{ member.displayName }}
        </span>
        <BaseButton
          variant="ghost"
          @click="signOut"
        >
          <Icon
            name="tabler:logout"
            class="size-5"
            aria-hidden="true"
          />
          Sair
        </BaseButton>
      </div>
    </header>

    <main class="flex flex-col gap-8">
      <div class="flex flex-col gap-3">
        <p class="type-label">
          Catálogo FIPE
        </p>
        <h1 class="type-display">
          Escolha o veículo
        </h1>
        <p class="type-body max-w-prose text-ink-muted">
          Marca, modelo e ano como aparecem na tabela FIPE, para carros e motos.
        </p>
      </div>

      <BaseTabs
        v-model="vehicleType"
        label="Tipo de veículo"
        :items="vehicleTabs"
      >
        <template #car>
          <CatalogPicker vehicle-type="car" />
        </template>
        <template #motorcycle>
          <CatalogPicker vehicle-type="motorcycle" />
        </template>
      </BaseTabs>
    </main>
  </div>
</template>
