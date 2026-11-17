# Configuração dos ambientes

Como montar os ambientes do vobs-car do zero: Supabase, login com Google, Vercel e máquina local. Para convidar pessoas, veja [INVITES.md](INVITES.md).

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

## 4. Banco

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

## 5. Máquina local

```bash
pnpm install
cp .env.example .env   # preencha com as chaves do dev
pnpm dev               # http://localhost:3100
```

Para entrar, o seu e-mail precisa estar na lista do `dev` ([INVITES.md](INVITES.md)).

## 6. Vercel

### Importar

1. Em [vercel.com/new](https://vercel.com/new), importe o repositório. Se ele não aparecer, em **Adjust GitHub App Permissions** libere só o `vobs-car`.
2. Deixe tudo no padrão, sem variáveis, e clique em **Deploy**. O primeiro deploy responde 500 até as variáveis existirem.

### Variáveis

Em **Settings → Environment Variables**, o resultado final são seis linhas:

| Key                        | Type   | Production            | Preview              |
|---                         |---     |---                    |---                   |
| `NUXT_PUBLIC_SUPABASE_URL` | Config | URL do `prod`         | URL do `dev`         |
| `NUXT_PUBLIC_SUPABASE_KEY` | Config | publishable do `prod` | publishable do `dev` |
| `NUXT_SUPABASE_SECRET_KEY` | Secret | secret do `prod`      | secret do `dev`      |

No formulário, **Key** é o nome e **Value** é o valor. O tipo e o ambiente valem para o formulário inteiro, então são quatro salvamentos: Config + Production, Secret + Production, Config + Preview e Secret + Preview. Use **+ Add new variable** para pôr as duas públicas no mesmo formulário.

Variáveis só valem para deploys novos. Depois de salvar as de Production, faça **Deployments → ⋯ → Redeploy**.

### Região e Node

As funções devem rodar em São Paulo. Para conferir:

```bash
curl -sI <url-prod>/login | grep -i x-vercel-id   # esperado: gru1::gru1::...
```

O aviso **Node.js Version Override** é esperado: o `package.json` fixa o Node 24.

### Previews

Cada PR ganha um deploy próprio, com o banco `dev`. Previews pedem login na Vercel; para mostrar a alguém de fora, use o botão **Share** do deploy.

## 7. Verificação e problemas comuns

Depois de qualquer mudança:

```bash
curl -sI <url-prod>/login | head -1                                # HTTP/2 200
curl -s -o /dev/null -w '%{http_code}\n' <url-prod>/api/me         # 401
```

| Sintoma                                               | Solução                                                           |
|---                                                    |---                                                                |
| `ERR_CONNECTION_REFUSED` em `localhost:3100`          | Rodar `pnpm dev` num terminal aberto depois da instalação do Node |
| 500 na Vercel                                         | Conferir as seis variáveis e fazer Redeploy                       |
| Depois do Google, volta para a página errada          | Cadastrar a URL do app nas Redirect URLs do Supabase              |
| `redirect_uri_mismatch` no Google                     | Conferir a URI de redirecionamento do client                      |
| Convidado não passa da tela do Google                 | Publicar o app no Google (Público-alvo)                           |
| "Seu e-mail não está na lista de convidados"          | Ver [INVITES.md](INVITES.md)                                      |
| Aviso da Vercel ao salvar `NUXT_PUBLIC_*` como Secret | Salvar como Config                                                |
| `db push` tenta `127.0.0.1:54322`                     | Faltou o `--remote`                                               |
| Botão sem estilo depois de mudar a configuração       | Recarregar a aba com Ctrl+Shift+R                                 |
