# Convidar pessoas

O vobs-car só aceita quem está na lista de convidados ([ADR-0006](adr/0006-acesso-restrito.md)). A lista é a tabela `allowed_emails`, e cada projeto Supabase tem a sua:

| Para quem vai usar                     | Projeto         |
|---                                     |---              |
| A URL de produção                      | `vobs-car-prod` |
| A máquina local ou os previews dos PRs | `vobs-car-dev`  |

Todos os comandos abaixo rodam no **SQL Editor** do projeto certo.

## Adicionar

Use o e-mail da conta Google que a pessoa vai usar para entrar:

```sql
insert into public.allowed_emails (email, note)
values (lower('amigo@gmail.com'), 'quem é a pessoa');
```

Vários de uma vez:

```sql
insert into public.allowed_emails (email, note) values
  (lower('pessoa1@gmail.com'), 'amigo da faculdade'),
  (lower('pessoa2@gmail.com'), 'testa a parte de motos');
```

O resultado esperado é **Success. No rows returned**. Depois é só mandar o link para a pessoa e pedir para ela clicar em **Entrar com Google** com aquela conta. O perfil dela é criado no primeiro acesso.

Se aparecer `duplicate key value`, o e-mail já estava na lista.

## Consultar

Convidados:

```sql
select email, note, created_at
from public.allowed_emails
order by created_at;
```

Quem já entrou:

```sql
select p.display_name, u.email, p.created_at
from public.profiles p
join auth.users u on u.id = p.id
order by p.created_at;
```

## Quando a pessoa cai em "acesso restrito"

A tela "Seu e-mail não está na lista de convidados" aparece por um destes motivos:

- o e-mail foi digitado errado;
- a pessoa escolheu outra conta Google na hora de entrar;
- o convite foi feito no projeto errado (`dev` em vez de `prod`).

Corrija o cadastro e peça para ela clicar em **Entrar com outra conta** e entrar de novo.

Se a pessoa nem passa da tela do Google, o app do Google ainda está em modo de teste. Veja a seção 3 de [SETUP.md](SETUP.md).

## Remover

São dois passos, porque a lista só é consultada no primeiro acesso. Quem já entrou continua membro enquanto tiver perfil.

1. Tire o e-mail da lista:

```sql
delete from public.allowed_emails
where email = lower('pessoa@gmail.com');
```

2. Em **Authentication → Users**, encontre o e-mail, abra o menu **⋯** e use **Delete user**. O perfil é apagado junto.

O acesso é cortado na hora.
