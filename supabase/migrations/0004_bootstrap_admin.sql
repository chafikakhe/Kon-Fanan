-- Instance-specific bootstrap requested by the project owner.
-- Use the verified Auth UUID rather than publishing the account email.
-- Fresh environments without this identity keep their normal bootstrap procedure.
do $$
declare
  target_id constant uuid := 'a35938cd-c92b-4a33-a12d-828f52d478e7';
  previous_access public.account_access;
begin
  perform 1 from auth.users where id = target_id and deleted_at is null for update;
  if not found then
    raise notice 'Bootstrap administrator identity absent in this environment; skipped.';
    return;
  end if;

  insert into public.profiles(id, display_name)
  select id, left(coalesce(nullif(trim(raw_user_meta_data->>'display_name'), ''), 'Administration'), 120)
  from auth.users where id = target_id
  on conflict (id) do nothing;

  select * into previous_access
  from public.account_access where user_id = target_id for update;

  if previous_access.role = 'admin' and previous_access.status = 'active' then
    return;
  end if;

  insert into public.account_access(user_id, role, status, activated_at, suspended_at)
  values (target_id, 'admin', 'active', now(), null)
  on conflict (user_id) do update
    set role = 'admin',
        status = 'active',
        activated_at = coalesce(public.account_access.activated_at, excluded.activated_at),
        suspended_at = null;

  insert into private.audit_events(actor_id, action, resource_type, resource_id, changes)
  values (
    null, 'administrator_bootstrapped', 'account', target_id,
    jsonb_build_object(
      'source', 'schema_migration',
      'migration', '0004_bootstrap_admin',
      'before', jsonb_build_object('role', previous_access.role, 'status', previous_access.status),
      'after', jsonb_build_object('role', 'admin', 'status', 'active')
    )
  );
end $$;
