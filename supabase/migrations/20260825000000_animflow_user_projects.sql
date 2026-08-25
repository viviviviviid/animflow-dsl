begin;

create table if not exists public.animflow_projects (
  owner_id uuid not null references auth.users(id) on delete cascade,
  document_id text not null check (char_length(document_id) between 1 and 160),
  title text not null check (char_length(title) between 1 and 240),
  current_revision bigint not null default 0 check (current_revision >= 0),
  version bigint not null default 1 check (version >= 1),
  source text not null check (octet_length(source) between 1 and 2097152),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, document_id)
);

create index if not exists animflow_projects_owner_updated_idx
  on public.animflow_projects (owner_id, updated_at desc);

alter table public.animflow_projects enable row level security;
revoke all on table public.animflow_projects from public, anon, service_role;
grant select, insert, update, delete on table public.animflow_projects to authenticated;

drop policy if exists animflow_projects_select_own on public.animflow_projects;
create policy animflow_projects_select_own on public.animflow_projects
  for select to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists animflow_projects_insert_own on public.animflow_projects;
create policy animflow_projects_insert_own on public.animflow_projects
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists animflow_projects_update_own on public.animflow_projects;
create policy animflow_projects_update_own on public.animflow_projects
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists animflow_projects_delete_own on public.animflow_projects;
create policy animflow_projects_delete_own on public.animflow_projects
  for delete to authenticated
  using (owner_id = (select auth.uid()));

create table if not exists public.animflow_narration_assets (
  asset_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  document_id text not null,
  scene_id text not null check (char_length(scene_id) between 1 and 160),
  project_revision bigint not null check (project_revision >= 0),
  object_path text not null check (char_length(object_path) between 1 and 1024),
  mime_type text not null check (mime_type in ('audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg')),
  duration_ms integer not null check (duration_ms > 0 and duration_ms <= 3600000),
  voice text,
  created_at timestamptz not null default now(),
  unique (owner_id, document_id, scene_id, project_revision),
  foreign key (owner_id, document_id)
    references public.animflow_projects(owner_id, document_id)
    on delete cascade
);

alter table public.animflow_narration_assets enable row level security;
revoke all on table public.animflow_narration_assets from public, anon, service_role;
grant select, insert, update, delete on table public.animflow_narration_assets to authenticated;

drop policy if exists animflow_narration_assets_own on public.animflow_narration_assets;
create policy animflow_narration_assets_own on public.animflow_narration_assets
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

commit;
