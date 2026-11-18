<script setup lang="ts">
import {
  ComboboxAnchor,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxPortal,
  ComboboxRoot,
  ComboboxTrigger,
  ComboboxViewport,
} from 'reka-ui'

export interface ComboboxOption {
  value: number
  label: string
}

const {
  label,
  options,
  placeholder = 'Buscar',
  disabled = false,
  loading = false,
  error = null,
  emptyText = 'Nada encontrado.',
} = defineProps<{
  label: string
  options: ComboboxOption[]
  placeholder?: string
  disabled?: boolean
  loading?: boolean
  error?: string | null
  emptyText?: string
}>()

const model = defineModel<number | null>({ required: true })

const inputId = useId()
const errorId = useId()
const searchTerm = ref('')

// Busca por palavras em qualquer ordem, sem diferenciar acento e caixa:
// "amarok 4x4" encontra "AMAROK CD2.0 16V TDI 4x4 Die". O filtro do Reka UI exige o trecho contínuo.
const filteredOptions = computed(() => {
  const terms = normalize(searchTerm.value).split(/\s+/).filter(Boolean)

  if (terms.length === 0) {
    return options
  }

  return options.filter((option) => {
    const text = normalize(option.label)

    return terms.every(term => text.includes(term))
  })
})

function displayValue(value: number | null): string {
  return options.find(option => option.value === value)?.label ?? ''
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <label
      :for="inputId"
      class="type-label"
    >
      {{ label }}
    </label>

    <ComboboxRoot
      v-model="model"
      :disabled="disabled || loading"
      ignore-filter
      open-on-click
    >
      <ComboboxAnchor
        class="flex min-h-11 items-center rounded-sm border border-line-strong bg-surface focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink has-disabled:cursor-not-allowed has-disabled:opacity-60 dark:focus-within:outline-signal"
      >
        <ComboboxInput
          :id="inputId"
          v-model="searchTerm"
          :display-value="displayValue"
          :placeholder="loading ? 'Carregando…' : placeholder"
          :aria-invalid="error ? true : undefined"
          :aria-describedby="error ? errorId : undefined"
          class="type-body min-w-0 flex-1 bg-transparent px-3 py-2 text-ink placeholder:text-ink-muted focus-visible:outline-none disabled:cursor-not-allowed"
        />

        <Icon
          v-if="loading"
          name="tabler:loader-2"
          class="mx-3 size-5 animate-spin text-ink-muted"
          aria-hidden="true"
        />
        <ComboboxTrigger
          v-else
          class="flex min-h-11 min-w-11 items-center justify-center text-ink-muted"
          :aria-label="`Abrir a lista de ${label.toLowerCase()}`"
        >
          <Icon
            name="tabler:selector"
            class="size-5"
            aria-hidden="true"
          />
        </ComboboxTrigger>
      </ComboboxAnchor>

      <ComboboxPortal>
        <ComboboxContent
          position="popper"
          :side-offset="4"
          class="z-10 w-(--reka-combobox-trigger-width) rounded-sm border border-line bg-surface shadow-overlay"
        >
          <ComboboxViewport class="max-h-72 p-1">
            <ComboboxEmpty class="type-body-sm px-3 py-2 text-ink-muted">
              {{ emptyText }}
            </ComboboxEmpty>

            <ComboboxItem
              v-for="option in filteredOptions"
              :key="option.value"
              :value="option.value"
              :text-value="option.label"
              class="type-body flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-sm px-3 py-2 text-ink data-highlighted:bg-line/50 data-[state=checked]:font-medium"
            >
              {{ option.label }}
              <ComboboxItemIndicator>
                <Icon
                  name="tabler:check"
                  class="size-5"
                  aria-hidden="true"
                />
              </ComboboxItemIndicator>
            </ComboboxItem>
          </ComboboxViewport>
        </ComboboxContent>
      </ComboboxPortal>
    </ComboboxRoot>

    <p
      v-if="error"
      :id="errorId"
      role="alert"
      class="type-body-sm flex items-center gap-1 text-severity-high"
    >
      <Icon
        name="tabler:alert-triangle"
        class="size-4 shrink-0"
        aria-hidden="true"
      />
      {{ error }}
    </p>
  </div>
</template>
