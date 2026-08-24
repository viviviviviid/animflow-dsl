begin;

-- Supabase grants service_role broad table privileges from a platform event
-- trigger when public tables are created. Reduce the deployed table to the
-- operations used by the immutable publish store.
revoke all on table public.animflow_published_revisions from service_role;
grant select, insert, delete on table public.animflow_published_revisions to service_role;

commit;
