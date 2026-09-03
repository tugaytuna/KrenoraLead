/* Superseded draft kept commented because the synchronized drive locked this file against replacement.
create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_memberships (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  normalized_name text,
  category text,
  address text,
  normalized_address text,
  country text,
  city text,
  district text,
  latitude double precision,
  longitude double precision,
  phone text,
  normalized_phone text,
  email text,
  normalized_email text,
  website text,
  normalized_website text,
  normalized_domain text,
  rating numeric(2,1) check (rating is null or rating between 0 and 5),
  review_count integer check (review_count is null or review_count >= 0),
  status text not null default 'new' check (status in ('new', 'qualified', 'reviewing', 'contacted', 'interested', 'proposal', 'won', 'lost', 'not_relevant')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id)
);

create table if not exists public.source_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source text not null,
  external_id text,
  identity_key text not null,
  name text not null,
  normalized_name text,
  category text,
  address text,
  normalized_address text,
  country text,
  city text,
  district text,
  latitude double precision,
  longitude double precision,
  phone text,
  normalized_phone text,
  email text,
  normalized_email text,
  website text,
  normalized_website text,
  normalized_domain text,
  rating numeric(2,1) check (rating is null or rating between 0 and 5),
  review_count integer check (review_count is null or review_count >= 0),
  fetched_at timestamptz not null,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, source, identity_key),
  unique (id, workspace_id)
);

create table if not exists public.organization_sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  organization_id uuid not null,
  source_record_id uuid not null,
  match_method text[] not null default '{}',
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  created_at timestamptz not null default now(),
  unique (source_record_id),
  foreign key (organization_id, workspace_id) references public.organizations(id, workspace_id) on delete cascade,
  foreign key (source_record_id, workspace_id) references public.source_records(id, workspace_id) on delete cascade
);

create table if not exists public.entity_resolution_reviews (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_record_id uuid not null,
  candidate_organization_id uuid,
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  evidence text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (source_record_id, workspace_id) references public.source_records(id, workspace_id) on delete cascade,
  foreign key (candidate_organization_id, workspace_id) references public.organizations(id, workspace_id) on delete cascade
);

create unique index if not exists entity_resolution_reviews_pending_unique
  on public.entity_resolution_reviews(source_record_id, candidate_organization_id)
  where status = 'pending' and candidate_organization_id is not null;

create index if not exists organizations_workspace_domain_idx
  on public.organizations(workspace_id, normalized_domain)
  where normalized_domain is not null;
create index if not exists organizations_workspace_phone_idx
  on public.organizations(workspace_id, normalized_phone)
  where normalized_phone is not null;
create index if not exists organizations_workspace_email_idx
  on public.organizations(workspace_id, normalized_email)
  where normalized_email is not null;
create index if not exists organizations_workspace_name_address_idx
  on public.organizations(workspace_id, normalized_name, normalized_address);
create index if not exists source_records_workspace_external_idx
  on public.source_records(workspace_id, source, external_id)
  where external_id is not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
*/

-- Phase 3: extend the existing 20260829/20260830 schema without replacing tenancy tables.
alter table public.organizations
  add column if not exists normalized_address text,
  add column if not exists normalized_phone text,
  add column if not exists normalized_email text,
  add column if not exists normalized_website text,
  add column if not exists normalized_domain text;

update public.organizations
set normalized_phone = case when normalized_phone is null and phone like '+%' then phone else normalized_phone end,
    normalized_email = coalesce(normalized_email, lower(trim(email))),
    normalized_website = coalesce(normalized_website, website),
    normalized_domain = coalesce(
      normalized_domain,
      lower(regexp_replace(
        split_part(regexp_replace(trim(website), '^[a-zA-Z][a-zA-Z0-9+.-]*://', ''), '/', 1),
        '^www\.', '', 'i'
      ))
    )
where phone is not null or email is not null or website is not null;

