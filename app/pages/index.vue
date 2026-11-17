<script setup lang="ts">
const { member, signOut } = useMember()
</script>

<template>
  <main class="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-4 px-4 py-12">
    <p class="type-label flex items-center gap-2">
      <Icon
        name="tabler:engine"
        class="size-5"
        aria-hidden="true"
      />
      Raio-X técnico de carros e motos
    </p>

    <h1 class="type-display">
      vobs-car
    </h1>

    <p
      v-if="member"
      class="type-body"
    >
      Olá, {{ member.displayName }}.
    </p>

    <p class="type-body max-w-prose text-ink-muted">
      Ficha técnica, fluidos, problemas crônicos, manutenção preventiva e custo de propriedade num só lugar.
    </p>

    <div class="flex flex-wrap items-center gap-3">
      <span class="type-control inline-block rounded-sm bg-signal px-3 py-2 text-on-signal">
        Em construção
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
  </main>
</template>
