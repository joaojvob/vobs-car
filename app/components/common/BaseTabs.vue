<script setup lang="ts" generic="T extends string">
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'

// Cada aba renderiza o slot com o nome do seu `value` (ex.: <template #car>).
const { items, label } = defineProps<{
  items: Array<{ value: T, label: string, icon?: string }>
  label: string
}>()

const model = defineModel<T>({ required: true })
</script>

<template>
  <TabsRoot
    v-model="model"
    class="flex flex-col gap-6"
  >
    <TabsList
      :aria-label="label"
      class="flex gap-1 border-b border-line"
    >
      <TabsTrigger
        v-for="item in items"
        :key="item.value"
        :value="item.value"
        class="type-control flex min-h-11 items-center gap-2 rounded-t-sm px-4 text-ink-muted transition-colors duration-150 ease-out hover:text-ink data-[state=active]:bg-signal data-[state=active]:text-on-signal"
      >
        <Icon
          v-if="item.icon"
          :name="item.icon"
          class="size-5"
          aria-hidden="true"
        />
        {{ item.label }}
      </TabsTrigger>
    </TabsList>

    <TabsContent
      v-for="item in items"
      :key="item.value"
      :value="item.value"
    >
      <slot :name="item.value" />
    </TabsContent>
  </TabsRoot>
</template>
