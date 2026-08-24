#!/usr/bin/env bash
set -euo pipefail

ANIMFLOW_PG_BINDIR="$(pg_config --bindir)"
ANIMFLOW_PG_DIR="$(mktemp -d)"
ANIMFLOW_PG_SOCKET="$(mktemp -d)"
ANIMFLOW_RATE_RESULTS="$(mktemp -d)"
ANIMFLOW_PG_PORT=55439

cleanup_animflow_pg() {
  "$ANIMFLOW_PG_BINDIR/pg_ctl" -D "$ANIMFLOW_PG_DIR" -m fast stop >/dev/null 2>&1 || true
  rm -r "$ANIMFLOW_PG_DIR" "$ANIMFLOW_PG_SOCKET" "$ANIMFLOW_RATE_RESULTS"
}
trap cleanup_animflow_pg EXIT

"$ANIMFLOW_PG_BINDIR/initdb" -D "$ANIMFLOW_PG_DIR" --auth=trust --no-locale >/dev/null
"$ANIMFLOW_PG_BINDIR/pg_ctl" -D "$ANIMFLOW_PG_DIR" -o "-k $ANIMFLOW_PG_SOCKET -p $ANIMFLOW_PG_PORT -c listen_addresses=''" -w start >/dev/null

ANIMFLOW_PSQL=("$ANIMFLOW_PG_BINDIR/psql" -h "$ANIMFLOW_PG_SOCKET" -p "$ANIMFLOW_PG_PORT" -d postgres -v ON_ERROR_STOP=1)
"${ANIMFLOW_PSQL[@]}" <<'SQL'
create role anon;
create role authenticated;
create role service_role bypassrls;
SQL

"${ANIMFLOW_PSQL[@]}" -f supabase/migrations/20260824000000_animflow_publish.sql >/dev/null
"${ANIMFLOW_PSQL[@]}" <<'SQL'
set role service_role;
insert into public.animflow_published_revisions (
  revision_id, artifact, deletion_token_hash, created_at, expires_at, artifact_size
) values (
  repeat('a', 32),
  jsonb_build_object(
    'revisionId', repeat('a', 32),
    'createdAt', '1970-01-01T00:00:01.000Z',
    'expiresAt', '1970-01-01T00:01:01.000Z'
  ),
  repeat('b', 64), to_timestamp(1), to_timestamp(61), 256
);

do $$
declare result record;
begin
  select * into result from public.animflow_consume_publish_limit('minute', repeat('c', 64), 2, 60000, 1000);
  if not result.allowed then raise exception 'first quota request rejected'; end if;
  select * into result from public.animflow_consume_publish_limit('minute', repeat('c', 64), 2, 60000, 1001);
  if not result.allowed then raise exception 'second quota request rejected'; end if;
  select * into result from public.animflow_consume_publish_limit('minute', repeat('c', 64), 2, 60000, 1002);
  if result.allowed or result.retry_after_ms <> 59998 then raise exception 'quota overflow contract failed'; end if;
end;
$$;
reset role;

do $$
begin
  begin
    update public.animflow_published_revisions set artifact_size = 257 where revision_id = repeat('a', 32);
    raise exception 'immutable trigger did not reject update';
  exception when sqlstate '55000' then null;
  end;
  if not (select relrowsecurity from pg_class where oid = 'public.animflow_published_revisions'::regclass) then raise exception 'RLS is disabled'; end if;
  if has_table_privilege('anon', 'public.animflow_published_revisions', 'select') then raise exception 'anon can read revisions'; end if;
  if has_table_privilege('service_role', 'public.animflow_published_revisions', 'update') then raise exception 'service role can update revisions'; end if;
  if has_function_privilege('anon', 'public.animflow_consume_publish_limit(text,text,integer,bigint,bigint)', 'execute') then raise exception 'anon can execute quota RPC'; end if;
end;
$$;

set role service_role;
do $$
begin
  if public.animflow_cleanup_expired_revisions(61001) <> 1 then raise exception 'expiry cleanup contract failed'; end if;
  perform public.animflow_cleanup_expired_revisions(200000000);
end;
$$;
reset role;
do $$
begin
  if exists (select 1 from animflow_private.animflow_publish_limits) then raise exception 'stale quota cleanup contract failed'; end if;
  if has_schema_privilege('service_role', 'animflow_private', 'usage') then raise exception 'service role can use private schema'; end if;
  if has_table_privilege('service_role', 'animflow_private.animflow_publish_limits', 'select') then raise exception 'service role can read private quota state'; end if;
end;
$$;
SQL

for ANIMFLOW_RATE_INDEX in $(seq 1 20); do
  (
    "${ANIMFLOW_PSQL[@]}" -qAt -c "set role service_role; select allowed from public.animflow_consume_publish_limit('concurrent', repeat('d', 64), 10, 60000, 5000);" \
      > "$ANIMFLOW_RATE_RESULTS/$ANIMFLOW_RATE_INDEX"
  ) &
done
wait
ANIMFLOW_ALLOWED_COUNT="$(grep -h '^t$' "$ANIMFLOW_RATE_RESULTS"/* | wc -l | tr -d ' ')"
if [[ "$ANIMFLOW_ALLOWED_COUNT" != "10" ]]; then
  echo "Concurrent quota contract failed: expected 10 allowed requests, received $ANIMFLOW_ALLOWED_COUNT." >&2
  exit 1
fi

echo "Supabase migration verified against temporary PostgreSQL."
