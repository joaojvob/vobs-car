-- Controle de acesso: allowlist de convidados, perfis de membros e a função usada pelas políticas RLS.
-- Contexto: docs/adr/0006-acesso-restrito.md e docs/DATABASE.md (seções 6 e 8).
-- As tabelas não são expostas automaticamente na API: cada uma recebe GRANT explícito.

-- Tipos compartilhados

create type public.user_role as enum ('member', 'admin');

create domain public.uf as char(2)
  check (value in (
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
    'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ));

-- allowed_emails: só o servidor lê e escreve

create table public.allowed_emails (
  email text primary key check (email = lower(email) and email like '%_@_%'),
  note text,
  created_at timestamptz not null default now()
);

comment on table public.allowed_emails is 'Allowlist de convidados. Sem acesso pelo cliente.';

alter table public.allowed_emails enable row level security;

grant select, insert, update, delete on public.allowed_emails to service_role;

-- profiles: criado pelo servidor no primeiro login de um e-mail autorizado

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  home_uf public.uf,
  role public.user_role not null default 'member',
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Membro do app. A existência do registro é o que torna o usuário membro.';

alter table public.profiles enable row level security;

create policy "Membro lê o próprio perfil"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "Membro edita o próprio perfil"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- O cliente só altera display_name e home_uf; role e id ficam fora do alcance.
grant select on public.profiles to authenticated;
grant update (display_name, home_uf) on public.profiles to authenticated;
grant select, insert, update, delete on public.profiles to service_role;

-- is_member(): em schema não exposto pela API, como recomenda o Supabase para funções security definer

create schema private;

grant usage on schema private to authenticated, service_role;

create function private.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = (select auth.uid())
  );
$$;

comment on function private.is_member() is 'Verdadeira se o usuário autenticado tem perfil. Base das políticas RLS de leitura.';

revoke execute on function private.is_member() from public;
grant execute on function private.is_member() to authenticated, service_role;
