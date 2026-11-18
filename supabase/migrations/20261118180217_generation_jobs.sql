-- Jobs de geração da IA: um registro por mapeamento ou seção gerada, com trava contra geração
-- duplicada e contagem do limite diário por usuário (ADR-0005).
-- Contexto: docs/DATABASE.md (seção 4). O servidor cria e atualiza; cada membro lê os próprios jobs.

-- Tipos

create type public.job_type as enum ('map_profile', 'generate_section');

create type public.job_status as enum ('pending', 'running', 'succeeded', 'failed');

create type public.section_type as enum ('specs', 'chronic_issues', 'maintenance_plan', 'pre_purchase');

-- generation_jobs

create table public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type public.job_type not null,
  fipe_model_year_id bigint references public.fipe_model_years (id),
  tech_profile_id bigint references public.tech_profiles (id),
  section public.section_type,
  status public.job_status not null default 'pending',
  attempts smallint not null default 0 check (attempts between 0 and 2),
  error text,
  usage jsonb,
  requested_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  -- O mapeamento parte de uma versão FIPE; a geração de seção, de um perfil e de uma seção.
  constraint generation_jobs_target_check check (
    case job_type
      when 'map_profile' then fipe_model_year_id is not null and tech_profile_id is null and section is null
      else fipe_model_year_id is null and tech_profile_id is not null and section is not null
    end
  )
);

comment on table public.generation_jobs is 'Jobs de geração da IA. Também servem de auditoria e de registro do consumo de tokens.';
comment on column public.generation_jobs.attempts is 'Tentativas já feitas. No máximo 2 por job.';
comment on column public.generation_jobs.error is 'Mensagem técnica da falha, sem dados sensíveis.';
comment on column public.generation_jobs.usage is 'Consumo por etapa da IA: modelo, versão do prompt e tokens de entrada e saída.';

-- Trava: no máximo um job ativo por perfil + seção e, no mapeamento, por versão FIPE.
-- Quem chega depois recebe o job já existente.
create unique index generation_jobs_active_section_idx
  on public.generation_jobs (tech_profile_id, section)
  where status in ('pending', 'running');

create unique index generation_jobs_active_mapping_idx
  on public.generation_jobs (fipe_model_year_id)
  where job_type = 'map_profile' and status in ('pending', 'running');

-- Limite diário: jobs de um usuário nas últimas 24 horas.
create index generation_jobs_requested_by_created_at_idx on public.generation_jobs (requested_by, created_at);

create index generation_jobs_fipe_model_year_id_idx on public.generation_jobs (fipe_model_year_id);
create index generation_jobs_tech_profile_id_idx on public.generation_jobs (tech_profile_id);

alter table public.generation_jobs enable row level security;

-- Ler os próprios jobs é o que deixa o membro acompanhar o job pelo Realtime.
create policy "Membro lê os próprios jobs"
  on public.generation_jobs for select
  to authenticated
  using (requested_by = (select auth.uid()) and (select private.is_member()));

grant select on public.generation_jobs to authenticated;
grant select, insert, update, delete on public.generation_jobs to service_role;

-- Realtime: o front recebe as mudanças de status do job.
alter publication supabase_realtime add table public.generation_jobs;
