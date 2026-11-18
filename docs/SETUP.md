# Configuração dos ambientes

Como montar os ambientes do vobs-car do zero: Supabase, login com Google, token da FIPE, chave do Gemini, Vercel e máquina local. Para convidar pessoas, veja [INVITES.md](INVITES.md); para a rotina com o app no ar, [OPERATIONS.md](OPERATIONS.md).

Decisões relacionadas: [ADR-0006](adr/0006-acesso-restrito.md) (acesso por convite) e [ADR-0011](adr/0011-ambientes-na-nuvem.md) (ambientes sem Docker).

## Visão geral

| Ambiente | Onde roda                | Supabase        | Client do Google | Variáveis           |
|---       |---                       |---              |---               |---                  |
| Local    | `pnpm dev`, porta 3100   | `vobs-car-dev`  | `vobs-car-dev`   | `.env`              |
| Preview  | Vercel, um deploy por PR | `vobs-car-dev`  | `vobs-car-dev`   | Vercel (Preview)    |
| Produção | Vercel, branch `master`  | `vobs-car-prod` | `vobs-car-prod`  | Vercel (Production) |

Marcadores usados no guia:

- `<ref-dev>` e `<ref-prod>`: identificador de cada projeto Supabase, o código na URL `supabase.com/dashboard/project/<ref>`.
- `<url-prod>`: URL de produção, hoje `https://vobs-car.vercel.app`.
- `<escopo-vercel>`: nome da conta na Vercel, o final das URLs de deploy (`vobs-<hash>-<escopo-vercel>.vercel.app`).

## 1. Ferramentas

Node.js 24 e pnpm. Docker não é necessário.

```bash
curl -fsSL https://fnm.vercel.app/install | bash
# feche o terminal e abra outro
fnm install 24 && fnm default 24
corepack enable pnpm
```

Terminais abertos antes da instalação não enxergam o `node` nem o `pnpm`.

## 2. Supabase

Faça esta seção duas vezes: uma para `vobs-car-dev` e outra para `vobs-car-prod`.

### Criar o projeto

Em **New project**:

| Campo                           | Valor                                                       |
|---                              |---                                                          |
| Project name                    | `vobs-car-dev` ou `vobs-car-prod`                           |
| Database password               | **Generate a password** e guardar num gerenciador de senhas |
| Region                          | South America (São Paulo)                                   |
| GitHub                          | Vazio                                                       |
| Enable Data API                 | Marcado                                                     |
| Automatically expose new tables | **Desmarcado**                                              |
| Enable automatic RLS            | **Marcado**                                                 |

A região não muda depois de criada. Se errar, apague e crie de novo.

O selo **main / PRODUCTION** no topo do painel é só o nome da branch do banco. Aparece nos dois projetos.

### Login

Em **Authentication → Sign In / Providers**:

| Opção                      | Valor                                                 |
|---                         |---                                                    |
| Allow new users to sign up | Ligado. Quem barra os não convidados é a lista do app |
| Email                      | **Desligado**. O login é só pelo Google               |
| Google                     | Ligado depois do passo 3                              |

### URLs de redirecionamento

Em **Authentication → URL Configuration**:

| Projeto | Site URL                | Redirect URLs                                                                |
|---      |---                      |---                                                                           |
| `dev`   | `http://localhost:3100` | `http://localhost:3100/**`<br>`https://vobs-*-<escopo-vercel>.vercel.app/**` |
| `prod`  | `<url-prod>`            | `<url-prod>/**`                                                              |

Se a URL do app não estiver nessa lista, o Supabase devolve o usuário para a Site URL depois do login. O padrão `vobs-*` cobre as duas formas de URL de preview da Vercel.

### Chaves

Em **Project Settings → API Keys**:

| Chave                                       | Variável                   |
|---                                          |---                         |
| URL do projeto, `https://<ref>.supabase.co` | `NUXT_PUBLIC_SUPABASE_URL` |
| Publishable key, `sb_publishable_...`       | `NUXT_PUBLIC_SUPABASE_KEY` |
| Secret key, `sb_secret_...`                 | `NUXT_SUPABASE_SECRET_KEY` |

