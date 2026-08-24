begin;

create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'animflow-expired-revisions',
  '15 3 * * *',
  $$select public.animflow_cleanup_expired_revisions((extract(epoch from clock_timestamp()) * 1000)::bigint)$$
);

commit;
