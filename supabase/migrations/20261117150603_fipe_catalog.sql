-- Catálogo: espelho local da tabela FIPE (marcas, modelos, versões por ano e preços).
-- Contexto: docs/DATABASE.md (seção 1) e docs/ARCHITECTURE.md (seção 13, limite da FIPE).
-- O servidor sincroniza sob demanda a partir da API da FIPE; membros só leem.
-- As colunas *_synced_at controlam quando cada lista foi buscada pela última vez.

-- Tipos

create type public.vehicle_type as enum ('car', 'motorcycle');

create type public.fuel_type as enum ('gasoline', 'ethanol', 'flex', 'diesel', 'hybrid', 'electric');

-- fipe_brands

create table public.fipe_brands (
  id bigint generated always as identity primary key,
  vehicle_type public.vehicle_type not null,
  fipe_code text not null,
  name text not null,
  synced_at timestamptz not null default now(),
  models_synced_at timestamptz,
  unique (vehicle_type, fipe_code)
);

comment on table public.fipe_brands is 'Marcas da FIPE por tipo de veículo.';
comment on column public.fipe_brands.synced_at is 'Última vez que a marca veio na lista da FIPE.';
comment on column public.fipe_brands.models_synced_at is 'Última sincronização dos modelos da marca. Nulo: nunca sincronizados.';

alter table public.fipe_brands enable row level security;

create policy "Membro lê as marcas"
  on public.fipe_brands for select
  to authenticated
  using ((select private.is_member()));

grant select on public.fipe_brands to authenticated;
grant select, insert, update, delete on public.fipe_brands to service_role;

-- fipe_models

create table public.fipe_models (
  id bigint generated always as identity primary key,
  brand_id bigint not null references public.fipe_brands (id),
  fipe_code text not null,
  name text not null,
  synced_at timestamptz not null default now(),
  years_synced_at timestamptz,
  unique (brand_id, fipe_code)
);

comment on table public.fipe_models is 'Modelos da FIPE. O nome inclui versão e motor (ex: "Gol 1.0 Mi Total Flex 8V 4p").';
comment on column public.fipe_models.years_synced_at is 'Última sincronização dos anos do modelo. Nulo: nunca sincronizados.';

alter table public.fipe_models enable row level security;

create policy "Membro lê os modelos"
  on public.fipe_models for select
  to authenticated
  using ((select private.is_member()));

grant select on public.fipe_models to authenticated;
grant select, insert, update, delete on public.fipe_models to service_role;

-- fipe_model_years: a versão FIPE que o usuário escolhe

create table public.fipe_model_years (
  id bigint generated always as identity primary key,
  model_id bigint not null references public.fipe_models (id),
  fipe_year_code text not null,
  model_year smallint check (model_year between 1900 and 2100),
  fuel public.fuel_type not null,
  fipe_vehicle_code text,
  synced_at timestamptz not null default now(),
  price_synced_at timestamptz,
  unique (model_id, fipe_year_code)
);

comment on table public.fipe_model_years is 'Versão FIPE: modelo + ano-modelo + combustível.';
comment on column public.fipe_model_years.fipe_year_code is 'Código do ano na FIPE (ex: "2020-1"). O ano 32000 é zero km.';
comment on column public.fipe_model_years.model_year is 'Ano-modelo. Nulo: zero km.';
comment on column public.fipe_model_years.fipe_vehicle_code is 'Código FIPE do veículo (ex: "005340-6"). Chega junto com o preço.';
comment on column public.fipe_model_years.price_synced_at is 'Última consulta do preço. Nulo: nunca consultado.';

alter table public.fipe_model_years enable row level security;

create policy "Membro lê as versões"
  on public.fipe_model_years for select
  to authenticated
  using ((select private.is_member()));

grant select on public.fipe_model_years to authenticated;
grant select, insert, update, delete on public.fipe_model_years to service_role;

-- fipe_prices: um preço por versão e mês de referência, base do IPVA e da depreciação

create table public.fipe_prices (
  id bigint generated always as identity primary key,
  model_year_id bigint not null references public.fipe_model_years (id),
  reference_month date not null check (extract(day from reference_month) = 1),
  price_cents bigint not null check (price_cents >= 0),
  unique (model_year_id, reference_month)
);

comment on table public.fipe_prices is 'Preço médio da FIPE por mês de referência, em centavos.';
comment on column public.fipe_prices.reference_month is 'Sempre o dia 1 do mês de referência.';

alter table public.fipe_prices enable row level security;

create policy "Membro lê os preços"
  on public.fipe_prices for select
  to authenticated
  using ((select private.is_member()));

grant select on public.fipe_prices to authenticated;
grant select, insert, update, delete on public.fipe_prices to service_role;