alter table public.source_records
  add column if not exists identity_key text,
  add column if not exists name text,
  add column if not exists normalized_name text,
  add column if not exists category text,
  add column if not exists address text,
  add column if not exists normalized_address text,
  add column if not exists country text,
  add column if not exists city text,
  add column if not exists district text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists phone text,
  add column if not exists normalized_phone text,
  add column if not exists email text,
  add column if not exists normalized_email text,
  add column if not exists website text,
  add column if not exists normalized_website text,
  add column if not exists normalized_domain text,
  add column if not exists rating numeric(2,1),
  add column if not exists review_count integer,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

update public.source_records
set identity_key = case
  when nullif(trim(external_id), '') is not null then 'external:' || trim(external_id)
  else 'legacy:' || id::text
end
where identity_key is null;

alter table public.source_records alter column identity_key set not null;
create unique index if not exists source_records_workspace_identity_idx
  on public.source_records(workspace_id, source, identity_key);
create index if not exists organizations_workspace_domain_idx
  on public.organizations(workspace_id, normalized_domain) where normalized_domain is not null;
create index if not exists organizations_workspace_phone_idx
  on public.organizations(workspace_id, normalized_phone) where normalized_phone is not null;
create index if not exists organizations_workspace_email_idx
  on public.organizations(workspace_id, normalized_email) where normalized_email is not null;
create index if not exists organizations_workspace_name_address_idx
  on public.organizations(workspace_id, normalized_name, normalized_address);
create unique index if not exists organization_sources_one_organization_per_record_idx
  on public.organization_sources(source_record_id);
create unique index if not exists organizations_id_workspace_idx
  on public.organizations(id, workspace_id);
create unique index if not exists source_records_id_workspace_idx
  on public.source_records(id, workspace_id);
alter table public.organization_sources
  add constraint organization_sources_organization_workspace_fk
    foreign key (organization_id, workspace_id) references public.organizations(id, workspace_id) on delete cascade,
  add constraint organization_sources_record_workspace_fk
    foreign key (source_record_id, workspace_id) references public.source_records(id, workspace_id) on delete cascade;

drop trigger if exists source_records_set_updated_at on public.source_records;
create trigger source_records_set_updated_at before update on public.source_records
for each row execute function public.set_updated_at();

create table public.entity_resolution_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_record_id uuid not null references public.source_records(id) on delete cascade,
  candidate_organization_id uuid not null references public.organizations(id) on delete cascade,
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  evidence text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.entity_resolution_reviews
  add constraint entity_resolution_reviews_record_workspace_fk
    foreign key (source_record_id, workspace_id) references public.source_records(id, workspace_id) on delete cascade,
  add constraint entity_resolution_reviews_candidate_workspace_fk
    foreign key (candidate_organization_id, workspace_id) references public.organizations(id, workspace_id) on delete cascade;

create unique index entity_resolution_reviews_pending_unique
  on public.entity_resolution_reviews(source_record_id, candidate_organization_id)
  where status = 'pending';
create index entity_resolution_reviews_workspace_status_idx
  on public.entity_resolution_reviews(workspace_id, status, created_at);
create trigger entity_resolution_reviews_set_updated_at before update on public.entity_resolution_reviews
for each row execute function public.set_updated_at();

alter table public.entity_resolution_reviews enable row level security;
create policy "entity_resolution_reviews_workspace_select" on public.entity_resolution_reviews
for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "entity_resolution_reviews_workspace_write" on public.entity_resolution_reviews
for all to authenticated using (public.can_write_workspace(workspace_id)) with check (public.can_write_workspace(workspace_id));

