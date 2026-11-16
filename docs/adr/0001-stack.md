# ADR-0001 — Stack: Nuxt 4, Supabase e Vercel

- **Status:** Aceito
- **Data:** 2026-11-16

## Contexto

Projeto pessoal, com custo de infraestrutura próximo de zero, que precisa de SSR, um back-end leve (proxy de APIs externas e orquestração de IA), banco relacional, autenticação e atualizações em tempo real. Também é um projeto de estudo de Vue/Nuxt com padrão profissional.

## Decisão

- **Nuxt 4** (Vue 3, Composition API, TypeScript estrito) como full-stack: páginas em `app/`, rotas Nitro em `server/`, código compartilhado em `shared/`.
- **Pinia** para estado global; composables para lógica reutilizável.
- **Supabase** (Postgres, Auth com Google, Realtime), integrado via `@nuxtjs/supabase`.
- **Zod** para validação na borda e contratos compartilhados entre front, back e IA.
- **Vercel** (plano Hobby) para hospedagem e cron.
- **pnpm** como gerenciador de pacotes.
- Dois projetos Supabase: `dev` e `prod`.

## Consequências

- Uma única linguagem (TypeScript) do banco à UI, com tipos do Supabase gerados e reaproveitados.
- Os limites dos planos gratuitos viram requisitos de arquitetura: duração de funções serverless ([ADR-0005](0005-geracao-assincrona.md)), pausa de projetos Supabase inativos e cron com frequência limitada.
- A estrutura `app/` + `shared/` é a padrão do Nuxt 4, o que reduz configuração.

## Alternativas consideradas

- **Nuxt 3:** a estrutura planejada já é a do Nuxt 4; começar no 3 significaria migrar logo em seguida.
- **Back-end separado (NestJS, Laravel):** mais infraestrutura e custo para um back-end que é majoritariamente orquestração.
- **Firebase:** banco não relacional dificulta o modelo (catálogo, perfis, versões, garagem) e as políticas de acesso em SQL.
