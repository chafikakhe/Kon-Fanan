-- Auth Admin applies app_metadata AFTER inserting auth.users, in the same
-- transaction. Handle both sequences (insert with metadata, or later update).
-- Never trust raw_user_meta_data for role/status/provisioning.
alter table public.profiles
 add column first_name text check (length(first_name) between 1 and 60),
 add column last_name text check (length(last_name) between 1 and 60);

create function private.provision_teacher() returns trigger
language plpgsql security definer set search_path='' as $$
declare
 provision jsonb := new.raw_app_meta_data->'kon_fanan_teacher';
 creator uuid;
 v_first_name text;
 v_last_name text;
begin
 if provision is null then return new; end if;
 -- Subsequent Auth metadata updates must not reset this teacher's profile/access.
 if tg_op='UPDATE' and old.raw_app_meta_data->'kon_fanan_teacher' is not null then
  return new;
 end if;
 creator := (provision->>'created_by')::uuid;
 -- Serialize creation by this admin and reject suspension during creation.
 perform 1 from public.account_access
  where user_id=creator and role='admin' and status='active' for update;
 if not found then raise exception 'ACCESS_DENIED'; end if;
 if (select count(*) from private.audit_events where actor_id=creator
     and action='teacher_created' and created_at>now()-interval '1 hour')>=30 then
  raise exception 'RATE_LIMITED';
 end if;
 v_first_name := trim(new.raw_user_meta_data->>'first_name');
 v_last_name := trim(new.raw_user_meta_data->>'last_name');
 if v_first_name is null or v_last_name is null
    or length(v_first_name) not between 1 and 60 or length(v_last_name) not between 1 and 60
    or length(v_first_name || ' ' || v_last_name)>120 then
  raise exception 'INVALID_REQUEST';
 end if;
 -- The existing signup trigger has created the pending student profile first.
 -- Refuse to overwrite any already activated or privileged account.
 update public.account_access set role='teacher',status='active',activated_at=now()
  where user_id=new.id and role='student' and status='pending';
 if not found then raise exception 'ACCESS_DENIED'; end if;
 update public.profiles set display_name=v_first_name || ' ' || v_last_name,
  first_name=v_first_name,last_name=v_last_name where id=new.id;
 if not found then raise exception 'INVALID_REQUEST'; end if;
 insert into private.audit_events(actor_id,action,resource_type,resource_id)
  values(creator,'teacher_created','profile',new.id);
 return new;
end $$;
-- Alphabetically after kon_fanan_signup for insert events.
create trigger kon_fanan_teacher after insert or update of raw_app_meta_data
 on auth.users for each row execute function private.provision_teacher();

-- Deployment gate: a new Edge Function against the old schema must fail BEFORE
-- creating an Auth user through the ordinary student signup trigger.
create function public.authorize_teacher_creation(p_admin_id uuid) returns boolean
language plpgsql security definer set search_path='' as $$
begin
 if auth.role()<>'service_role' or not exists(
   select 1 from public.account_access where user_id=p_admin_id and role='admin' and status='active'
 ) then raise exception 'ACCESS_DENIED'; end if;
 if (select count(*) from private.audit_events where actor_id=p_admin_id
     and action='teacher_created' and created_at>now()-interval '1 hour')>=30 then
  raise exception 'RATE_LIMITED';
 end if;
 return true;
end $$;
revoke all on function public.authorize_teacher_creation(uuid) from public,anon,authenticated;
grant execute on function public.authorize_teacher_creation(uuid) to service_role;
