<script setup lang="ts">
const { as = 'section' } = defineProps<{
  as?: string
}>()
</script>

<template>
  <component
    :is="as"
    class="rounded-sm border border-line bg-surface p-4 sm:p-6"
  >
    <slot />
  </component>
</template>
