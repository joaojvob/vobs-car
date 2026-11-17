# Configuração dos ambientes

Passo a passo para montar os ambientes do vobs-car do zero: Supabase, login com Google, Vercel e o ambiente local. No fim estão o convite de novas pessoas, uma lista de verificação e os problemas mais comuns.

As decisões por trás desta configuração estão no [ADR-0006](adr/0006-acesso-restrito.md) (acesso por convite) e no [ADR-0011](adr/0011-ambientes-na-nuvem.md) (ambientes sem Docker).

## Sumário

1. [Visão geral](#1-visão-geral)
2. [Pré-requisitos](#2-pré-requisitos)
3. [Supabase](#3-supabase)
4. [Google (login OAuth)](#4-google-login-oauth)
5. [Banco: migrations e tipos](#5-banco-migrations-e-tipos)
6. [Ambiente local](#6-ambiente-local)
7. [Vercel](#7-vercel)
8. [Convidar pessoas](#8-convidar-pessoas)
9. [Lista de verificação](#9-lista-de-verificação)
10. [Problemas comuns](#10-problemas-comuns)
11. [Referência de variáveis](#11-referência-de-variáveis)

## 1. Visão geral

São três ambientes e dois bancos:

| Ambiente | Onde roda | Banco (Supabase) | Client OAuth do Google | Variáveis |
|---|---|---|---|---|
| Local | `pnpm dev`, em `http://localhost:3100` | `vobs-car-dev` | `vobs-car-dev` | arquivo `.env` |
| Preview | Vercel, um deploy por PR | `vobs-car-dev` | `vobs-car-dev` | Vercel, ambiente Preview |
| Produção | Vercel, branch `master`, em [vobs-car.vercel.app](https://vobs-car.vercel.app) | `vobs-car-prod` | `vobs-car-prod` | Vercel, ambiente Production |

Serviços usados:

| Serviço | Para quê | Plano |
|---|---|---|
| GitHub | Código e PRs | Gratuito |
| Supabase | Postgres, Auth e Realtime (dois projetos: `dev` e `prod`) | Free (até dois projetos ativos) |
| Google Cloud | Tela de consentimento e clients OAuth do login | Gratuito |
| Vercel | Hospedagem, previews por PR e produção | Hobby |

Ao longo do guia aparecem estes marcadores. Troque pelo valor do seu projeto:

| Marcador | O que é | Onde encontrar |
|---|---|---|
| `<ref-dev>` | Identificador do projeto Supabase `dev` | Na URL do painel (`supabase.com/dashboard/project/<ref>`) ou em **Project Settings → General → Project ID** |
| `<ref-prod>` | Identificador do projeto Supabase `prod` | Mesmo lugar, no projeto `prod` |
| `<url-prod>` | URL de produção na Vercel | Página do projeto na Vercel. Hoje é `https://vobs-car.vercel.app` |
| `<escopo-vercel>` | Nome da conta ou time na Vercel | Final das URLs de deploy: `vobs-<hash>-<escopo-vercel>.vercel.app` |

## 2. Pré-requisitos

### 2.1 Contas

- GitHub, com o repositório.
- Supabase ([supabase.com](https://supabase.com)).
- Google, com acesso ao [Google Cloud Console](https://console.cloud.google.com).
- Vercel ([vercel.com](https://vercel.com)), criada com **Continue with GitHub**.

### 2.2 Ferramentas na máquina

O projeto usa Node.js 24 (versão em `.nvmrc`) e pnpm. Docker **não** é necessário.

Instalação com o [fnm](https://github.com/Schniz/fnm), um gerenciador de versões do Node:

```bash
curl -fsSL https://fnm.vercel.app/install | bash
```

Feche o terminal e abra um novo. Depois:

```bash
fnm install 24
fnm default 24
corepack enable pnpm
node -v && pnpm -v
```

O instalador do fnm adiciona a configuração ao `~/.zshrc` (ou `~/.bashrc`). Terminais abertos antes da instalação não enxergam o `node` nem o `pnpm`.

## 3. Supabase

Os passos 3.1 a 3.4 valem para os dois projetos. As diferenças entre `dev` e `prod` estão indicadas em cada passo.

### 3.1 Criar o projeto

1. No [painel do Supabase](https://supabase.com/dashboard), clique em **New project**.
2. Preencha:

   | Campo | Valor |
   |---|---|
   | Organization | A sua organização, no plano Free |
   | GitHub (optional) | Vazio. As migrations são aplicadas pelo CLI (seção 5) |
   | Project name | `vobs-car-dev` ou `vobs-car-prod` |
   | Database password | Clique em **Generate a password**, depois em **Copy**, e guarde num gerenciador de senhas |
   | Region | **South America (São Paulo)**, `sa-east-1` |

   Se a lista de regiões mostrar só continentes (Americas, Europe…), procure a opção de escolher uma região específica. A região **não pode ser mudada depois**; se ficar errada, apague o projeto e crie de novo.

3. Em **Security**:

   | Opção | Valor | Motivo |
   |---|---|---|
   | Enable Data API | Marcado | O app acessa o banco por essa API |
   | Automatically expose new tables | **Desmarcado** | Tabela nova só fica acessível quando a migration concede permissão (`GRANT`) |
   | Enable automatic RLS | **Marcado** | Liga o RLS em toda tabela nova, como proteção extra caso uma migration esqueça |

4. Não altere **Advanced configuration**. Clique em **Create new project**.

O selo **main / PRODUCTION** no topo do painel é o nome da branch padrão do banco no Supabase. Ele aparece nos dois projetos e não indica o ambiente.

### 3.2 Provedores de login

Painel do projeto → **Authentication → Sign In / Providers** (`https://supabase.com/dashboard/project/<ref>/auth/providers`):

| Opção | Valor | Motivo |
|---|---|---|
| Allow new users to sign up | **Ligado** | O primeiro login com Google cria o usuário. Quem barra os não convidados é a lista `allowed_emails` |
| Email | **Desligado** | O login é só pelo Google. Ligado, qualquer pessoa poderia criar conta por e-mail usando a chave pública |
| Google | Configurado na seção [4.4](#44-ligar-o-google-no-supabase) | |

### 3.3 URLs de redirecionamento

Depois do login no Google, o Supabase só devolve o usuário para endereços cadastrados aqui. Se o endereço não estiver na lista, ele usa a **Site URL** no lugar.

Painel do projeto → **Authentication → URL Configuration** (`https://supabase.com/dashboard/project/<ref>/auth/url-configuration`):

| Projeto | Site URL | Redirect URLs |
|---|---|---|
| `dev` | `http://localhost:3100` | `http://localhost:3100/**` e `https://vobs-*-<escopo-vercel>.vercel.app/**` |
| `prod` | `<url-prod>` | `<url-prod>/**` |

O padrão `https://vobs-*-<escopo-vercel>.vercel.app/**` cobre as duas formas de URL de preview da Vercel:

- por deploy: `vobs-<hash>-<escopo-vercel>.vercel.app`;
- por branch: `vobs-car-git-<branch>-<escopo-vercel>.vercel.app`.

### 3.4 Chaves de API

Painel do projeto → **Project Settings → API Keys** (`https://supabase.com/dashboard/project/<ref>/settings/api-keys`):

| Chave | Formato | Variável | Observação |
|---|---|---|---|
| Publishable key | `sb_publishable_...` | `NUXT_PUBLIC_SUPABASE_KEY` | Pode ir para o navegador. Quem protege os dados é o RLS |
| Secret key | `sb_secret_...` | `NUXT_SUPABASE_SECRET_KEY` | Ignora o RLS. Só no servidor; nunca no código do cliente nem no repositório |

- A secret key fica mascarada; use o ícone de revelar ou copiar ao lado dela. Se a lista estiver vazia, clique em **Add new secret key**.
- Ignore a aba de chaves legadas (`anon` e `service_role`).
- A URL do projeto, `https://<ref>.supabase.co`, vai em `NUXT_PUBLIC_SUPABASE_URL`.
- As chaves podem ser consultadas a qualquer momento nessa página. Não é preciso guardá-las em outro lugar.

## 4. Google (login OAuth)

O login passa pelo Google, que devolve o usuário para o Supabase, que por sua vez devolve para o app. Por isso o Google só precisa conhecer a URL de callback do Supabase. As URLs do app, inclusive as de preview, ficam cadastradas no Supabase (seção 3.3).

### 4.1 Projeto no Google Cloud

1. Abra o [Google Cloud Console](https://console.cloud.google.com).
2. No seletor de projetos, no topo, confira qual projeto está selecionado. Contas Google costumam ter projetos criados automaticamente, como "My Maps Project".
3. Clique em **Novo projeto**, dê o nome `vobs-car` e crie.
4. Selecione o `vobs-car` no seletor antes de seguir.

### 4.2 Tela de consentimento

No menu, abra **Google Auth Platform**:

1. **Branding**:
   - Nome do app: `vobs-car`.
   - E-mail para suporte do usuário: o seu.
   - **Não envie logotipo.** Com logotipo, o Google exige verificação do app.
   - Os campos de domínio e política de privacidade podem ficar vazios.
2. **Acesso a dados**: só os escopos básicos, `openid`, `.../auth/userinfo.email` e `.../auth/userinfo.profile`. Eles não exigem revisão do Google.
3. **Público-alvo**:
   - Tipo de usuário: **Externo**.
   - Clique em **Publicar app**, para o status ficar **Em produção**.
   - Em modo de teste, só contas cadastradas como testadoras conseguem entrar. Os convidados ficariam de fora mesmo estando na lista do app.

### 4.3 Clients OAuth (um por ambiente)

Em **Google Auth Platform → Clientes → Criar cliente**, com o tipo **Aplicativo da Web**. Crie dois:

| Campo | `vobs-car-dev` | `vobs-car-prod` |
|---|---|---|
| Origens JavaScript autorizadas | `http://localhost:3100` | `<url-prod>` |
| URIs de redirecionamento autorizados | `https://<ref-dev>.supabase.co/auth/v1/callback` | `https://<ref-prod>.supabase.co/auth/v1/callback` |

Ao criar, copie o **ID do cliente** e a **Chave secreta do cliente**. Os dois ficam disponíveis depois na página do client.

Um client por ambiente evita que `dev` e `prod` compartilhem o mesmo segredo.

### 4.4 Ligar o Google no Supabase

No projeto Supabase correspondente, abra **Authentication → Sign In / Providers → Google**:

| Campo | Valor |
|---|---|
| Enable Sign in with Google | Ligado |
| Client IDs | Só o ID do client Web do ambiente |
| Client Secret (for OAuth) | A chave secreta do mesmo client |
| Skip nonce checks | **Desligado**. Afrouxa a validação do token e só serve para login nativo no iOS |
| Allow users without an email | **Desligado**. A lista de convidados funciona pelo e-mail |

A **Callback URL** mostrada nessa tela é a mesma que vai no client do Google (4.3). Clique em **Save**.

## 5. Banco: migrations e tipos

O Supabase CLI está nas dependências de desenvolvimento e roda com `pnpm exec supabase`. Como não há banco local, todo comando de banco leva `--remote`. Sem essa flag, o CLI 3 tenta um banco local em `127.0.0.1:54322`.

Na primeira vez, na raiz do projeto:

```bash
pnpm exec supabase login                          # abre o navegador para autorizar o CLI
pnpm exec supabase link --project-ref <ref-dev>   # o vínculo fica sempre no dev
```

Para aplicar migrations, sempre na ordem `dev` → `prod`:

```bash
# dev (projeto vinculado)
pnpm exec supabase db push --remote --dry-run     # só mostra o que seria aplicado
pnpm exec supabase db push --remote               # aplica

# prod (indicado pelo identificador, sem trocar o vínculo)
pnpm exec supabase db push --remote=<ref-prod> --dry-run
pnpm exec supabase db push --remote=<ref-prod>
```

Depois de mudar o schema, regenere os tipos TypeScript a partir do `dev`:

```bash
pnpm db:types   # gera shared/types/database.ts
```

Para conferir, abra o painel do projeto: o card **Last migration** mostra a última migration aplicada.

Cuidados:

- Migrations são forward-only. Uma migration já aplicada nunca é editada; correções viram uma migration nova ([DATABASE.md](DATABASE.md)).
- **Nunca rode `supabase config push`.** O `supabase/config.toml` descreve um ambiente local e sobrescreveria a configuração de login do projeto remoto, desligando o Google.

## 6. Ambiente local

```bash
pnpm install
cp .env.example .env
```

Preencha o `.env` com os valores do **`dev`**:

```bash
NUXT_PUBLIC_SUPABASE_URL=https://<ref-dev>.supabase.co
NUXT_PUBLIC_SUPABASE_KEY=sb_publishable_...
NUXT_SUPABASE_SECRET_KEY=sb_secret_...
```

O `.env` está no `.gitignore` e nunca vai para o repositório nem para a Vercel.

```bash
pnpm dev         # http://localhost:3100
pnpm lint        # ESLint
pnpm typecheck   # vue-tsc
```

A porta é fixa em 3100. Para entrar, o seu e-mail precisa estar na lista do `dev` (seção 8).

## 7. Vercel

### 7.1 Importar o repositório

1. Abra [vercel.com/new](https://vercel.com/new) e escolha **Import Git Repository**.
2. Se o repositório não aparecer, clique em **Adjust GitHub App Permissions**, escolha **Only select repositories** e adicione só o `vobs-car`.
3. Na tela de importação:

   | Campo | Valor |
   |---|---|
   | Project Name | `vobs-car` |
   | Framework Preset | Nuxt (detectado sozinho) |
   | Root Directory, Build Command, Install Command | Padrão |
   | Environment Variables | Vazio. É mais fácil separar por ambiente depois (7.2) |

4. Clique em **Deploy**. Sem variáveis, a página responde **500**, o que é esperado até o passo 7.2.

### 7.2 Variáveis de ambiente

Abra **Settings → Environment Variables → Add Environment Variable**. O formulário tem quatro partes:

| Parte | O que é |
|---|---|
| Type | **Config** (valor legível depois de salvo) ou **Secret** (valor oculto depois de salvo) |
| Key | O **nome** da variável, por exemplo `NUXT_PUBLIC_SUPABASE_URL` |
| Value | O **valor** da variável |
| Environments | Em quais ambientes a variável vale |

O resultado final são seis linhas:

| Key | Type | Production (`prod`) | Preview (`dev`) |
|---|---|---|---|
| `NUXT_PUBLIC_SUPABASE_URL` | Config | `https://<ref-prod>.supabase.co` | `https://<ref-dev>.supabase.co` |
| `NUXT_PUBLIC_SUPABASE_KEY` | Config | publishable key do `prod` | publishable key do `dev` |
| `NUXT_SUPABASE_SECRET_KEY` | Secret | secret key do `prod` | secret key do `dev` |

Como o tipo e o ambiente valem para o formulário inteiro, são quatro salvamentos:

1. **Config + Production.** Preencha `NUXT_PUBLIC_SUPABASE_URL` e use **+ Add new variable** para incluir `NUXT_PUBLIC_SUPABASE_KEY` no mesmo formulário. Em **Environments**, deixe só **Production**. Salve.
2. **Secret + Production.** `NUXT_SUPABASE_SECRET_KEY` com a secret key do `prod`. Salve.
3. **Config + Preview.** As duas públicas, com os valores do `dev`. Em **Environments**, abra **Environments**, marque **Preview** e desmarque o resto. Salve.
4. **Secret + Preview.** A secret key do `dev`. Salve.

Atalho: colar linhas no formato `NOME=valor` no campo **Key** faz a Vercel separar em várias variáveis. Dá para copiar do `.env` local, que tem os valores do `dev`, mas cole as duas públicas num formulário Config e a secreta num formulário Secret.

As variáveis `NUXT_PUBLIC_*` são do tipo Config porque vão para o navegador de qualquer forma; a Vercel mostra um aviso quando elas são marcadas como Secret. O ambiente **Development** da Vercel não é usado, porque o desenvolvimento local lê o `.env`.

Variáveis só valem para deploys novos:

- **Production:** abra **Deployments**, clique no último deploy e use **⋯ → Redeploy**.
- **Preview:** valem a partir do próximo PR ou push numa branch.

### 7.3 Região e versão do Node

As funções devem rodar em São Paulo (`gru1`), perto do banco. Para conferir:

```bash
curl -sI <url-prod>/login | grep -i x-vercel-id
# x-vercel-id: gru1::gru1::...   (borda::função)
```

Se a segunda parte não for `gru1`, ajuste em **Settings → Functions → Function Regions**. O lugar do menu muda entre versões do painel; a busca **Find** com o termo `region` ajuda. Outra opção é versionar a região num `vercel.json` com `"regions": ["gru1"]`.

O `engines` do `package.json` fixa o Node 24. A Vercel mostra o aviso **Node.js Version Override**, que é esperado. Para tirar o aviso, escolha **24.x** na configuração de versão do Node do projeto.

### 7.4 Previews

- Cada PR ganha um deploy próprio, e a Vercel comenta a URL no PR.
- Previews usam o banco `dev` e a lista de convidados do `dev`.
- Por padrão, previews exigem login na Vercel (Deployment Protection). Para mostrar um preview a quem não tem acesso ao projeto, use o botão **Share** na página do deploy. Para testes de amigos, prefira a URL de produção.

## 8. Convidar pessoas

### 8.1 Antes do primeiro convite

Confira uma única vez:

- O app do Google está **Em produção** (4.2, Público-alvo). Em modo de teste, os convidados não conseguem entrar.
- A URL de produção está nas Redirect URLs do `prod` (3.3).

### 8.2 Adicionar um convidado

1. Abra o **SQL Editor** do projeto certo:
   - `vobs-car-prod` para quem vai usar a URL de produção: `https://supabase.com/dashboard/project/<ref-prod>/sql/new`
   - `vobs-car-dev` para quem vai testar no ambiente local ou em previews.
2. Rode, com o e-mail **da conta Google** que a pessoa vai usar:

   ```sql
   insert into public.allowed_emails (email, note)
   values (lower('amigo@gmail.com'), 'nome ou motivo do convite');
   ```

   Para vários de uma vez:

   ```sql
   insert into public.allowed_emails (email, note) values
     (lower('pessoa1@gmail.com'), 'amigo da faculdade'),
     (lower('pessoa2@gmail.com'), 'testa a parte de motos');
   ```

3. O resultado deve ser **Success. No rows returned**.
4. Envie `<url-prod>` para a pessoa. Ela clica em **Entrar com Google** e escolhe aquela conta. No primeiro acesso, o perfil é criado automaticamente com o nome da conta Google.

Regras da tabela:

| Situação | O que acontece |
|---|---|
| E-mail com letra maiúscula sem `lower()` | Erro `violates check constraint`. A tabela só aceita minúsculas |
| E-mail já cadastrado | Erro `duplicate key value`. A pessoa já está convidada |
| Campo `note` | Opcional. Serve para lembrar quem é a pessoa |

### 8.3 Consultar convidados e acessos

Lista de convidados:

```sql
select email, note, created_at
from public.allowed_emails
order by created_at;
```

Quem já entrou pelo menos uma vez:

```sql
select p.display_name, u.email, p.role, p.created_at
from public.profiles p
join auth.users u on u.id = p.id
order by p.created_at;
```

### 8.4 A pessoa caiu em "Acesso restrito"

A tela "Seu e-mail não está na lista de convidados" aparece quando o e-mail da conta Google não está em `allowed_emails` **do projeto daquele ambiente**. Causas comuns:

- erro de digitação no e-mail cadastrado;
- a pessoa escolheu outra conta Google na tela de login;
- o convite foi feito no projeto errado (`dev` em vez de `prod`, ou o contrário).

Corrija o cadastro e peça para a pessoa clicar em **Entrar com outra conta** e entrar de novo.

### 8.5 Remover o acesso

O que torna alguém membro é ter perfil em `profiles`, criado no primeiro acesso. A lista de convidados só é consultada nesse momento. Por isso, remover o acesso exige dois passos:

1. Tirar da lista, para impedir um novo cadastro:

   ```sql
   delete from public.allowed_emails
   where email = lower('pessoa@gmail.com');
   ```

2. Apagar o usuário em **Authentication → Users**: localize o e-mail, abra o menu **⋯** e use **Delete user**. O perfil é apagado junto, por cascata.

O acesso é cortado na hora: toda rota do servidor confere o perfil a cada requisição, e as políticas RLS também.

## 9. Lista de verificação

Depois de configurar ou alterar qualquer ambiente:

| Verificação | Como | Esperado |
|---|---|---|
| Produção no ar | `curl -sI <url-prod>/login` | `HTTP/2 200` |
| Região das funções | Header `x-vercel-id` da mesma resposta | `gru1::gru1::...` |
| API protegida | `curl -s -o /dev/null -w '%{http_code}' <url-prod>/api/me` | `401` |
| Migrations em dia | Card **Last migration** nos dois projetos Supabase | Mesma migration nos dois |
| Login | Abrir `<url-prod>` e entrar com uma conta convidada | "Olá, *nome*" na página inicial |
| Logout | Botão **Sair** | Volta para `/login` |

## 10. Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `ERR_CONNECTION_REFUSED` em `localhost:3100` | O `pnpm dev` não está rodando, ou o terminal foi aberto antes da instalação do Node | Abrir um terminal novo e rodar `pnpm dev` |
| `pnpm: command not found` | Terminal sem a configuração do fnm | Abrir um terminal novo ou rodar `source ~/.zshrc` |
| 500 na Vercel | Variáveis ausentes, ou deploy feito antes de cadastrá-las | Conferir as seis variáveis (7.2) e fazer **Redeploy** |
| Depois do Google, volta para `localhost` ou para a página errada | A URL do app não está nas Redirect URLs, e o Supabase usou a Site URL | Cadastrar a URL (3.3) |
| Erro `redirect_uri_mismatch` do Google | A callback do Supabase não está no client OAuth | Conferir as URIs de redirecionamento (4.3) |
| "Seu e-mail não está na lista de convidados" | E-mail fora de `allowed_emails` no projeto daquele ambiente | Seção 8.4 |
| Convidado não consegue nem passar pela tela do Google | App do Google em modo de teste | Publicar o app (4.2) |
| Aviso ao salvar `NUXT_PUBLIC_*` como Secret na Vercel | Variáveis públicas devem ser Config | Salvar como Config (7.2) |
| `supabase db push` tenta `127.0.0.1:54322` | O CLI 3 usa o banco local por padrão | Usar `--remote` (seção 5) |
| `db push` recusado com "Confirmation required" | O CLI exige confirmação explícita em execuções não interativas | Rodar no seu terminal ou acrescentar `--yes`, depois de conferir o `--dry-run` |
| Botão sem estilo ou avisos de hydration depois de mudar a configuração | A aba do navegador ainda roda o código antigo | Recarregar com Ctrl+Shift+R |

## 11. Referência de variáveis

| Variável | Onde é usada | Tipo na Vercel | Origem |
|---|---|---|---|
| `NUXT_PUBLIC_SUPABASE_URL` | Navegador e servidor | Config | `https://<ref>.supabase.co` |
| `NUXT_PUBLIC_SUPABASE_KEY` | Navegador e servidor | Config | Supabase → API Keys → Publishable key |
| `NUXT_SUPABASE_SECRET_KEY` | Só no servidor | Secret | Supabase → API Keys → Secret key |

O prefixo `NUXT_` faz o Nuxt ler os valores quando o servidor roda, e não só no build. Assim a chave secreta não fica gravada no código gerado. O modelo está em [`.env.example`](../.env.example).
