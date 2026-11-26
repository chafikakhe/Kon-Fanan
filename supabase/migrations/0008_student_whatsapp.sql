-- Contact information is private to the student and active administrators.
-- Never put passwords in profiles, metadata, contact rows or audit events.
create table public.student_contacts (
 id uuid primary key default gen_random_uuid(),
 student_id uuid not null unique references public.profiles(id) on delete cascade,
 whatsapp_number text not null check (whatsapp_number ~ '^\+[1-9][0-9]{7,14}$'),
 created_at timestamptz not null default now()
);
alter table public.student_contacts enable row level security;
revoke all on public.student_contacts from public,anon,authenticated;
grant select on public.student_contacts to authenticated;
grant all on public.student_contacts to service_role;
create policy student_contacts_read on public.student_contacts for select to authenticated
 using(student_id=auth.uid() or public.is_active_role('admin'));

create function public.save_student_contact(p_whatsapp_number text,p_student_id uuid default auth.uid())
returns jsonb language plpgsql security definer set search_path='' as $$
declare result public.student_contacts;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 if not public.is_active_role('admin') and (p_student_id<>auth.uid() or not exists(
  select 1 from public.account_access where user_id=auth.uid() and role='student' and status in ('pending','active','rejected')
 )) then raise exception 'ACCESS_DENIED'; end if;
 if not exists(select 1 from public.account_access where user_id=p_student_id and role='student') then raise exception 'INVALID_REQUEST'; end if;
 if p_whatsapp_number is null or p_whatsapp_number !~ '^\+[1-9][0-9]{7,14}$' then raise exception 'INVALID_REQUEST'; end if;
 insert into public.student_contacts(student_id,whatsapp_number) values(p_student_id,p_whatsapp_number)
 on conflict(student_id) do update set whatsapp_number=excluded.whatsapp_number returning * into result;
 return to_jsonb(result);
end $$;
revoke all on function public.save_student_contact(text,uuid) from public,anon;
grant execute on function public.save_student_contact(text,uuid) to authenticated;

create function private.capture_student_registration() returns trigger
language plpgsql security definer set search_path='' as $$
declare phone text := new.raw_user_meta_data->>'whatsapp_number'; class_id uuid;
begin
 -- Existing accounts and teacher provisioning remain compatible.
 if phone is null then return new; end if;
 if phone !~ '^\+[1-9][0-9]{7,14}$' then raise exception 'INVALID_WHATSAPP'; end if;
 insert into public.student_contacts(student_id,whatsapp_number) values(new.id,phone);
 if nullif(new.raw_user_meta_data->>'requested_class_id','') is not null then
  class_id := (new.raw_user_meta_data->>'requested_class_id')::uuid;
  if not exists(select 1 from public.classes c join public.academic_years y on y.id=c.academic_year_id
   where c.id=class_id and c.status='active' and y.status='active') then
   raise exception 'CLASS_UNAVAILABLE';
  end if;
  insert into public.admission_requests(student_id,requested_class_id) values(new.id,class_id);
 end if;
 return new;
end $$;
-- After kon_fanan_signup has created the pending student profile.
create trigger kon_fanan_student_contact after insert on auth.users
 for each row execute function private.capture_student_registration();

-- A server-only gate: only an active admin can reset an active student's login.
create function public.authorize_student_password_reset(p_admin_id uuid,p_student_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 if auth.role()<>'service_role' then raise exception 'ACCESS_DENIED'; end if;
 perform 1 from public.account_access where user_id=p_admin_id and role='admin' and status='active' for update;
 if not found then raise exception 'ACCESS_DENIED'; end if;
 perform 1 from public.account_access where user_id=p_student_id and role='student' and status='active' for update;
 if not found then raise exception 'ACCESS_DENIED'; end if;
 if not exists(select 1 from public.student_contacts where student_id=p_student_id) then
  raise exception 'INVALID_REQUEST';
 end if;
 if (select count(*) from private.audit_events where actor_id=p_admin_id
  and action='student_password_reset_requested' and created_at>now()-interval '1 hour')>=20
  or exists(select 1 from private.audit_events where resource_id=p_student_id
  and action='student_password_reset_requested' and created_at>now()-interval '1 minute') then
  raise exception 'RATE_LIMITED';
 end if;
 insert into private.audit_events(actor_id,action,resource_type,resource_id)
  values(p_admin_id,'student_password_reset_requested','profile',p_student_id);
 return true;
end $$;
revoke all on function public.authorize_student_password_reset(uuid,uuid) from public,anon,authenticated;
grant execute on function public.authorize_student_password_reset(uuid,uuid) to service_role;
