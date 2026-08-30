-- Krenora Lead Intelligence Platform · Initial schema
-- All application records are user-scoped in V1 and protected with RLS.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  normalized_name text not null,
  category text,
  subcategory text,
  country text,
  city text,
  district text,
  address text,
  latitude double precision,
  longitude double precision,
  phone text,
  email text,
  website text,
  google_place_id text,
  google_rating numeric(2,1) check (google_rating between 0 and 5),
  google_review_count integer check (google_review_count is null or google_review_count >= 0),
  status text not null default 'new' check (status in ('new','qualified','reviewing','contacted','interested','proposal','won','lost','not_relevant')),
  discovered_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, google_place_id)
);

create index organizations_user_score_filters_idx on public.organizations (user_id, status, country, city, district, category);
create index organizations_user_rating_idx on public.organizations (user_id, google_rating desc, google_review_count desc);
create index organizations_normalized_name_idx on public.organizations (user_id, normalized_name);

create table public.source_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null,
  external_id text,
  raw_data jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, source, external_id)
);

create table public.organization_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_record_id uuid not null references public.source_records(id) on delete cascade,
  match_confidence numeric(4,3) check (match_confidence between 0 and 1),
  match_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, source_record_id)
);

create table public.website_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  url text not null,
  http_status integer,
  https_enabled boolean,
  title text,
  meta_description text,
  h1_count integer,
  h2_count integer,
  canonical_url text,
  robots_found boolean,
  sitemap_found boolean,
  schema_found boolean,
  local_business_schema boolean,
  ga4_detected boolean,
  gtm_detected boolean,
  meta_pixel_detected boolean,
  tiktok_pixel_detected boolean,
  linkedin_tag_detected boolean,
  whatsapp_detected boolean,
  phone_cta_detected boolean,
  form_detected boolean,
  email_cta_detected boolean,
  cms text,
  performance_score integer check (performance_score between 0 and 100),
  seo_score integer check (seo_score between 0 and 100),
  accessibility_score integer check (accessibility_score between 0 and 100),
  best_practices_score integer check (best_practices_score between 0 and 100),
  scan_status text not null default 'pending' check (scan_status in ('pending','running','completed','failed')),
  content_fingerprint text,
  error_message text,
  scanned_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index website_scans_org_latest_idx on public.website_scans (organization_id, scanned_at desc nulls last);

create table public.technology_detections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  website_scan_id uuid not null references public.website_scans(id) on delete cascade,
  technology text not null,
  category text,
  confidence numeric(4,3) check (confidence between 0 and 1),
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.digital_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  website_scan_id uuid references public.website_scans(id) on delete set null,
  signal_key text not null,
  signal_value jsonb not null,
  observed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.score_configs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  version text not null,
  config jsonb not null,
  is_active boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, version)
);

create unique index score_configs_one_active_per_user_idx on public.score_configs(user_id) where is_active;

create table public.lead_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  business_strength_score integer not null check (business_strength_score between 0 and 30),
  digital_opportunity_score integer not null check (digital_opportunity_score between 0 and 30),
  commercial_potential_score integer not null check (commercial_potential_score between 0 and 25),
  contactability_score integer not null check (contactability_score between 0 and 15),
  total_score integer not null check (total_score between 0 and 100),
  score_version text not null,
  score_input jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index lead_scores_org_latest_idx on public.lead_scores (organization_id, created_at desc);
create index lead_scores_user_total_idx on public.lead_scores (user_id, total_score desc);

create table public.ai_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  website_scan_id uuid references public.website_scans(id) on delete set null,
  lead_score_id uuid references public.lead_scores(id) on delete set null,
  model text not null,
  prompt_version text not null,
  input_fingerprint text not null,
  summary text not null,
  strengths jsonb not null default '[]'::jsonb,
  weaknesses jsonb not null default '[]'::jsonb,
  recommended_services jsonb not null default '[]'::jsonb,
  sales_angle text,
  confidence numeric(4,3) check (confidence between 0 and 1),
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, input_fingerprint, prompt_version)
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text,
  role text,
  email text,
  phone text,
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  activity_type text not null check (activity_type in ('note','call','email','meeting','status_change')),
  content text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.search_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null,
  country text not null,
  city text not null,
  district text,
  category text not null,
  filters jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','running','completed','failed')),
  records_found integer not null default 0,
  records_created integer not null default 0,
  records_updated integer not null default 0,
  duplicates_found integer not null default 0,
  progress integer not null default 0 check (progress between 0 and 100),
  attempt_count integer not null default 0,
  error_message text,
  available_at timestamptz not null default timezone('utc', now()),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index search_jobs_claim_idx on public.search_jobs (status, available_at, created_at);

