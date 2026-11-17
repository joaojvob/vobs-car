<script setup lang="ts">
useHead({ title: 'Entrando · vobs-car' })

const supabase = useSupabaseClient()
const route = useRoute()
const { claim } = useMember()

// O Google devolve `?error=` quando o login é cancelado ou negado.
const failed = ref(typeof route.query.error === 'string')

onMounted(async () => {
  if (failed.value) {
    return
  }

  try {
    // Aguarda a troca do código OAuth pela sessão, feita pelo cliente do Supabase ao carregar a página.
    const { data } = await supabase.auth.getSession()

    if (!data.session) {
      failed.value = true
      return
    }

    const member = await claim()
    await navigateTo(member ? '/' : '/access-denied', { replace: true })
  }
  catch {
    failed.value = true
  }
})
</script>

<template>
  <main class="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4 py-12">
    <template v-if="failed">
      <h1 class="type-heading">
        Não foi possível concluir o login
      </h1>
      <p class="type-body text-ink-muted">
        O link pode ter expirado ou o acesso foi cancelado no Google.
      </p>
      <NuxtLink
        to="/login"
        class="type-control self-start underline underline-offset-4"
      >
        Tentar de novo
      </NuxtLink>
    </template>

    <p
      v-else
      role="status"
      class="type-body text-ink-muted"
    >
      Entrando…
    </p>
  </main>
</template>
