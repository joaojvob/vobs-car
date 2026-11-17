<script setup lang="ts">
useHead({ title: 'Entrar · vobs-car' })

const supabase = useSupabaseClient()
const requestUrl = useRequestURL()

const loading = ref(false)
const errorMessage = ref<string | null>(null)

async function signInWithGoogle() {
  loading.value = true
  errorMessage.value = null

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${requestUrl.origin}/confirm` },
  })

  if (error) {
    errorMessage.value = 'Não foi possível abrir o login do Google. Tente de novo.'
    loading.value = false
  }
}
</script>

<template>
  <main class="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-4 py-12">
    <div class="flex flex-col gap-3">
      <p class="type-label">
        Acesso por convite
      </p>
      <h1 class="type-display">
        vobs-car
      </h1>
      <p class="type-body text-ink-muted">
        Entre com a conta Google que está na lista de convidados.
      </p>
    </div>

    <div class="flex flex-col gap-3">
      <BaseButton
        :loading="loading"
        @click="signInWithGoogle"
      >
        <Icon
          name="tabler:brand-google"
          class="size-5"
          aria-hidden="true"
        />
        {{ loading ? 'Abrindo o Google…' : 'Entrar com Google' }}
      </BaseButton>

      <p
        v-if="errorMessage"
        role="alert"
        class="type-body-sm text-severity-high"
      >
        {{ errorMessage }}
      </p>
    </div>
  </main>
</template>
