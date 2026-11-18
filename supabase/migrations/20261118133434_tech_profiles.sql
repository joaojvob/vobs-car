-- Perfis técnicos: motores, câmbios e o perfil (marca + família + geração + motor + câmbio)
-- ao qual as versões FIPE apontam. Todo conteúdo técnico pertence ao perfil (ADR-0002).
-- Contexto: docs/DATABASE.md (seção 2) e docs/adr/0008-modelagem-veiculos.md.
-- O servidor grava pelo mapeamento (map_model_year); membros só leem.

-- Tipos

create type public.powertrain as enum ('ice', 'hybrid', 'phev', 'ev');

create type public.aspiration as enum ('natural', 'turbo', 'supercharged');

create type public.transmission_type as enum ('manual', 'automatic', 'cvt', 'dct', 'amt');

create type public.final_drive as enum ('chain', 'belt', 'shaft', 'gear');

create type public.body_type as enum (
  'hatch', 'sedan', 'suv', 'pickup', 'van',
  'moto_street', 'moto_naked', 'moto_sport', 'moto_trail', 'moto_scooter', 'moto_custom'
);

create type public.mapping_status as enum ('pending', 'mapped', 'failed');

-- engines

create table public.engines (
  id bigint generated always as identity primary key,
  slug text not null unique,
  manufacturer text not null,
  code text,
  displacement_cc integer check (displacement_cc between 50 and 10000),
  cylinders smallint check (cylinders between 1 and 16),
  aspiration public.aspiration,
  fuel public.fuel_type not null,
  powertrain public.powertrain not null,
  -- Elétrico não tem motor a combustão; os demais têm cilindrada, cilindros e aspiração.
  constraint engines_combustion_check check (
    case when powertrain = 'ev'
      then displacement_cc is null and cylinders is null and aspiration is null
      else displacement_cc is not null and cylinders is not null and aspiration is not null
    end
  ),
  -- "Híbrido" descreve a versão FIPE, não o combustível do motor.
  constraint engines_fuel_check check (fuel <> 'hybrid' and (powertrain = 'ev') = (fuel = 'electric'))
);

comment on table public.engines is 'Motores, reaproveitados entre perfis. Casados pelo slug.';
comment on column public.engines.slug is 'Chave do motor: fabricante + código + cilindrada + aspiração + motorização. Do combustível, só o diesel entra.';
comment on column public.engines.code is 'Código do fabricante (ex: "EA211"). Nulo quando desconhecido.';

alter table public.engines enable row level security;

create policy "Membro lê os motores"
  on public.engines for select
  to authenticated
  using ((select private.is_member()));

grant select on public.engines to authenticated;
grant select, insert, update, delete on public.engines to service_role;

-- transmissions

create table public.transmissions (
  id bigint generated always as identity primary key,
  slug text not null unique,
  type public.transmission_type not null,
  code text,
  gears smallint check (gears between 1 and 12),
  final_drive public.final_drive,
  -- CVT não tem marchas fixas; os demais tipos têm.
  constraint transmissions_cvt_gears_check check ((type = 'cvt') = (gears is null))
);

comment on table public.transmissions is 'Câmbios, reaproveitados entre perfis e entre marcas quando o código é o mesmo.';
comment on column public.transmissions.slug is 'Chave do câmbio: tipo + código; sem código, marca + tipo + marchas. Em motos, mais a transmissão final.';
comment on column public.transmissions.code is 'Código do câmbio (ex: "DQ200", "DPS6"). Nulo quando desconhecido.';
comment on column public.transmissions.final_drive is 'Transmissão final. Apenas motos.';

alter table public.transmissions enable row level security;

create policy "Membro lê os câmbios"
  on public.transmissions for select
  to authenticated
  using ((select private.is_member()));

grant select on public.transmissions to authenticated;
grant select, insert, update, delete on public.transmissions to service_role;

-- tech_profiles

create table public.tech_profiles (
  id bigint generated always as identity primary key,
  normalized_key text not null unique,
  vehicle_type public.vehicle_type not null,
  body_type public.body_type not null,
  brand_name text not null,
  family text not null,
  generation text not null,
  year_start smallint not null check (year_start between 1900 and 2100),
  year_end smallint check (year_end between 1900 and 2100),
  engine_id bigint not null references public.engines (id),
  transmission_id bigint not null references public.transmissions (id),
  created_at timestamptz not null default now(),
  constraint tech_profiles_years_check check (year_end >= year_start),
  constraint tech_profiles_body_type_check check (
    (vehicle_type = 'motorcycle')
    = (body_type in ('moto_street', 'moto_naked', 'moto_sport', 'moto_trail', 'moto_scooter', 'moto_custom'))
  )
);

