-- Read-a-Brief initial database schema
-- AI provider agnostic: no OpenAI-specific fields or dependencies.

create extension if not exists pgcrypto;

create type public.app_role as enum ('user', 'editor', 'admin');
create type public.source_type as enum ('rss', 'atom', 'api', 'website');
create type public.content_status as enum ('discovered', 'processing', 'review', 'approved', 'published', 'rejected', 'failed');
create type public.automation_status as enum ('running', 'completed', 'failed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role public.app_role not null default 'user',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  homepage_url text,
  feed_url text not null,
  source_type public.source_type not null default 'rss',
  country text,
  category text,
  enabled boolean not null default true,
  polling_minutes integer not null default 30 check (polling_minutes between 5 and 1440),
  last_checked_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete cascade,
  external_id text,
  canonical_url text not null,
  title text not null,
  description text,
  author text,
  published_at timestamptz,
  discovered_at timestamptz not null default now(),
  content_hash text,
  language text,
  category text,
  country text,
  status public.content_status not null default 'discovered',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, canonical_url)
);

create table public.story_clusters (
  id uuid primary key default gen_random_uuid(),
  title text,
  category text,
  country text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.story_cluster_members (
  cluster_id uuid not null references public.story_clusters(id) on delete cascade,
  story_id uuid not null references public.stories(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (cluster_id, story_id),
  unique (story_id)
);

create table public.briefs (
  id uuid primary key default gen_random_uuid(),
  cluster_id uuid references public.story_clusters(id) on delete set null,
  headline text not null,
  dek text,
  summary text not null,
  why_it_matters text,
  what_happens_next text,
  body text,
  category text,
  country text,
  language text not null default 'en',
  confidence numeric(5,4) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  source_count integer not null default 0 check (source_count >= 0),
  status public.content_status not null default 'processing',
  ai_provider text,
  ai_model text,
  generation_metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.brief_sources (
  brief_id uuid not null references public.briefs(id) on delete cascade,
  story_id uuid not null references public.stories(id) on delete cascade,
  source_name text,
  source_url text not null,
  attribution text,
  created_at timestamptz not null default now(),
  primary key (brief_id, story_id)
);

create table public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  status public.automation_status not null default 'running',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  sources_checked integer not null default 0,
  stories_discovered integer not null default 0,
  stories_processed integer not null default 0,
  briefs_generated integer not null default 0,
  briefs_published integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  categories text[] not null default '{}',
  countries text[] not null default '{}',
  daily_brief_enabled boolean not null default false,
  timezone text not null default 'Africa/Kampala',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index sources_enabled_polling_idx on public.sources(enabled, last_checked_at);
create index stories_status_published_idx on public.stories(status, published_at desc);
create index stories_source_published_idx on public.stories(source_id, published_at desc);
create index stories_content_hash_idx on public.stories(content_hash) where content_hash is not null;
create index story_cluster_members_story_idx on public.story_cluster_members(story_id);
create index briefs_status_published_idx on public.briefs(status, published_at desc);
create index briefs_category_published_idx on public.briefs(category, published_at desc);
create index brief_sources_story_idx on public.brief_sources(story_id);
create index automation_runs_started_idx on public.automation_runs(started_at desc);
create index audit_logs_created_idx on public.audit_logs(created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger sources_set_updated_at before update on public.sources for each row execute function public.set_updated_at();
create trigger stories_set_updated_at before update on public.stories for each row execute function public.set_updated_at();
create trigger story_clusters_set_updated_at before update on public.story_clusters for each row execute function public.set_updated_at();
create trigger briefs_set_updated_at before update on public.briefs for each row execute function public.set_updated_at();
create trigger user_preferences_set_updated_at before update on public.user_preferences for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin_or_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and is_active = true
      and role in ('admin', 'editor')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and is_active = true
      and role = 'admin'
  );
$$;

revoke execute on function public.is_admin_or_editor() from public;
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin_or_editor() to authenticated;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.sources enable row level security;
alter table public.stories enable row level security;
alter table public.story_clusters enable row level security;
alter table public.story_cluster_members enable row level security;
alter table public.briefs enable row level security;
alter table public.brief_sources enable row level security;
alter table public.automation_runs enable row level security;
alter table public.user_preferences enable row level security;
alter table public.audit_logs enable row level security;

revoke all on public.profiles, public.sources, public.stories, public.story_clusters, public.story_cluster_members, public.briefs, public.brief_sources, public.automation_runs, public.user_preferences, public.audit_logs from anon, authenticated;
grant select on public.profiles, public.briefs, public.brief_sources, public.sources, public.stories, public.story_clusters, public.story_cluster_members to anon, authenticated;
grant insert, update, delete on public.profiles, public.sources, public.stories, public.story_clusters, public.story_cluster_members, public.briefs, public.brief_sources, public.automation_runs, public.audit_logs to authenticated;
grant insert, update, delete, select on public.user_preferences to authenticated;

authorization policy "Users can read own profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "Admins and editors can manage profiles"
on public.profiles for all to authenticated
using ((select public.is_admin_or_editor()))
with check ((select public.is_admin_or_editor()));

create policy "Public can read enabled sources"
on public.sources for select to anon, authenticated
using (enabled = true);

create policy "Editors can manage sources"
on public.sources for all to authenticated
using ((select public.is_admin_or_editor()))
with check ((select public.is_admin_or_editor()));

create policy "Public can read discovered stories"
on public.stories for select to anon, authenticated
using (status in ('approved', 'published'));

create policy "Editors can manage stories"
on public.stories for all to authenticated
using ((select public.is_admin_or_editor()))
with check ((select public.is_admin_or_editor()));

create policy "Public can read clusters used by published briefs"
on public.story_clusters for select to anon, authenticated
using (exists (select 1 from public.briefs b where b.cluster_id = id and b.status = 'published'));

create policy "Editors can manage clusters"
on public.story_clusters for all to authenticated
using ((select public.is_admin_or_editor()))
with check ((select public.is_admin_or_editor()));

create policy "Public can read cluster membership for published briefs"
on public.story_cluster_members for select to anon, authenticated
using (exists (select 1 from public.briefs b join public.story_cluster_members scm on scm.cluster_id = b.cluster_id where scm.cluster_id = story_cluster_members.cluster_id and b.status = 'published'));

create policy "Editors can manage cluster membership"
on public.story_cluster_members for all to authenticated
using ((select public.is_admin_or_editor()))
with check ((select public.is_admin_or_editor()));

create policy "Public can read published briefs"
on public.briefs for select to anon, authenticated
using (status = 'published' and published_at is not null);

create policy "Editors can manage briefs"
on public.briefs for all to authenticated
using ((select public.is_admin_or_editor()))
with check ((select public.is_admin_or_editor()));

create policy "Public can read sources attached to published briefs"
on public.brief_sources for select to anon, authenticated
using (exists (select 1 from public.briefs b where b.id = brief_id and b.status = 'published'));

create policy "Editors can manage brief sources"
on public.brief_sources for all to authenticated
using ((select public.is_admin_or_editor()))
with check ((select public.is_admin_or_editor()));

create policy "Editors can manage automation runs"
on public.automation_runs for all to authenticated
using ((select public.is_admin_or_editor()))
with check ((select public.is_admin_or_editor()));

create policy "Users can read own preferences"
on public.user_preferences for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create own preferences"
on public.user_preferences for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own preferences"
on public.user_preferences for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own preferences"
on public.user_preferences for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Admins can read audit logs"
on public.audit_logs for select to authenticated
using ((select public.is_admin()));

create policy "Admins can manage audit logs"
on public.audit_logs for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
