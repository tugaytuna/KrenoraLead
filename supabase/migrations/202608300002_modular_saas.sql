-- Krenora modular SaaS tenancy, vertical classification and usage metering.
-- Compatibility strategy: keep legacy user_id columns while workspace_id becomes the tenant boundary.

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','member','viewer')),
  status text not null default 'active' check (status in ('active','invited','suspended')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, user_id)
);

create table public.workspace_verticals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  vertical_key text not null,
  vertical_version text not null,
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, vertical_key)
);

create table public.workspace_subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
  plan_key text not null default 'starter',
  status text not null default 'active' check (status in ('active','trialing','past_due','canceled')),
  entitlements jsonb not null default '{"discovery_jobs_monthly":100,"provider_requests_monthly":500}'::jsonb,
  current_period_start timestamptz not null default date_trunc('month', timezone('utc', now())),
  current_period_end timestamptz not null default date_trunc('month', timezone('utc', now())) + interval '1 month',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  search_job_id uuid references public.search_jobs(id) on delete set null,
  vertical_key text,
  source text,
  meter text not null check (meter in ('discovery_job','provider_request','raw_record','organization_write','website_scan','pagespeed_request','ai_analysis')),
  quantity integer not null default 1 check (quantity > 0),
  outcome text not null default 'succeeded' check (outcome in ('reserved','succeeded','failed','released')),
  idempotency_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index usage_events_idempotency_idx on public.usage_events (workspace_id, idempotency_key) where idempotency_key is not null;
create index usage_events_meter_period_idx on public.usage_events (workspace_id, meter, created_at);

create table public.organization_verticals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  vertical_key text not null,
  vertical_version text not null,
  decision text not null check (decision in ('qualified','review','excluded')),
  reason_codes jsonb not null default '[]'::jsonb,
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, organization_id, vertical_key)
);

-- Create a deterministic personal workspace for every existing account.
insert into public.workspaces (id, name, slug, created_by)
select id, coalesce(nullif(full_name, ''), 'Kişisel Çalışma Alanı'), 'personal-' || replace(id::text, '-', ''), id
from public.profiles
on conflict (id) do nothing;

insert into public.workspace_members (workspace_id, user_id, role)
select id, id, 'owner' from public.profiles
on conflict (workspace_id, user_id) do nothing;

insert into public.workspace_verticals (workspace_id, vertical_key, vertical_version)
select id, 'kindergarten', '1.0.0' from public.workspaces
on conflict (workspace_id, vertical_key) do nothing;

insert into public.workspace_subscriptions (workspace_id)
select id from public.workspaces
on conflict (workspace_id) do nothing;

alter table public.organizations add column workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.source_records add column workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.organization_sources add column workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.website_scans add column workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.technology_detections add column workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.digital_signals add column workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.score_configs add column workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.lead_scores add column workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.ai_analyses add column workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.contacts add column workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.activities add column workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.search_jobs add column workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.crawl_jobs add column workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.analysis_jobs add column workspace_id uuid references public.workspaces(id) on delete cascade;

update public.organizations set workspace_id = user_id where workspace_id is null;
update public.source_records set workspace_id = user_id where workspace_id is null;
update public.organization_sources set workspace_id = user_id where workspace_id is null;
update public.website_scans set workspace_id = user_id where workspace_id is null;
update public.technology_detections set workspace_id = user_id where workspace_id is null;
update public.digital_signals set workspace_id = user_id where workspace_id is null;
update public.score_configs set workspace_id = user_id where workspace_id is null;
update public.lead_scores set workspace_id = user_id where workspace_id is null;
update public.ai_analyses set workspace_id = user_id where workspace_id is null;
update public.contacts set workspace_id = user_id where workspace_id is null;
update public.activities set workspace_id = user_id where workspace_id is null;
update public.search_jobs set workspace_id = user_id where workspace_id is null;
update public.crawl_jobs set workspace_id = user_id where workspace_id is null;
update public.analysis_jobs set workspace_id = user_id where workspace_id is null;

alter table public.organizations alter column workspace_id set not null;
alter table public.source_records alter column workspace_id set not null;
alter table public.organization_sources alter column workspace_id set not null;
alter table public.website_scans alter column workspace_id set not null;
alter table public.technology_detections alter column workspace_id set not null;
alter table public.digital_signals alter column workspace_id set not null;
alter table public.score_configs alter column workspace_id set not null;
alter table public.lead_scores alter column workspace_id set not null;
alter table public.ai_analyses alter column workspace_id set not null;
alter table public.contacts alter column workspace_id set not null;
alter table public.activities alter column workspace_id set not null;
alter table public.search_jobs alter column workspace_id set not null;
alter table public.crawl_jobs alter column workspace_id set not null;
alter table public.analysis_jobs alter column workspace_id set not null;