comment on table public.tech_profiles is 'Perfil técnico: unidade de conteúdo e cache. Várias versões FIPE apontam para o mesmo perfil.';
comment on column public.tech_profiles.normalized_key is 'Tipo + marca + família + geração + slug do motor + slug do câmbio. Perfil existente é reaproveitado.';
comment on column public.tech_profiles.brand_name is 'Nome da marca na FIPE.';
comment on column public.tech_profiles.generation is 'Nome curto da geração (ex: "G6", "Mk3"). Os anos ficam em year_start e year_end.';
comment on column public.tech_profiles.year_end is 'Último ano-modelo da geração. Nulo: ainda em produção.';
comment on column public.tech_profiles.body_type is 'Carroceria. Define o template SVG do Raio-X.';

create index tech_profiles_engine_id_idx on public.tech_profiles (engine_id);
create index tech_profiles_transmission_id_idx on public.tech_profiles (transmission_id);

alter table public.tech_profiles enable row level security;

create policy "Membro lê os perfis técnicos"
  on public.tech_profiles for select
  to authenticated
  using ((select private.is_member()));

grant select on public.tech_profiles to authenticated;
grant select, insert, update, delete on public.tech_profiles to service_role;

-- fipe_model_years: cada versão FIPE aponta para um perfil depois do mapeamento

alter table public.fipe_model_years
  add column tech_profile_id bigint references public.tech_profiles (id),
  add column mapping_status public.mapping_status not null default 'pending',
  add constraint fipe_model_years_mapping_check check ((mapping_status = 'mapped') = (tech_profile_id is not null));

comment on column public.fipe_model_years.tech_profile_id is 'Perfil técnico da versão. Preenchido pelo mapeamento.';
comment on column public.fipe_model_years.mapping_status is 'Situação do mapeamento para o perfil técnico.';

create index fipe_model_years_tech_profile_id_idx on public.fipe_model_years (tech_profile_id);

-- map_model_year: grava o resultado de um mapeamento numa única transação.
-- Motor, câmbio e perfil são reaproveitados pela chave quando já existem (o primeiro a gravar vence);
-- tipo de veículo e marca vêm da própria versão FIPE, para o perfil não divergir dela.

create function public.map_model_year(
  p_model_year_id bigint,
  p_engine jsonb,
  p_transmission jsonb,
  p_profile jsonb
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_vehicle_type public.vehicle_type;
  v_brand_name text;
  v_engine_id bigint;
  v_transmission_id bigint;
  v_profile_id bigint;
begin
  select b.vehicle_type, b.name
  into v_vehicle_type, v_brand_name
  from public.fipe_model_years y
  join public.fipe_models m on m.id = y.model_id
  join public.fipe_brands b on b.id = m.brand_id
  where y.id = p_model_year_id;

  if not found then
    raise exception 'Versão FIPE % não encontrada', p_model_year_id using errcode = 'no_data_found';
  end if;

  insert into public.engines (slug, manufacturer, code, displacement_cc, cylinders, aspiration, fuel, powertrain)
  select slug, manufacturer, code, displacement_cc, cylinders, aspiration, fuel, powertrain
  from jsonb_populate_record(null::public.engines, p_engine)
  on conflict (slug) do nothing;

  select id into strict v_engine_id from public.engines where slug = p_engine ->> 'slug';

  insert into public.transmissions (slug, type, code, gears, final_drive)
  select slug, type, code, gears, final_drive
  from jsonb_populate_record(null::public.transmissions, p_transmission)
  on conflict (slug) do nothing;

  select id into strict v_transmission_id from public.transmissions where slug = p_transmission ->> 'slug';

  insert into public.tech_profiles (
    normalized_key, vehicle_type, body_type, brand_name, family, generation,
    year_start, year_end, engine_id, transmission_id
  )
  select
    normalized_key, v_vehicle_type, body_type, v_brand_name, family, generation,
    year_start, year_end, v_engine_id, v_transmission_id
  from jsonb_populate_record(null::public.tech_profiles, p_profile)
  on conflict (normalized_key) do nothing;

  select id into strict v_profile_id from public.tech_profiles where normalized_key = p_profile ->> 'normalized_key';

  update public.fipe_model_years
  set tech_profile_id = v_profile_id, mapping_status = 'mapped'
  where id = p_model_year_id;

  return v_profile_id;
end;
$$;

comment on function public.map_model_year(bigint, jsonb, jsonb, jsonb) is
  'Liga uma versão FIPE ao perfil técnico, criando motor, câmbio e perfil se ainda não existirem. Devolve o id do perfil.';

-- Só o servidor mapeia. O Supabase concede execute a anon e authenticated por padrão em funções do public.
revoke execute on function public.map_model_year(bigint, jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.map_model_year(bigint, jsonb, jsonb, jsonb) to service_role;
