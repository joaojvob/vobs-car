# ADR-0009 — Ambientes: Supabase local via Docker, app sem container

- **Status:** Substituído pelo [ADR-0011](0011-ambientes-na-nuvem.md)
- **Data:** 2026-11-16

## Contexto

A Vercel compila a aplicação a partir do código-fonte (preset `vercel` do Nitro) e não executa containers; um Dockerfile seria ignorado no deploy. Ao mesmo tempo, migrations e políticas RLS precisam ser testadas num banco descartável antes de chegar aos projetos Supabase na nuvem.

## Decisão

- Três ambientes:

  | Ambiente | Aplicação | Banco |
  |---|---|---|
  | Local | `nuxt dev` | Supabase local via Docker (`supabase start`) |
  | Preview | Vercel Preview (um por PR) | Supabase `dev` |
  | Produção | Vercel (branch `master`) | Supabase `prod` |

- Migrations seguem sempre a ordem **local → dev → prod**.
- A aplicação **não é containerizada**: o deploy usa a integração Git da Vercel.
- Variáveis de ambiente são configuradas por ambiente na Vercel; `.env.example` documenta as chaves, sem valores.

## Consequências

- Docker é pré-requisito de **desenvolvimento**, não de deploy.
- O Supabase local oferece Postgres, Auth, Realtime e Studio com paridade com a nuvem, num banco que pode ser recriado a qualquer momento.
- Não há Dockerfile para manter.
- **Gatilho de revisão:** se a geração por IA ultrapassar o limite de duração das funções e a alternativa com Edge Function ([ADR-0005](0005-geracao-assincrona.md)) não resolver, ou se for necessário sair da Vercel, a aplicação passa a rodar em container com o preset `node-server` e um worker em segundo plano, registrado em novo ADR.

## Alternativas consideradas

- **Dockerfile e docker-compose para a aplicação:** sem uso no deploy, viraria manutenção sem retorno.
- **Hospedagem em container (Cloud Run, Fly.io, Railway):** portabilidade e processos longos, mas sem previews automáticos por PR e com mais operação.
- **Desenvolver apenas contra o Supabase `dev` na nuvem:** sem banco descartável; um erro de migration atingiria um ambiente compartilhado.
