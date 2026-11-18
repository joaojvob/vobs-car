import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/fonts', '@nuxt/icon', '@nuxtjs/color-mode', '@nuxtjs/supabase'],

  // Componentes base usam o nome do DESIGN.md (BaseButton), sem o prefixo da pasta.
  // Pastas específicas vêm antes da genérica, porque são lidas em ordem.
  components: [
    { path: '~/components/common', pathPrefix: false },
    '~/components',
  ],

  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: { lang: 'pt-BR' },
      title: 'vobs-car',
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },

  css: ['~/assets/css/main.css'],

  colorMode: {
    classSuffix: '',
    fallback: 'light',
  },

  // Só no servidor. Sobrescrito em tempo de execução pelas variáveis NUXT_* (.env.example).
  runtimeConfig: {
    fipeApiToken: '',
    gemini: {
      apiKey: '',
      // Modelo de cada etapa da IA (ADR-0004). Trocar de modelo não exige mudar o código.
      models: {
        mapping: 'gemini-3.5-flash-lite',
      },
    },
    // Jobs de IA que cada usuário pode criar em 24 horas (ADR-0005). Protege a cota gratuita.
    generationDailyLimit: 20,
  },

  devServer: { port: 3100 },

  compatibilityDate: '2026-11-17',

  // Tasks rodam etapas da IA à mão. A rota que as executa só existe no servidor de desenvolvimento.
  nitro: {
    experimental: { tasks: true },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  typescript: {
    strict: true,
    // Componente não resolvido no template vira erro no typecheck, não só aviso em runtime.
    tsConfig: { vueCompilerOptions: { checkUnknownComponents: true } },
  },

  eslint: {
    config: { stylistic: true },
  },

  // Fontes baixadas no build e servidas pelo próprio app, sem requisição ao Google em runtime.
  fonts: {
    defaults: { styles: ['normal'], subsets: ['latin'] },
    families: [
      { name: 'Barlow', provider: 'google', weights: [400, 500, 600], global: true },
      { name: 'Barlow Condensed', provider: 'google', weights: [500, 600, 700], global: true },
    ],
  },

  // Só o Tabler, embutido no bundle: um ícone de outro conjunto falha em vez de ser buscado na API do Iconify.
  icon: {
    serverBundle: { collections: ['tabler'] },
    clientBundle: { scan: true },
    fallbackToApi: false,
  },

  // O redirecionamento fica no middleware global, que também confere se o usuário é membro (ADR-0006).
  supabase: {
    redirect: false,
    types: '~~/shared/types/database.ts',
  },
})
