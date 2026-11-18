# Operação em produção

O dia a dia com o vobs-car no ar: publicar uma versão, conferir se ela subiu, ler os logs, desfazer um deploy e lidar com os limites dos planos gratuitos. Montar os ambientes do zero está em [SETUP.md](SETUP.md), e convidar pessoas em [INVITES.md](INVITES.md).

Os marcadores são os mesmos do SETUP: `<ref-prod>` é o identificador do projeto `vobs-car-prod` no Supabase, e `<url-prod>` é a URL de produção, hoje `https://vobs-car.vercel.app`.

## Onde olhar

| O quê                        | Onde                                                        |
|---                           |---                                                          |
| Deploys, rollback e redeploy | Vercel, aba **Deployments** do projeto                      |
| Logs do servidor             | Vercel, aba **Logs** do projeto                             |
| Variáveis de ambiente        | Vercel, **Settings → Environment Variables**                |
| Dados e consultas            | Supabase `vobs-car-prod`, **Table Editor** e **SQL Editor** |
| Contas de quem já entrou     | Supabase `vobs-car-prod`, **Authentication → Users**        |

## 1. Publicar uma versão

A Vercel publica a `master` sozinha a cada merge, então o banco de produção vai na frente do código. Para isso dar certo, toda migration precisa funcionar com o código que já está no ar: tabelas novas e colunas com `default` ou nulas. Renomear ou apagar uma coluna vira dois PRs, primeiro o código para de usá-la e depois a migration remove.

Antes do merge, no terminal, na branch do PR:

```bash
# migrations que faltam no prod: as que estão com a coluna Remote vazia
pnpm exec supabase migration list --remote=<ref-prod>

# aplicar: primeiro a simulação, depois de verdade
pnpm exec supabase db push --remote=<ref-prod> --dry-run
pnpm exec supabase db push --remote=<ref-prod>

# variáveis novas que o PR pede
git diff master -- .env.example
```

Se o `git diff` mostrar uma variável nova, cadastre-a na Vercel, em Production e Preview, antes do merge. Sem isso, o primeiro deploy sobe sem ela.

Depois do merge, acompanhe o build em **Deployments**. Um build com erro não derruba nada: a produção continua no deploy anterior até um build passar.

## 2. Conferir se está no ar

```bash
curl -sI <url-prod>/login | head -1                                                # HTTP/2 200
curl -s -o /dev/null -w '%{http_code}\n' <url-prod>/api/me                         # 401
curl -s -o /dev/null -w '%{http_code}\n' '<url-prod>/api/catalog/brands?type=car'  # 401
curl -sI <url-prod>/login | grep -i x-vercel-id                                    # gru1::gru1::...
```

Sem sessão, as rotas da API respondem 401. É o esperado: mostra que o servidor está de pé e que as rotas estão protegidas. O `x-vercel-id` começando com `gru1` confirma que a função rodou em São Paulo.

Por fim, entre no app e escolha um veículo. Se as marcas aparecem, o banco está respondendo; se o painel mostra o valor FIPE, a API da FIPE também.

## 3. Logs

O servidor escreve uma linha JSON por evento, com `level`, `message`, `time` e o contexto do evento. E-mail, tokens e chaves nunca entram no log. Na aba **Logs** da Vercel, filtre pelo nível ou busque pelo texto da mensagem.

No plano gratuito, a Vercel guarda só a última hora de logs, então olhe logo depois do problema.

| Mensagem                                         | Nível   | O que quer dizer                                                                                                                                                                                   |
|---                                               |---      |---                                                                                                                                                                                                 |
| `Erro não tratado`                               | `error` | Uma rota respondeu 5xx. `error.message` traz a causa e `path` traz a rota                                                                                                                          |
| `FIPE indisponível`                              | `warn`  | A FIPE falhou e o app usou o que já tinha no banco. `cause.message` traz o motivo, e um 429 ali é cota esgotada. Com `hasMirror: false` não havia cópia, e a pessoa viu o aviso de FIPE fora do ar |
| `Ano da FIPE ignorado: combustível desconhecido` | `warn`  | A FIPE mandou um combustível que o app não conhece, e aquela versão fica fora da lista                                                                                                             |
| `Login recusado: e-mail fora da allowlist`       | `warn`  | Alguém fora da lista tentou entrar. Com o `userId`, dá para achar a conta em **Authentication → Users**                                                                                            |

## 4. Desfazer um deploy

Se a versão nova quebrou algo, volte o código primeiro e corrija depois, com calma.

Na página do projeto na Vercel, o card do deploy de produção tem o botão **Instant Rollback**. No plano gratuito, ele só volta para o deploy imediatamente anterior. A troca é instantânea, mas o banco não volta junto: se o problema veio de uma migration, a correção é uma migration nova.

Enquanto o rollback estiver ativo, a Vercel não publica sozinha os merges na `master`, e mudanças de variáveis também não entram. Para sair desse estado:

1. Corrija numa branch nova, com `git revert` do commit problemático ou com a correção, e faça o merge do PR.
2. Espere o build do deploy novo terminar em **Deployments**.
3. No card do deploy de produção, use **Manage**, escolha o deploy novo e confirme. A publicação automática volta a funcionar.

## 5. Trocar uma variável ou chave

Variáveis só valem para deploys novos. Depois de editar uma em **Settings → Environment Variables**, abra o menu **⋮** do deploy atual em **Deployments** e use **Redeploy**.

A secret key do Supabase pode ser trocada sem tirar o app do ar, porque o projeto aceita mais de uma ao mesmo tempo:

1. Em **Project Settings → API Keys**, crie uma secret key nova.
2. Troque o valor de `NUXT_SUPABASE_SECRET_KEY` em Production na Vercel e faça o redeploy.
3. Confira o app (seção 2) e só então apague a chave antiga.

## 6. Limites dos planos gratuitos

| Serviço  | Limite                                                                                    | O que fazer                                                                                                                                     |
|---       |---                                                                                        |---                                                                                                                                              |
| Supabase | Projeto com pouca atividade por 7 dias é pausado, e o login e os dados param de funcionar | O Supabase avisa por e-mail antes. Para voltar, abra o projeto no painel e use **Resume project**. Dados e configurações voltam como estavam    |
| Supabase | Sem backup automático                                                                     | O catálogo é refeito sozinho a partir da FIPE. Antes de uma migration que apaga dados, exporte as tabelas afetadas em CSV pelo **Table Editor** |
| Vercel   | Logs só da última hora e rollback só para o deploy anterior                               | Seções 3 e 4                                                                                                                                    |
| FIPE     | 1.000 consultas por dia com o token                                                       | O espelho no banco segura o consumo. Se a cota acabar, o catálogo segue com o que já foi consultado e o resto volta no dia seguinte             |

## 7. Problemas comuns

| Sintoma                                              | Causa provável                                       | O que fazer                                                 |
|---                                                   |---                                                   |---                                                          |
| Login ou páginas com erro, com o deploy em dia       | Projeto Supabase pausado                             | Seção 6                                                     |
| Merge feito, mas a produção não mudou                | Build com erro ou rollback ativo                     | Ver o build em **Deployments**. Se houver rollback, seção 4 |
| Erro 500 logo depois do merge de um PR com migration | Migration não aplicada no prod                       | Seção 1                                                     |
| Variável trocada, mas o app segue com o valor antigo | Faltou o redeploy                                    | Seção 5                                                     |
| "A tabela FIPE está fora do ar" no catálogo          | FIPE fora do ar ou cota esgotada, sem cópia no banco | Buscar `FIPE indisponível` nos logs (seção 3)               |