alter table public.search_jobs
  add column requested_by uuid references auth.users(id) on delete set null,
  add column vertical_key text,
  add column vertical_version text,
  add column input jsonb not null default '{}'::jsonb,
  add column module_snapshot jsonb not null default '{}'::jsonb,
  add column idempotency_key text,
  add column intents_attempted integer not null default 0,
  add column intents_succeeded integer not null default 0,
  add column intents_failed integer not null default 0,
  add column qualified_count integer not null default 0,
  add column review_count integer not null default 0,
  add column excluded_count integer not null default 0,
  add column provider_request_count integer not null default 0;

update public.search_jobs
set requested_by = user_id,
    vertical_key = coalesce(filters ->> 'verticalKey', 'kindergarten'),
    vertical_version = coalesce(filters ->> 'verticalVersion', '1.0.0'),
    input = jsonb_build_object(
      'country', country, 'city', city, 'district', district, 'category', category,
      'minimumRating', filters -> 'minimumRating', 'minimumReviews', filters -> 'minimumReviews',
      'languageCode', coalesce(filters ->> 'languageCode', 'tr')
    );

alter table public.search_jobs alter column vertical_key set not null;
alter table public.search_jobs alter column vertical_version set not null;
create unique index search_jobs_workspace_idempotency_idx on public.search_jobs (workspace_id, idempotency_key) where idempotency_key is not null;
create unique index organizations_workspace_place_idx on public.organizations (workspace_id, google_place_id);
create unique index source_records_workspace_external_idx on public.source_records (workspace_id, source, external_id);
alter table public.score_configs drop constraint if exists score_configs_user_id_version_key;
drop index if exists public.score_configs_one_active_per_user_idx;
create unique index score_configs_workspace_version_idx on public.score_configs (workspace_id, version);
create unique index score_configs_one_active_per_workspace_idx on public.score_configs (workspace_id) where is_active;

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = (select auth.uid())
      and status = 'active'
  );
$$;

revoke all on function public.is_workspace_member(uuid) from public, anon;
grant execute on function public.is_workspace_member(uuid) to authenticated, service_role;

create or replace function public.can_write_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = (select auth.uid())
      and status = 'active'
      and role in ('owner','admin','member')
  );
$$;

revoke all on function public.can_write_workspace(uuid) from public, anon;
grant execute on function public.can_write_workspace(uuid) to authenticated, service_role;

create or replace function public.can_admin_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = (select auth.uid())
      and status = 'active'
      and role in ('owner','admin')
  );
$$;

revoke all on function public.can_admin_workspace(uuid) from public, anon;
grant execute on function public.can_admin_workspace(uuid) to authenticated, service_role;

create or replace function public.reserve_workspace_usage(
  target_workspace_id uuid,
  target_requested_by uuid,
  target_meter text,
  target_quantity integer,
  target_idempotency_key text,
  target_vertical_key text default null,
  target_source text default null,
  target_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_id uuid;
  entitlement_key text;
  allowed_quantity integer;
  used_quantity bigint;
  period_start timestamptz;
  period_end timestamptz;
  event_id uuid;
begin
  if target_quantity <= 0 then raise exception 'quantity must be positive'; end if;
  if (select auth.role()) <> 'service_role' and not public.is_workspace_member(target_workspace_id) then
    raise exception 'workspace access denied';
  end if;

  select id into existing_id from public.usage_events
  where workspace_id = target_workspace_id and idempotency_key = target_idempotency_key;
  if existing_id is not null then return existing_id; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target_workspace_id::text || ':' || target_meter, 0));
  entitlement_key := case target_meter
    when 'discovery_job' then 'discovery_jobs_monthly'
    when 'provider_request' then 'provider_requests_monthly'
    else null
  end;
  if entitlement_key is null then raise exception 'unsupported metered usage'; end if;

  select (entitlements ->> entitlement_key)::integer, current_period_start, current_period_end
  into allowed_quantity, period_start, period_end
  from public.workspace_subscriptions
  where workspace_id = target_workspace_id and status in ('active','trialing');
  if allowed_quantity is null then return null; end if;

  select coalesce(sum(quantity), 0) into used_quantity
  from public.usage_events
  where workspace_id = target_workspace_id
    and meter = target_meter
    and outcome in ('reserved','succeeded','failed')
    and created_at >= period_start and created_at < period_end;
  if used_quantity + target_quantity > allowed_quantity then return null; end if;

  insert into public.usage_events (
    workspace_id, requested_by, vertical_key, source, meter, quantity, outcome, idempotency_key, metadata
  ) values (
    target_workspace_id, coalesce(target_requested_by, (select auth.uid())), target_vertical_key,
    target_source, target_meter, target_quantity, 'reserved', target_idempotency_key, target_metadata
  ) returning id into event_id;
  return event_id;
