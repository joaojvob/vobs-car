# ADR-0011 — Ambientes: Supabase só na nuvem, sem Docker

- **Status:** Aceito
- **Data:** 2026-11-17
- **Substitui:** [ADR-0009](0009-ambientes.md)

## Contexto

O [ADR-0009](0009-ambientes.md) previa um Supabase local via Docker para testar migrations num banco descartável antes de chegar à nuvem. A máquina de desenvolvimento, porém, é compartilhada com outros projetos que rodam em Docker e tem pouca memória livre, e a stack local do Supabase sobe cerca de dez containers que disputariam recursos com eles.

O projeto tem um único desenvolvedor. O projeto Supabase `dev` não é compartilhado com ninguém e pode ser recriado sem prejuízo.

## Decisão

- Dois projetos Supabase na nuvem, ambos na região de São Paulo:

  | Ambiente | Aplicação | Banco |
  |---|---|---|
  | Desenvolvimento | `nuxt dev` | Supabase `dev` |
  | Preview | Vercel Preview (um por PR) | Supabase `dev` |
  | Produção | Vercel (branch `master`) | Supabase `prod` |

- Migrations seguem a ordem **dev → prod**, aplicadas com `supabase db push` no projeto vinculado.
- O Supabase CLI é dependência de desenvolvimento e roda sem Docker: cria migrations, aplica e gera os tipos TypeScript.
- A aplicação continua sem container: o deploy usa a integração Git da Vercel.
- Variáveis de ambiente são configuradas por ambiente na Vercel; `.env.example` documenta as chaves, sem valores.

## Consequências

- O projeto não cria containers, redes nem volumes Docker.
- Não há banco descartável: uma migration com erro atinge o `dev`, que pode ser recriado a partir das migrations versionadas.
- `supabase db diff` depende de Docker e fica indisponível; as migrations são escritas à mão.
- Desenvolver exige conexão com a internet.
- O plano gratuito comporta dois projetos ativos, ocupados por `dev` e `prod`, e pausa projetos sem acesso ao banco por sete dias. No `prod`, o cron diário de alertas mantém o banco ativo.
- **Gatilhos de revisão:**
  - Se migrations com erro passarem a atrapalhar o desenvolvimento no `dev`, o Supabase local volta a ser opção, registrado em novo ADR.
  - Se a geração por IA ultrapassar o limite de duração das funções e a alternativa com Edge Function ([ADR-0005](0005-geracao-assincrona.md)) não resolver, ou se for necessário sair da Vercel, a aplicação passa a rodar em container com o preset `node-server` e um worker em segundo plano, registrado em novo ADR.

## Alternativas consideradas

- **Supabase local via Docker ([ADR-0009](0009-ambientes.md)):** banco descartável e trabalho offline, mas disputa memória com os outros projetos da máquina.
- **Um terceiro projeto na nuvem só para desenvolvimento:** separaria o desenvolvimento dos previews, mas excede os dois projetos ativos do plano gratuito.