A secret key ignora o RLS: só no servidor, nunca no repositório. Ignore a aba de chaves legadas (`anon` e `service_role`). As chaves podem ser consultadas nessa página a qualquer momento.

## 3. Google

O Google só conversa com o Supabase. As URLs do app ficam cadastradas no Supabase, não no Google.

### Projeto e tela de consentimento

1. No [Google Cloud Console](https://console.cloud.google.com), crie o projeto `vobs-car` e selecione-o no topo.
2. Em **Google Auth Platform → Branding**: nome `vobs-car`, seu e-mail, **sem logotipo** (logotipo exige verificação).
3. Em **Acesso a dados**: só `openid`, `userinfo.email` e `userinfo.profile`.
4. Em **Público-alvo**: tipo Externo e **Publicar app**. Em modo de teste, os convidados não conseguem entrar.

### Clients (um por ambiente)

Em **Clientes → Criar cliente → Aplicativo da Web**:

| Campo                   | `vobs-car-dev`                                   | `vobs-car-prod`                                   |
|---                      |---                                               |---                                                |
| Origens JavaScript      | `http://localhost:3100`                          | `<url-prod>`                                      |
| URI de redirecionamento | `https://<ref-dev>.supabase.co/auth/v1/callback` | `https://<ref-prod>.supabase.co/auth/v1/callback` |

### Ligar no Supabase

No projeto Supabase do mesmo ambiente, em **Sign In / Providers → Google**: ative, cole o ID e a chave secreta do client e salve. Deixe **Skip nonce checks** e **Allow users without an email** desligados.

## 4. APIs externas

### FIPE

O catálogo vem da API FIPE da Parallelum. Sem token, o limite é de 500 consultas por dia contadas por IP, e na Vercel o IP é compartilhado com outros projetos, então a cota pode acabar sem aviso. Com o token gratuito, são 1.000 consultas por dia, só do app.

1. Crie a conta em [fipe.api.br/register](https://fipe.api.br/register) e copie o token.
2. Coloque o token em `NUXT_FIPE_API_TOKEN`, no `.env` (seção 6) e na Vercel (seção 7).

O app guarda no banco tudo o que consulta e só volta à FIPE depois de 30 dias para listas e 7 dias para preços, então o consumo diário fica baixo.

### Gemini

A IA usa a Gemini API no plano gratuito ([ADR-0004](adr/0004-pipeline-ia.md)), e a chave fica só no servidor.

1. Em [aistudio.google.com/apikey](https://aistudio.google.com/apikey), crie a chave num projeto sem faturamento ativado. Assim, quando a cota acaba, a API recusa a chamada em vez de cobrar.
2. Coloque a chave em `NUXT_GEMINI_API_KEY`, no `.env` (seção 6) e na Vercel (seção 7).

O modelo de cada etapa tem um padrão no `nuxt.config.ts` e pode ser trocado por variável, como `NUXT_GEMINI_MODELS_MAPPING`.

## 5. Banco

O Supabase CLI já vem no projeto. Todo comando leva `--remote`, porque não há banco local.

```bash
# uma vez
pnpm exec supabase login
pnpm exec supabase link --project-ref <ref-dev>

# migrations: primeiro dev, depois prod
pnpm exec supabase db push --remote --dry-run
pnpm exec supabase db push --remote
pnpm exec supabase db push --remote=<ref-prod> --dry-run
pnpm exec supabase db push --remote=<ref-prod>

# tipos TypeScript, depois de mudar o schema
pnpm db:types
```

Nunca rode `supabase config push`: ele sobrescreve o login do projeto remoto e desliga o Google.

## 6. Máquina local

```bash
pnpm install
cp .env.example .env   # preencha com as chaves do dev, o token da FIPE e a chave do Gemini
pnpm dev               # http://localhost:3100
```

Para entrar, o seu e-mail precisa estar na lista do `dev` ([INVITES.md](INVITES.md)).

Para mapear uma versão FIPE à mão, com o `pnpm dev` rodando:

```bash
pnpm exec nuxi task run ai:map-model-year --payload '{"modelYearId": 123}'
```

O id da versão aparece na chamada `/api/catalog/model-years/<id>`, na aba de rede do navegador, ao escolher a versão no catálogo. Cada execução é uma chamada real ao Gemini e gasta cota.

## 7. Vercel

### Importar

1. Em [vercel.com/new](https://vercel.com/new), importe o repositório. Se ele não aparecer, em **Adjust GitHub App Permissions** libere só o `vobs-car`.
2. Deixe tudo no padrão, sem variáveis, e clique em **Deploy**. O primeiro deploy responde 500 até as variáveis existirem.

### Variáveis

Em **Settings → Environment Variables**, o resultado final são dez linhas:

| Key                        | Type   | Production            | Preview              |
|---                         |---     |---                    |---                   |
| `NUXT_PUBLIC_SUPABASE_URL` | Config | URL do `prod`         | URL do `dev`         |
| `NUXT_PUBLIC_SUPABASE_KEY` | Config | publishable do `prod` | publishable do `dev` |
| `NUXT_SUPABASE_SECRET_KEY` | Secret | secret do `prod`      | secret do `dev`      |
| `NUXT_FIPE_API_TOKEN`      | Secret | token da FIPE         | o mesmo token        |
| `NUXT_GEMINI_API_KEY`      | Secret | chave do Gemini       | a mesma chave        |

No formulário, **Key** é o nome e **Value** é o valor. O tipo e o ambiente valem para o formulário inteiro, então são quatro salvamentos: Config + Production, Secret + Production, Config + Preview e Secret + Preview. Use **+ Add new variable** para pôr as duas públicas no mesmo formulário, e as três secrets juntas.

Variáveis só valem para deploys novos. Depois de salvar as de Production, faça **Deployments → ⋯ → Redeploy**.

### Região e Node

As funções devem rodar em São Paulo. Para conferir:

```bash
curl -sI <url-prod>/login | grep -i x-vercel-id   # esperado: gru1::gru1::...
```

O aviso **Node.js Version Override** é esperado: o `package.json` fixa o Node 24.

### Previews

Cada PR ganha um deploy próprio, com o banco `dev`. Previews pedem login na Vercel; para mostrar a alguém de fora, use o botão **Share** do deploy.

## 8. Verificação e problemas comuns

Depois de qualquer mudança:

```bash
curl -sI <url-prod>/login | head -1                                # HTTP/2 200
curl -s -o /dev/null -w '%{http_code}\n' <url-prod>/api/me         # 401
```

| Sintoma                                               | Solução                                                                   |
|---                                                    |---                                                                        |
| `ERR_CONNECTION_REFUSED` em `localhost:3100`          | Rodar `pnpm dev` num terminal aberto depois da instalação do Node         |
| 500 na Vercel                                         | Conferir as variáveis do Supabase e fazer Redeploy                        |
| "A tabela FIPE está fora do ar" no catálogo           | Conferir o `NUXT_FIPE_API_TOKEN`. Sem ele, a cota por IP pode ter acabado |
| Depois do Google, volta para a página errada          | Cadastrar a URL do app nas Redirect URLs do Supabase                      |
| `redirect_uri_mismatch` no Google                     | Conferir a URI de redirecionamento do client                              |
| Convidado não passa da tela do Google                 | Publicar o app no Google (Público-alvo)                                   |
| "Seu e-mail não está na lista de convidados"          | Ver [INVITES.md](INVITES.md)                                              |
| Aviso da Vercel ao salvar `NUXT_PUBLIC_*` como Secret | Salvar como Config                                                        |
| `db push` tenta `127.0.0.1:54322`                     | Faltou o `--remote`                                                       |
| Botão sem estilo depois de mudar a configuração       | Recarregar a aba com Ctrl+Shift+R                                         |
