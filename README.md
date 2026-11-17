# vobs-car

Raio-X técnico de carros e motos: ficha técnica, fluidos, problemas crônicos, manutenção preventiva e custo de propriedade, organizados por modelo, motor e ano.

No ar em [vobs-car.vercel.app](https://vobs-car.vercel.app), com acesso por convite. A fundação (Fase 0) está pronta, com login, banco e deploy funcionando. A próxima etapa é a Fase 1, com o catálogo e a ficha técnica.

<!-- TODO: adicionar screenshots/GIF do Raio-X quando a Fase 2 estiver pronta -->

## Por que eu fiz isso

Quando comecei a procurar um carro para comprar, toda vez que um modelo me interessava eu repetia a mesma pesquisa: quanto óleo vai no motor, que defeito ele costuma dar, quanto custa para manter por ano. As respostas ficavam espalhadas em fóruns, vídeos e manuais, e as mais organizadas estavam em sites pagos.

Resolvi juntar tudo num lugar só, com a fonte de cada informação à vista, para mim e para os amigos que também estão procurando carro ou moto.

Também é o projeto que uso para estudar Nuxt e Supabase a fundo, com o cuidado de um projeto profissional: decisões registradas, ambientes separados, deploy contínuo e documentação.

## O que ele faz

| Funcionalidade | Descrição | Fase |
|---|---|---|
| Catálogo | Carros e motos pelo catálogo FIPE: marca, modelo e ano | 1 |
| Ficha técnica e fluidos | Óleo (norma, viscosidade e volume), arrefecimento, freio, câmbio, velas, bateria e calibragem dos pneus | 1 |
| Problemas crônicos | Defeitos recorrentes com gravidade, faixa de km, sintomas e prevenção | 1 |
| Raio-X | Diagrama por sistema (motor, arrefecimento, transmissão, suspensão, freios, elétrica), colorido pela gravidade dos problemas | 2 |
| Manutenção preventiva | Plano por km ou por tempo, com intervalos para uso normal e severo | 2 |
| Custo de propriedade | Estimativa mensal, anual e por km: depreciação, IPVA, licenciamento, combustível, manutenção e pneus | 2 |
| Minha Garagem | Meus veículos, histórico, km estimada e alertas de manutenção | 3 |
| Pré-compra | Checklist de vistoria focado nos pontos fracos do modelo e comparador de custos | 4 |

## Como funciona

O que está no ar hoje é a fundação. O desenho abaixo guia as próximas fases.

```mermaid
flowchart LR
  user([Usuário]) --> app[Nuxt 4<br/>SSR + API<br/>Vercel]
  app -->|Auth · Postgres · Realtime| supa[(Supabase)]
  app -->|catálogo e preços| fipe[Parallelum FIPE API]
  app -->|pesquisa com fontes<br/>+ saída estruturada| ai[Gemini API]
  cron[Vercel Cron] -->|alertas · preços| app
```

O conteúdo técnico não fica preso à versão da FIPE, e sim a um perfil técnico: motor, câmbio e geração. Versões diferentes com o mesmo conjunto mecânico compartilham a mesma ficha, o que mantém os dados consistentes e reduz o custo de geração.

A ficha e os problemas crônicos são gerados pelo Gemini em duas etapas: primeiro uma pesquisa na web que guarda as fontes, depois a estruturação num formato fixo, validado com Zod. Cada valor mostra de onde veio e qual o nível de confiança. Nada é sobrescrito: uma correção vira uma versão nova.

A geração roda em segundo plano, com uma trava que impede dois pedidos iguais ao mesmo tempo, e o andamento aparece na tela em tempo real.

O custo de propriedade é cálculo, não IA: regras de IPVA de cada estado, histórico de preços da FIPE e preço de combustível da ANP.

Os detalhes estão na [arquitetura](docs/ARCHITECTURE.md), no [modelo de dados](docs/DATABASE.md), no [design system](docs/DESIGN.md) e no [guia de configuração dos ambientes](docs/SETUP.md). As decisões estão registradas como ADRs:

| ADR | Decisão |
|---|---|
| [0001](docs/adr/0001-stack.md) | Stack: Nuxt 4, Supabase e Vercel |
| [0002](docs/adr/0002-perfil-tecnico.md) | Perfil técnico como unidade de dados e cache |
| [0003](docs/adr/0003-conteudo-versionado.md) | Conteúdo gerado por IA versionado e imutável |
| [0004](docs/adr/0004-pipeline-ia.md) | Pipeline de IA em etapas, com fontes |
| [0005](docs/adr/0005-geracao-assincrona.md) | Geração assíncrona com jobs e trava |
| [0006](docs/adr/0006-acesso-restrito.md) | Acesso restrito por convite |
| [0007](docs/adr/0007-custo-de-propriedade.md) | Custo de propriedade por cálculo determinístico |
| [0008](docs/adr/0008-modelagem-veiculos.md) | Modelagem por tipo de veículo e motorização |
| [0010](docs/adr/0010-base-de-ui.md) | Base de UI: Reka UI e Tailwind CSS v4 com tokens próprios |
| [0011](docs/adr/0011-ambientes-na-nuvem.md) | Ambientes: Supabase só na nuvem, sem Docker |

## Stack

| Camada | Tecnologias |
|---|---|
| Front-end | Nuxt 4, Vue 3 (Composition API), TypeScript, Tailwind CSS v4, Reka UI |
| Back-end | Nitro (funções serverless na Vercel), Zod |
| Dados e login | Supabase: Postgres com RLS, Auth com Google, Realtime |
| Integrações | Parallelum FIPE API, Google Gemini API |

## Estrutura do repositório

```text
app/        Front-end: páginas, componentes, composables e SVGs do Raio-X
server/     Back-end: rotas (borda), services (regras) e repositories (dados)
shared/     Schemas, tipos e funções puras usados no front e no back
supabase/   Migrations SQL com políticas RLS
docs/       Arquitetura, modelo de dados, design system, configuração e ADRs
```

## Roadmap

- [x] Escopo, arquitetura, ADRs e modelo de dados
- [x] Fase 0: projeto Nuxt 4, Supabase na nuvem, login por convite, migrations com RLS e deploy na Vercel
- [ ] Fase 1: catálogo, ficha técnica e problemas crônicos
- [ ] Fase 2: Raio-X, manutenção preventiva e custo de propriedade
- [ ] Fase 3: Minha Garagem e alertas
- [ ] Fase 4: pré-compra, comparador e comunidade
- [ ] Testes automatizados (Vitest, @nuxt/test-utils e Playwright)

## Rodando localmente

Precisa de Node.js 24 (versão em `.nvmrc`), pnpm e um projeto no Supabase. O passo a passo completo, com Supabase, login Google, Vercel e convites, está em [docs/SETUP.md](docs/SETUP.md).

```bash
pnpm install
cp .env.example .env   # preencha com as chaves do projeto Supabase
pnpm dev               # http://localhost:3100

pnpm lint              # ESLint
pnpm typecheck         # vue-tsc
```

O login é com Google, e só entra quem está na lista de convidados ([ADR-0006](docs/adr/0006-acesso-restrito.md)). O banco roda só na nuvem ([ADR-0011](docs/adr/0011-ambientes-na-nuvem.md)); para aplicar as migrations:

```bash
pnpm exec supabase login
pnpm exec supabase link --project-ref <id-do-projeto>
pnpm exec supabase db push --remote   # aplica supabase/migrations
pnpm db:types                         # gera shared/types/database.ts
```

## Aviso

Os dados técnicos são gerados com ajuda de IA a partir de fontes públicas e podem ter erros. Antes de qualquer manutenção, confira o manual do proprietário.

## Licença

[MIT](LICENSE) © 2026 JJVOB

<!-- TODO: link do portfólio / LinkedIn -->
