<script setup lang="ts">
useHead({ title: 'Acesso restrito · vobs-car' })

const { signOut } = useMember()
</script>

<template>
  <main class="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-12">
    <div class="flex flex-col gap-3">
      <p class="type-label">
        Acesso restrito
      </p>
      <h1 class="type-heading">
        Seu e-mail não está na lista de convidados
      </h1>
      <p class="type-body text-ink-muted">
        O vobs-car está aberto só para convidados por enquanto. Se você recebeu um convite, entre com o e-mail que foi cadastrado.
      </p>
    </div>

    <BaseButton
      variant="secondary"
      class="self-start"
      @click="signOut"
    >
      Entrar com outra conta
    </BaseButton>
  </main>
</template>