end;
$$;

create or replace function public.settle_workspace_usage(
  target_idempotency_key text,
  target_outcome text,
  target_quantity integer default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare target_workspace_id uuid;
begin
  if target_outcome not in ('succeeded','failed','released') then raise exception 'invalid outcome'; end if;
  select workspace_id into target_workspace_id from public.usage_events where idempotency_key = target_idempotency_key;
  if target_workspace_id is null then return; end if;
  if (select auth.role()) <> 'service_role' and not public.is_workspace_member(target_workspace_id) then
    raise exception 'workspace access denied';
  end if;
  update public.usage_events
  set outcome = target_outcome,
      quantity = case when target_quantity is null then quantity else greatest(target_quantity, 1) end
  where idempotency_key = target_idempotency_key;
end;
$$;

revoke all on function public.reserve_workspace_usage(uuid,uuid,text,integer,text,text,text,jsonb) from public, anon;
revoke all on function public.settle_workspace_usage(text,text,integer) from public, anon;
grant execute on function public.reserve_workspace_usage(uuid,uuid,text,integer,text,text,text,jsonb) to authenticated, service_role;
grant execute on function public.settle_workspace_usage(text,text,integer) to authenticated, service_role;

-- Replace user ownership policies with workspace membership policies.
drop policy if exists "organizations_own_rows" on public.organizations;
drop policy if exists "source_records_own_rows" on public.source_records;
drop policy if exists "organization_sources_own_rows" on public.organization_sources;
drop policy if exists "website_scans_own_rows" on public.website_scans;
drop policy if exists "technology_detections_own_rows" on public.technology_detections;
drop policy if exists "digital_signals_own_rows" on public.digital_signals;
drop policy if exists "score_configs_own_rows" on public.score_configs;
drop policy if exists "lead_scores_own_rows" on public.lead_scores;
drop policy if exists "ai_analyses_own_rows" on public.ai_analyses;
drop policy if exists "contacts_own_rows" on public.contacts;
drop policy if exists "activities_own_rows" on public.activities;
drop policy if exists "search_jobs_own_rows" on public.search_jobs;
drop policy if exists "crawl_jobs_own_rows" on public.crawl_jobs;
drop policy if exists "analysis_jobs_own_rows" on public.analysis_jobs;

create policy "organizations_workspace_select" on public.organizations for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "organizations_workspace_write" on public.organizations for all to authenticated using (public.can_write_workspace(workspace_id)) with check (public.can_write_workspace(workspace_id));
create policy "source_records_workspace_select" on public.source_records for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "source_records_workspace_write" on public.source_records for all to authenticated using (public.can_write_workspace(workspace_id)) with check (public.can_write_workspace(workspace_id));
create policy "organization_sources_workspace_select" on public.organization_sources for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "organization_sources_workspace_write" on public.organization_sources for all to authenticated using (public.can_write_workspace(workspace_id)) with check (public.can_write_workspace(workspace_id));
create policy "website_scans_workspace_select" on public.website_scans for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "website_scans_workspace_write" on public.website_scans for all to authenticated using (public.can_write_workspace(workspace_id)) with check (public.can_write_workspace(workspace_id));
create policy "technology_detections_workspace_select" on public.technology_detections for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "technology_detections_workspace_write" on public.technology_detections for all to authenticated using (public.can_write_workspace(workspace_id)) with check (public.can_write_workspace(workspace_id));
create policy "digital_signals_workspace_select" on public.digital_signals for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "digital_signals_workspace_write" on public.digital_signals for all to authenticated using (public.can_write_workspace(workspace_id)) with check (public.can_write_workspace(workspace_id));
create policy "score_configs_workspace_select" on public.score_configs for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "score_configs_workspace_write" on public.score_configs for all to authenticated using (public.can_write_workspace(workspace_id)) with check (public.can_write_workspace(workspace_id));
create policy "lead_scores_workspace_select" on public.lead_scores for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "lead_scores_workspace_write" on public.lead_scores for all to authenticated using (public.can_write_workspace(workspace_id)) with check (public.can_write_workspace(workspace_id));
create policy "ai_analyses_workspace_select" on public.ai_analyses for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "ai_analyses_workspace_write" on public.ai_analyses for all to authenticated using (public.can_write_workspace(workspace_id)) with check (public.can_write_workspace(workspace_id));
create policy "contacts_workspace_select" on public.contacts for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "contacts_workspace_write" on public.contacts for all to authenticated using (public.can_write_workspace(workspace_id)) with check (public.can_write_workspace(workspace_id));
create policy "activities_workspace_select" on public.activities for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "activities_workspace_write" on public.activities for all to authenticated using (public.can_write_workspace(workspace_id)) with check (public.can_write_workspace(workspace_id));
create policy "search_jobs_workspace_select" on public.search_jobs for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "search_jobs_workspace_write" on public.search_jobs for all to authenticated using (public.can_write_workspace(workspace_id)) with check (public.can_write_workspace(workspace_id));
create policy "crawl_jobs_workspace_select" on public.crawl_jobs for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "crawl_jobs_workspace_write" on public.crawl_jobs for all to authenticated using (public.can_write_workspace(workspace_id)) with check (public.can_write_workspace(workspace_id));
create policy "analysis_jobs_workspace_select" on public.analysis_jobs for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "analysis_jobs_workspace_write" on public.analysis_jobs for all to authenticated using (public.can_write_workspace(workspace_id)) with check (public.can_write_workspace(workspace_id));

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_verticals enable row level security;
alter table public.workspace_subscriptions enable row level security;
alter table public.usage_events enable row level security;
alter table public.organization_verticals enable row level security;

create policy "workspaces_member_select" on public.workspaces for select to authenticated using (public.is_workspace_member(id));
create policy "workspaces_admin_update" on public.workspaces for update to authenticated using (public.can_admin_workspace(id)) with check (public.can_admin_workspace(id));
create policy "workspace_members_member_select" on public.workspace_members for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "workspace_verticals_member_select" on public.workspace_verticals for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "workspace_verticals_admin_write" on public.workspace_verticals for all to authenticated using (public.can_admin_workspace(workspace_id)) with check (public.can_admin_workspace(workspace_id));
create policy "workspace_subscriptions_member_select" on public.workspace_subscriptions for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "usage_events_member_select" on public.usage_events for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "organization_verticals_member_select" on public.organization_verticals for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "organization_verticals_member_write" on public.organization_verticals for all to authenticated using (public.can_write_workspace(workspace_id)) with check (public.can_write_workspace(workspace_id));

create trigger workspaces_updated_at before update on public.workspaces for each row execute procedure public.set_updated_at();
create trigger workspace_members_updated_at before update on public.workspace_members for each row execute procedure public.set_updated_at();
create trigger workspace_verticals_updated_at before update on public.workspace_verticals for each row execute procedure public.set_updated_at();
create trigger workspace_subscriptions_updated_at before update on public.workspace_subscriptions for each row execute procedure public.set_updated_at();
create trigger organization_verticals_updated_at before update on public.organization_verticals for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url');

  insert into public.workspaces (id, name, slug, created_by)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'Kişisel Çalışma Alanı'), 'personal-' || replace(new.id::text, '-', ''), new.id);

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.id, 'owner');

  insert into public.workspace_verticals (workspace_id, vertical_key, vertical_version)
  values (new.id, 'kindergarten', '1.0.0');

  insert into public.workspace_subscriptions (workspace_id)
  values (new.id);

  insert into public.score_configs (user_id, workspace_id, version, config, is_active)
  values (
    new.id,
    new.id,
    'v1.0.0',
    jsonb_build_object(
      'businessStrengthMax', 30, 'digitalOpportunityMax', 30,
      'commercialPotentialMax', 25, 'contactabilityMax', 15,
      'rules', jsonb_build_object('rating47', 10, 'rating43', 7, 'reviews200', 10, 'reviews100', 8, 'reviews30', 5, 'poorPerformance', 5, 'metaPixelNotDetected', 3, 'gtmNotDetected', 2, 'weakConversionCta', 3)
    ),
    true
  );
  return new;
end;
$$;

comment on table public.workspace_verticals is 'Enabled, version-pinned vertical modules for a SaaS workspace.';
comment on table public.usage_events is 'Append-only tenant-attributed usage ledger; billing provider independent.';
comment on column public.search_jobs.module_snapshot is 'Immutable safe module configuration used to reproduce a discovery run.';
