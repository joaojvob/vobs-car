<script setup lang="ts">
type ButtonVariant = 'primary' | 'signal' | 'secondary' | 'ghost'

const { variant = 'primary', type = 'button', loading = false } = defineProps<{
  variant?: ButtonVariant
  type?: 'button' | 'submit' | 'reset'
  loading?: boolean
}>()

// docs/DESIGN.md → Componentes base. `signal` é a ação principal da tela: no máximo um por página.
const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-surface hover:bg-ink/85',
  signal: 'bg-signal text-on-signal hover:bg-signal/85',
  secondary: 'border border-line-strong text-ink hover:bg-surface',
  ghost: 'text-ink hover:bg-line/50',
}
</script>

<template>
  <button
    :type="type"
    :disabled="loading"
    :aria-busy="loading"
    class="type-control inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-5 transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-60"
    :class="variantClasses[variant]"
  >
    <slot />
  </button>
</template>