create or replace function public.assert_workspace_access(p_workspace_id uuid, p_actor_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    ((select auth.uid()) = p_actor_user_id or (select auth.role()) = 'service_role')
    and exists (
      select 1 from public.workspace_members
      where workspace_id = p_workspace_id
        and user_id = p_actor_user_id
        and status = 'active'
        and role in ('owner','admin','member')
    );
$$;

create or replace function public.upsert_source_record(
  p_workspace_id uuid, p_actor_user_id uuid, p_source text, p_external_id text,
  p_name text, p_category text, p_address text, p_country text, p_city text,
  p_district text, p_latitude double precision, p_longitude double precision,
  p_phone text, p_email text, p_website text, p_rating numeric,
  p_review_count integer, p_fetched_at timestamptz, p_raw_data jsonb,
  p_normalized_name text, p_normalized_address text, p_normalized_phone text,
  p_normalized_email text, p_normalized_website text, p_normalized_domain text
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_record public.source_records;
  v_identity_key text;
begin
  if not public.assert_workspace_access(p_workspace_id, p_actor_user_id) then
    raise exception 'Workspace access denied';
  end if;
  v_identity_key := case
    when nullif(trim(p_external_id), '') is not null then 'external:' || trim(p_external_id)
    else 'identity:' || md5(concat_ws('|', p_normalized_name, p_normalized_address, p_normalized_phone, p_normalized_email, p_normalized_domain))
  end;
  insert into public.source_records (
    user_id, workspace_id, source, external_id, identity_key, name, normalized_name,
    category, address, normalized_address, country, city, district, latitude,
    longitude, phone, normalized_phone, email, normalized_email, website,
    normalized_website, normalized_domain, rating, review_count, fetched_at, raw_data
  ) values (
    p_actor_user_id, p_workspace_id, lower(trim(p_source)), nullif(trim(p_external_id), ''),
    v_identity_key, p_name, p_normalized_name, p_category, p_address,
    p_normalized_address, p_country, p_city, p_district, p_latitude, p_longitude,
    p_phone, p_normalized_phone, p_email, p_normalized_email, p_website,
    p_normalized_website, p_normalized_domain, p_rating, p_review_count,
    p_fetched_at, coalesce(p_raw_data, '{}'::jsonb)
  )
  on conflict (workspace_id, source, identity_key) do update set
    name = excluded.name, normalized_name = excluded.normalized_name,
    category = excluded.category, address = excluded.address,
    normalized_address = excluded.normalized_address, country = excluded.country,
    city = excluded.city, district = excluded.district, latitude = excluded.latitude,
    longitude = excluded.longitude, phone = excluded.phone,
    normalized_phone = excluded.normalized_phone, email = excluded.email,
    normalized_email = excluded.normalized_email, website = excluded.website,
    normalized_website = excluded.normalized_website,
    normalized_domain = excluded.normalized_domain, rating = excluded.rating,
    review_count = excluded.review_count, fetched_at = excluded.fetched_at,
    raw_data = excluded.raw_data
  returning * into v_record;
  return jsonb_build_object('id', v_record.id, 'workspace_id', v_record.workspace_id);
end;
$$;

create or replace function public.find_entity_resolution_candidates(
  p_workspace_id uuid, p_actor_user_id uuid, p_source text, p_external_id text,
  p_normalized_name text, p_normalized_address text, p_normalized_phone text,
  p_normalized_email text, p_normalized_domain text,
  p_latitude double precision default null, p_longitude double precision default null
)
returns table (
  organization_id uuid, source text, external_id text, name text, address text,
  phone text, email text, website text, latitude double precision, longitude double precision
)
language plpgsql
stable
set search_path = ''
as $$
begin
  if not public.assert_workspace_access(p_workspace_id, p_actor_user_id) then
    raise exception 'Workspace access denied';
  end if;
  return query
  select distinct
    organization.id, source_record.source, source_record.external_id,
    organization.name, organization.address, organization.phone,
    organization.email, organization.website, organization.latitude, organization.longitude
  from public.organizations organization
  left join public.organization_sources organization_source
    on organization_source.organization_id = organization.id
   and organization_source.workspace_id = organization.workspace_id
  left join public.source_records source_record
    on source_record.id = organization_source.source_record_id
   and source_record.workspace_id = organization.workspace_id
  where organization.workspace_id = p_workspace_id and (
    (p_external_id is not null and source_record.source = p_source and source_record.external_id = p_external_id)
    or (p_normalized_domain is not null and organization.normalized_domain = p_normalized_domain)
    or (p_normalized_phone is not null and organization.normalized_phone = p_normalized_phone)
    or (p_normalized_email is not null and organization.normalized_email = p_normalized_email)
    or (p_normalized_name is not null and p_normalized_address is not null
        and organization.normalized_name = p_normalized_name and organization.normalized_address = p_normalized_address)
    or (p_normalized_name is not null and p_latitude is not null and p_longitude is not null
        and organization.normalized_name = p_normalized_name
        and abs(organization.latitude - p_latitude) <= 0.001
        and abs(organization.longitude - p_longitude) <= 0.0015)
  );
end;
$$;

create or replace function public.apply_entity_resolution(
  p_workspace_id uuid, p_actor_user_id uuid, p_source_record_id uuid,
  p_decision text, p_candidate_organization_id uuid, p_confidence numeric,
  p_evidence text[]
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_source public.source_records;
  v_organization_id uuid;
  v_review_id uuid;
  v_lock_key text;
  v_created boolean := false;
begin
  if not public.assert_workspace_access(p_workspace_id, p_actor_user_id) then
    raise exception 'Workspace access denied';
  end if;
  if p_decision not in ('match','review','create') then
    raise exception 'Unknown entity resolution decision: %', p_decision;
  end if;
  select * into v_source from public.source_records
  where id = p_source_record_id and workspace_id = p_workspace_id;
  if not found then raise exception 'Source record not found in workspace'; end if;

  select organization_id into v_organization_id from public.organization_sources
  where source_record_id = p_source_record_id and workspace_id = p_workspace_id;
  if found then
    return jsonb_build_object('decision','match','organization_id',v_organization_id,'review_id',null);
  end if;

  if p_decision = 'review' then
    if not exists (select 1 from public.organizations where id = p_candidate_organization_id and workspace_id = p_workspace_id) then
      raise exception 'Candidate organization not found in workspace';
    end if;
    insert into public.entity_resolution_reviews (
      user_id, workspace_id, source_record_id, candidate_organization_id, confidence, evidence
    ) values (
      p_actor_user_id, p_workspace_id, p_source_record_id, p_candidate_organization_id,
      p_confidence, coalesce(p_evidence, '{}')
    ) on conflict (source_record_id, candidate_organization_id) where status = 'pending'
      do update set confidence = excluded.confidence, evidence = excluded.evidence
    returning id into v_review_id;
    return jsonb_build_object('decision','review','organization_id',null,'review_id',v_review_id);
  end if;

  if p_decision = 'match' then
    if not exists (select 1 from public.organizations where id = p_candidate_organization_id and workspace_id = p_workspace_id) then
      raise exception 'Candidate organization not found in workspace';
    end if;
    v_organization_id := p_candidate_organization_id;
  else
    v_lock_key := p_workspace_id::text || ':' || coalesce(v_source.normalized_domain, v_source.normalized_phone, v_source.source || ':' || v_source.identity_key);
    perform pg_advisory_xact_lock(hashtextextended(v_lock_key, 0));
    select id into v_organization_id from public.organizations
    where workspace_id = p_workspace_id and (
      (v_source.normalized_domain is not null and normalized_domain = v_source.normalized_domain)
      or (v_source.normalized_phone is not null and normalized_phone = v_source.normalized_phone)
    ) order by created_at limit 1;
    if not found then
      insert into public.organizations (
        user_id, workspace_id, name, normalized_name, category, country, city,
        district, address, normalized_address, latitude, longitude, phone,
        normalized_phone, email, normalized_email, website, normalized_website,
        normalized_domain, google_place_id, google_rating, google_review_count
      ) values (
        p_actor_user_id, p_workspace_id, v_source.name, v_source.normalized_name,
        v_source.category, v_source.country, v_source.city, v_source.district,
        v_source.address, v_source.normalized_address, v_source.latitude,
        v_source.longitude, v_source.phone, v_source.normalized_phone,
        v_source.email, v_source.normalized_email, v_source.website,
        v_source.normalized_website, v_source.normalized_domain,
        case when v_source.source = 'google_places' then v_source.external_id else null end,
        case when v_source.source = 'google_places' then v_source.rating else null end,
        case when v_source.source = 'google_places' then v_source.review_count else null end
      ) returning id into v_organization_id;
      v_created := true;
    end if;
  end if;

  insert into public.organization_sources (
    user_id, workspace_id, organization_id, source_record_id, match_confidence, match_reason
  ) values (
    p_actor_user_id, p_workspace_id, v_organization_id, p_source_record_id,
    p_confidence, array_to_string(coalesce(p_evidence, '{}'), ',')
  ) on conflict (source_record_id) do nothing;
  select organization_id into v_organization_id from public.organization_sources
  where source_record_id = p_source_record_id;
  return jsonb_build_object(
    'decision', case when v_created then 'create' else 'match' end,
    'organization_id', v_organization_id,
    'review_id', null
  );
end;
$$;

revoke all on function public.assert_workspace_access(uuid, uuid) from public, anon;
revoke all on function public.upsert_source_record(uuid, uuid, text, text, text, text, text, text, text, text, double precision, double precision, text, text, text, numeric, integer, timestamptz, jsonb, text, text, text, text, text, text) from public, anon;
revoke all on function public.find_entity_resolution_candidates(uuid, uuid, text, text, text, text, text, text, text, double precision, double precision) from public, anon;
revoke all on function public.apply_entity_resolution(uuid, uuid, uuid, text, uuid, numeric, text[]) from public, anon;
grant execute on function public.assert_workspace_access(uuid, uuid) to authenticated, service_role;
grant execute on function public.upsert_source_record(uuid, uuid, text, text, text, text, text, text, text, text, double precision, double precision, text, text, text, numeric, integer, timestamptz, jsonb, text, text, text, text, text, text) to authenticated, service_role;
grant execute on function public.find_entity_resolution_candidates(uuid, uuid, text, text, text, text, text, text, text, double precision, double precision) to authenticated, service_role;
grant execute on function public.apply_entity_resolution(uuid, uuid, uuid, text, uuid, numeric, text[]) to authenticated, service_role;
/* Remaining superseded draft.

drop trigger if exists workspaces_set_updated_at on public.workspaces;
create trigger workspaces_set_updated_at before update on public.workspaces
for each row execute function public.set_updated_at();
drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at before update on public.organizations
for each row execute function public.set_updated_at();
drop trigger if exists source_records_set_updated_at on public.source_records;
create trigger source_records_set_updated_at before update on public.source_records
for each row execute function public.set_updated_at();

create or replace function public.is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_memberships membership
    where membership.workspace_id = p_workspace_id
      and membership.user_id = auth.uid()
  );
$$;

create or replace function public.assert_workspace_access(
  p_workspace_id uuid,
  p_actor_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    (auth.uid() = p_actor_user_id or auth.role() = 'service_role')
    and exists (
      select 1 from public.workspace_memberships membership
      where membership.workspace_id = p_workspace_id
        and membership.user_id = p_actor_user_id
    );
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_memberships enable row level security;
alter table public.organizations enable row level security;
alter table public.source_records enable row level security;
alter table public.organization_sources enable row level security;
alter table public.entity_resolution_reviews enable row level security;

create policy "members can read workspaces" on public.workspaces
for select using (public.is_workspace_member(id));
create policy "members can read memberships" on public.workspace_memberships
for select using (public.is_workspace_member(workspace_id));
create policy "members manage organizations" on public.organizations
for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members manage source records" on public.source_records
for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members manage organization sources" on public.organization_sources
for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members manage resolution reviews" on public.entity_resolution_reviews
for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

create or replace function public.upsert_source_record(
  p_workspace_id uuid,
  p_source text,
  p_external_id text,
  p_name text,
  p_category text,
  p_address text,
  p_country text,
  p_city text,
  p_district text,
  p_latitude double precision,
  p_longitude double precision,
  p_phone text,
  p_email text,
  p_website text,
  p_rating numeric,
  p_review_count integer,
  p_fetched_at timestamptz,
  p_raw_data jsonb,
  p_normalized_name text,
  p_normalized_address text,
  p_normalized_phone text,
  p_normalized_email text,
  p_normalized_website text,
  p_normalized_domain text
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_record public.source_records;
  v_identity_key text;
begin
  v_identity_key := case
    when nullif(trim(p_external_id), '') is not null then 'external:' || trim(p_external_id)
    else 'identity:' || md5(concat_ws('|', p_normalized_name, p_normalized_address, p_normalized_phone, p_normalized_email, p_normalized_domain))
  end;

  insert into public.source_records (
    workspace_id, source, external_id, identity_key, name, normalized_name, category,
    address, normalized_address, country, city, district, latitude, longitude,
    phone, normalized_phone, email, normalized_email, website, normalized_website,
    normalized_domain, rating, review_count, fetched_at, raw_data
  ) values (
    p_workspace_id, trim(lower(p_source)), nullif(trim(p_external_id), ''), v_identity_key,
    p_name, p_normalized_name, p_category, p_address, p_normalized_address, p_country,
    p_city, p_district, p_latitude, p_longitude, p_phone, p_normalized_phone, p_email,
    p_normalized_email, p_website, p_normalized_website, p_normalized_domain,
    p_rating, p_review_count, p_fetched_at, coalesce(p_raw_data, '{}'::jsonb)
  )
  on conflict (workspace_id, source, identity_key) do update set
    name = excluded.name,
    normalized_name = excluded.normalized_name,
    category = excluded.category,
    address = excluded.address,
    normalized_address = excluded.normalized_address,
    country = excluded.country,
    city = excluded.city,
    district = excluded.district,
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    phone = excluded.phone,
    normalized_phone = excluded.normalized_phone,
    email = excluded.email,
    normalized_email = excluded.normalized_email,
    website = excluded.website,
    normalized_website = excluded.normalized_website,
    normalized_domain = excluded.normalized_domain,
    rating = excluded.rating,
    review_count = excluded.review_count,
    fetched_at = excluded.fetched_at,
    raw_data = excluded.raw_data
  returning * into v_record;

  return jsonb_build_object('id', v_record.id, 'workspace_id', v_record.workspace_id);
end;
$$;

create or replace function public.find_entity_resolution_candidates(
  p_workspace_id uuid,
  p_source text,
  p_external_id text,
  p_normalized_name text,
  p_normalized_address text,
  p_normalized_phone text,
  p_normalized_email text,
  p_normalized_domain text,
  p_latitude double precision default null,
  p_longitude double precision default null
)
returns table (
  organization_id uuid,
  source text,
  external_id text,
  name text,
  address text,
  phone text,
  email text,
  website text,
  latitude double precision,
  longitude double precision
)
language sql
stable
set search_path = public
as $$
  select distinct
    organization.id,
    source_record.source,
    source_record.external_id,
    organization.name,
    organization.address,
    organization.phone,
    organization.email,
    organization.website,
    organization.latitude,
    organization.longitude
  from public.organizations organization
  left join public.organization_sources organization_source
    on organization_source.organization_id = organization.id
   and organization_source.workspace_id = organization.workspace_id
  left join public.source_records source_record
    on source_record.id = organization_source.source_record_id
   and source_record.workspace_id = organization.workspace_id
  where organization.workspace_id = p_workspace_id
    and (
      (p_external_id is not null and source_record.source = p_source and source_record.external_id = p_external_id)
      or (p_normalized_domain is not null and organization.normalized_domain = p_normalized_domain)
      or (p_normalized_phone is not null and organization.normalized_phone = p_normalized_phone)
      or (p_normalized_email is not null and organization.normalized_email = p_normalized_email)
      or (p_normalized_name is not null and p_normalized_address is not null
          and organization.normalized_name = p_normalized_name
          and organization.normalized_address = p_normalized_address)
      or (p_normalized_name is not null and p_latitude is not null and p_longitude is not null
          and organization.normalized_name = p_normalized_name
          and abs(organization.latitude - p_latitude) <= 0.001
          and abs(organization.longitude - p_longitude) <= 0.0015)
    );
$$;

create or replace function public.apply_entity_resolution(
  p_workspace_id uuid,
  p_source_record_id uuid,
  p_decision text,
  p_candidate_organization_id uuid,
  p_confidence numeric,
  p_evidence text[]
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_source public.source_records;
  v_organization_id uuid;
  v_review_id uuid;
  v_lock_key text;
begin
  if p_decision not in ('match', 'review', 'create') then
    raise exception 'Unknown entity resolution decision: %', p_decision;
  end if;

  select * into v_source from public.source_records
  where id = p_source_record_id and workspace_id = p_workspace_id;
  if not found then raise exception 'Source record not found in workspace'; end if;

  select organization_id into v_organization_id
  from public.organization_sources
  where source_record_id = p_source_record_id and workspace_id = p_workspace_id;
  if found then
    return jsonb_build_object('decision', 'match', 'organization_id', v_organization_id, 'review_id', null);
  end if;

  if p_decision = 'review' then
    if p_candidate_organization_id is null then raise exception 'Review requires a candidate'; end if;
    if not exists (
      select 1 from public.organizations
      where id = p_candidate_organization_id and workspace_id = p_workspace_id
    ) then raise exception 'Candidate organization not found in workspace'; end if;

    select id into v_review_id from public.entity_resolution_reviews
    where source_record_id = p_source_record_id
      and candidate_organization_id = p_candidate_organization_id
      and status = 'pending';
    if not found then
      insert into public.entity_resolution_reviews (
        workspace_id, source_record_id, candidate_organization_id, confidence, evidence
      ) values (
        p_workspace_id, p_source_record_id, p_candidate_organization_id, p_confidence, coalesce(p_evidence, '{}')
      ) returning id into v_review_id;
    end if;
    return jsonb_build_object('decision', 'review', 'organization_id', null, 'review_id', v_review_id);
  end if;

  if p_decision = 'match' then
    if p_candidate_organization_id is null then raise exception 'Match requires a candidate'; end if;
    if not exists (
      select 1 from public.organizations
      where id = p_candidate_organization_id and workspace_id = p_workspace_id
    ) then raise exception 'Candidate organization not found in workspace'; end if;
    v_organization_id := p_candidate_organization_id;
  else
    v_lock_key := p_workspace_id::text || ':' || coalesce(
      v_source.normalized_domain,
      v_source.normalized_phone,
      v_source.source || ':' || v_source.identity_key
    );
    perform pg_advisory_xact_lock(hashtextextended(v_lock_key, 0));

    select id into v_organization_id
    from public.organizations
    where workspace_id = p_workspace_id
      and (
        (v_source.normalized_domain is not null and normalized_domain = v_source.normalized_domain)
        or (v_source.normalized_phone is not null and normalized_phone = v_source.normalized_phone)
      )
    order by created_at
    limit 1;

    if not found then
      insert into public.organizations (
        workspace_id, name, normalized_name, category, address, normalized_address,
        country, city, district, latitude, longitude, phone, normalized_phone,
        email, normalized_email, website, normalized_website, normalized_domain,
        rating, review_count
      ) values (
        p_workspace_id, v_source.name, v_source.normalized_name, v_source.category,
        v_source.address, v_source.normalized_address, v_source.country, v_source.city,
        v_source.district, v_source.latitude, v_source.longitude, v_source.phone,
        v_source.normalized_phone, v_source.email, v_source.normalized_email,
        v_source.website, v_source.normalized_website, v_source.normalized_domain,
        v_source.rating, v_source.review_count
      ) returning id into v_organization_id;
    end if;
  end if;

  insert into public.organization_sources (
    workspace_id, organization_id, source_record_id, match_method, confidence
  ) values (
    p_workspace_id, v_organization_id, p_source_record_id, coalesce(p_evidence, '{}'), p_confidence
  ) on conflict (source_record_id) do nothing;

  return jsonb_build_object(
    'decision', case when p_decision = 'create' then 'create' else 'match' end,
    'organization_id', v_organization_id,
    'review_id', null
  );
end;
$$;
*/
