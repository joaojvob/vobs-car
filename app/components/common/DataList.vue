<script setup lang="ts">
defineProps<{
  items: Array<{ label: string, value: string }>
}>()
</script>

<template>
  <dl class="divide-y divide-line">
    <div
      v-for="item in items"
      :key="item.label"
      class="flex items-baseline justify-between gap-4 py-3"
    >
      <dt class="type-label">
        {{ item.label }}
      </dt>
      <dd class="type-value text-right">
        {{ item.value }}
      </dd>
    </div>
  </dl>
</template>