create table public.crawl_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','running','completed','failed')),
  attempt_count integer not null default 0,
  max_attempts integer not null default 3,
  error_message text,
  available_at timestamptz not null default timezone('utc', now()),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index crawl_jobs_claim_idx on public.crawl_jobs (status, available_at, created_at);

create table public.analysis_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  analysis_type text not null check (analysis_type in ('pagespeed','lead_scoring','ai_analysis','rescan')),
  status text not null default 'pending' check (status in ('pending','running','completed','failed')),
  attempt_count integer not null default 0,
  max_attempts integer not null default 3,
  input_fingerprint text,
  error_message text,
  available_at timestamptz not null default timezone('utc', now()),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index analysis_jobs_claim_idx on public.analysis_jobs (status, available_at, created_at);

create or replace function public.claim_next_search_job()
returns setof public.search_jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed public.search_jobs%rowtype;
begin
  select * into claimed
  from public.search_jobs
  where status = 'pending'
    and available_at <= timezone('utc', now())
    and attempt_count < 3
  order by created_at
  for update skip locked
  limit 1;

  if not found then
    return;
  end if;

  update public.search_jobs
  set status = 'running',
      attempt_count = attempt_count + 1,
      started_at = timezone('utc', now()),
      error_message = null,
      updated_at = timezone('utc', now())
  where id = claimed.id
  returning * into claimed;

  return next claimed;
end;
$$;

revoke all on function public.claim_next_search_job() from public, anon, authenticated;
grant execute on function public.claim_next_search_job() to service_role;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url');

  insert into public.score_configs (user_id, version, config, is_active)
  values (
    new.id,
    'v1.0.0',
    jsonb_build_object(
      'businessStrengthMax', 30,
      'digitalOpportunityMax', 30,
      'commercialPotentialMax', 25,
      'contactabilityMax', 15,
      'rules', jsonb_build_object(
        'rating47', 10,
        'rating43', 7,
        'reviews200', 10,
        'reviews100', 8,
        'reviews30', 5,
        'poorPerformance', 5,
        'metaPixelNotDetected', 3,
        'gtmNotDetected', 2,
        'weakConversionCta', 3
      )
    ),
    true
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger organizations_updated_at before update on public.organizations for each row execute procedure public.set_updated_at();
create trigger contacts_updated_at before update on public.contacts for each row execute procedure public.set_updated_at();
create trigger search_jobs_updated_at before update on public.search_jobs for each row execute procedure public.set_updated_at();
create trigger crawl_jobs_updated_at before update on public.crawl_jobs for each row execute procedure public.set_updated_at();
create trigger analysis_jobs_updated_at before update on public.analysis_jobs for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.source_records enable row level security;
alter table public.organization_sources enable row level security;
alter table public.website_scans enable row level security;
alter table public.technology_detections enable row level security;
alter table public.digital_signals enable row level security;
alter table public.score_configs enable row level security;
alter table public.lead_scores enable row level security;
alter table public.ai_analyses enable row level security;
alter table public.contacts enable row level security;
alter table public.activities enable row level security;
alter table public.search_jobs enable row level security;
alter table public.crawl_jobs enable row level security;
alter table public.analysis_jobs enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "organizations_own_rows" on public.organizations for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "source_records_own_rows" on public.source_records for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "organization_sources_own_rows" on public.organization_sources for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "website_scans_own_rows" on public.website_scans for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "technology_detections_own_rows" on public.technology_detections for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "digital_signals_own_rows" on public.digital_signals for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "score_configs_own_rows" on public.score_configs for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "lead_scores_own_rows" on public.lead_scores for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "ai_analyses_own_rows" on public.ai_analyses for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "contacts_own_rows" on public.contacts for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "activities_own_rows" on public.activities for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "search_jobs_own_rows" on public.search_jobs for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "crawl_jobs_own_rows" on public.crawl_jobs for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "analysis_jobs_own_rows" on public.analysis_jobs for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

comment on table public.source_records is 'Immutable source payloads retained for provenance and future entity-resolution reprocessing.';
comment on table public.lead_scores is 'Versioned deterministic scores. AI analyses must not mutate these values.';
comment on column public.website_scans.meta_pixel_detected is 'Observed technical detection only; false does not prove that the organization does not advertise.';
