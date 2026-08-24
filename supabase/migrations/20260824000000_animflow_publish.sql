begin;

create schema if not exists animflow_private;
revoke all on schema animflow_private from public, anon, authenticated, service_role;

create table if not exists public.animflow_published_revisions (
  revision_id text primary key check (revision_id ~ '^[a-f0-9]{32}$'),
  artifact jsonb not null,
  deletion_token_hash text not null check (deletion_token_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null,
  expires_at timestamptz not null check (expires_at > created_at),
  artifact_size integer not null check (artifact_size between 1 and 2097152),
  check (artifact ->> 'revisionId' = revision_id),
  check (artifact ->> 'createdAt' = to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
  check (artifact ->> 'expiresAt' = to_char(expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
);

create index if not exists animflow_published_revisions_expires_at_idx
  on public.animflow_published_revisions (expires_at);

alter table public.animflow_published_revisions enable row level security;
revoke all on table public.animflow_published_revisions from public, anon, authenticated, service_role;
grant select, insert, delete on table public.animflow_published_revisions to service_role;

create or replace function animflow_private.animflow_reject_revision_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'AnimFlow published revisions are immutable' using errcode = '55000';
end;
$$;

drop trigger if exists animflow_published_revisions_immutable on public.animflow_published_revisions;
create trigger animflow_published_revisions_immutable
before update on public.animflow_published_revisions
for each row execute function animflow_private.animflow_reject_revision_update();

create table if not exists animflow_private.animflow_publish_limits (
  scope text not null check (char_length(scope) between 1 and 64),
  key_hash text not null check (key_hash ~ '^[a-f0-9]{64}$'),
  window_start_ms bigint not null check (window_start_ms >= 0),
  request_count integer not null check (request_count >= 0),
  primary key (scope, key_hash)
);

revoke all on table animflow_private.animflow_publish_limits from public, anon, authenticated, service_role;
revoke all on function animflow_private.animflow_reject_revision_update() from public, anon, authenticated, service_role;

create or replace function public.animflow_consume_publish_limit(
  p_scope text,
  p_key_hash text,
  p_limit integer,
  p_window_ms bigint,
  p_now_ms bigint
)
returns table (allowed boolean, retry_after_ms bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_start bigint;
  current_count integer;
begin
  if char_length(p_scope) not between 1 and 64
    or p_key_hash !~ '^[a-f0-9]{64}$'
    or p_limit < 1
    or p_window_ms < 1
    or p_now_ms < 0 then
    raise exception 'Invalid AnimFlow publish limit input' using errcode = '22023';
  end if;

  insert into animflow_private.animflow_publish_limits (scope, key_hash, window_start_ms, request_count)
  values (p_scope, p_key_hash, p_now_ms, 0)
  on conflict (scope, key_hash) do nothing;

  select window_start_ms, request_count
    into current_start, current_count
    from animflow_private.animflow_publish_limits
    where scope = p_scope and key_hash = p_key_hash
    for update;

  if p_now_ms < current_start or p_now_ms - current_start >= p_window_ms then
    current_start := p_now_ms;
    current_count := 0;
  end if;

  allowed := current_count < p_limit;
  if allowed then current_count := current_count + 1; end if;

  update animflow_private.animflow_publish_limits
    set window_start_ms = current_start, request_count = current_count
    where scope = p_scope and key_hash = p_key_hash;

  retry_after_ms := greatest(1, current_start + p_window_ms - p_now_ms);
  return next;
end;
$$;

create or replace function public.animflow_cleanup_expired_revisions(p_now_ms bigint)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  if p_now_ms < 0 then
    raise exception 'Invalid AnimFlow cleanup timestamp' using errcode = '22023';
  end if;
  delete from public.animflow_published_revisions
    where expires_at <= to_timestamp(p_now_ms / 1000.0);
  get diagnostics deleted_count = row_count;
  delete from animflow_private.animflow_publish_limits
    where window_start_ms < greatest(0, p_now_ms - 172800000);
  return deleted_count;
end;
$$;

revoke all on function public.animflow_consume_publish_limit(text, text, integer, bigint, bigint) from public, anon, authenticated;
revoke all on function public.animflow_cleanup_expired_revisions(bigint) from public, anon, authenticated;
grant execute on function public.animflow_consume_publish_limit(text, text, integer, bigint, bigint) to service_role;
grant execute on function public.animflow_cleanup_expired_revisions(bigint) to service_role;

commit;
