-- Enable Supabase Cron (pg_cron) in Dashboard > Integrations before running this file.
select cron.schedule(
  'animflow-expired-revisions',
  '15 3 * * *',
  $$select public.animflow_cleanup_expired_revisions((extract(epoch from clock_timestamp()) * 1000)::bigint)$$
);
