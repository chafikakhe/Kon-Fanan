-- External integrations. Private schema is deliberately NOT exposed to PostgREST.
alter table public.files add column storage_deleted_at timestamptz;
alter table public.files add column cleanup_failed boolean not null default false;
create table private.google_connections (
 id uuid primary key default gen_random_uuid(), teacher_id uuid not null references public.profiles(id),
 google_subject text not null, google_email text not null, granted_scopes text[] not null,
 is_current boolean not null default true, state text not null default 'connected' check(state in ('connected','reconnect_required','disconnected')),
 ciphertext text, iv text, key_version text, locked_until timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(teacher_id,google_subject)
);
create unique index one_google_connection on private.google_connections(teacher_id) where is_current;
create table private.file_validation_leases (
 file_id uuid primary key references public.files(id), lease_token uuid not null, locked_until timestamptz not null
);
create table private.oauth_flows (
 id uuid primary key default gen_random_uuid(), teacher_id uuid not null references public.profiles(id),
 phase text not null check(phase in ('ticket','state')), token_hash text not null unique, proof_hash text, nonce text,
 expires_at timestamptz not null, consumed_at timestamptz, created_at timestamptz not null default now()
);
create table private.teacher_invitations (
 id uuid primary key default gen_random_uuid(), email text not null, display_name text not null, created_by uuid not null references public.profiles(id),
 user_id uuid references public.profiles(id), status text not null default 'pending' check(status in ('pending','sent','failed')),
 created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '24 hours'
);
create table private.meeting_integrations (
 meeting_id uuid primary key references public.meetings(id), connection_id uuid not null references private.google_connections(id),
 google_event_id text not null, conference_request_id text not null, meet_url text, google_etag text,
 synced_start timestamptz, synced_end timestamptz, updated_at timestamptz not null default now(), unique(connection_id,google_event_id),
 check(meet_url is null or meet_url ~ '^https://meet[.]google[.]com/[a-z]{3}-[a-z]{4}-[a-z]{3}$')
);
create table private.integration_jobs (
 id uuid primary key default gen_random_uuid(), meeting_id uuid not null references public.meetings(id),
 requested_by uuid not null references public.profiles(id), operation text not null check(operation in ('create','update','cancel','reconcile')),
 requested_revision int not null, idempotency_key text not null check(length(idempotency_key) between 8 and 128), payload jsonb not null default '{}',
 status text not null default 'pending' check(status in ('pending','running','completed','error','superseded')),
 attempt_count int not null default 0, next_attempt_at timestamptz not null default now(), locked_until timestamptz,
 lease_token uuid, last_error_code text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(requested_by,operation,meeting_id,idempotency_key)
);
create index jobs_ready on private.integration_jobs(status,next_attempt_at);
create index oauth_expiry on private.oauth_flows(expires_at);
revoke all on all tables in schema private from public,anon,authenticated;

create function public.google_connection_status() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare c private.google_connections;
begin
 if not public.is_active_role('teacher') then raise exception 'ACCESS_DENIED'; end if;
 select * into c from private.google_connections where teacher_id=auth.uid() and is_current;
 return case when c.id is null then jsonb_build_object('state','disconnected') else jsonb_build_object('state',c.state,'email',c.google_email,'updated_at',c.updated_at) end;
end $$;
create function public.integration_status() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not public.is_active_role('admin') then raise exception 'ACCESS_DENIED'; end if;
 return jsonb_build_object('connections',(select coalesce(jsonb_agg(jsonb_build_object('teacher_id',teacher_id,'state',state,'updated_at',updated_at)),'[]') from private.google_connections where is_current),
 'jobs',(select coalesce(jsonb_agg(to_jsonb(j)),'[]') from (select id,meeting_id,operation,status,attempt_count,last_error_code,updated_at from private.integration_jobs order by updated_at desc limit 100) j));
end $$;

create function public.queue_meeting_operation(p_meeting_id uuid,p_operation text,p_expected_version int,p_idempotency_key text,p_changes jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare m public.meetings; a public.announcements; s public.teaching_spaces; c private.google_connections; j private.integration_jobs; v_payload jsonb; v_minutes int;
begin
 if p_operation not in ('create','update','cancel','reconcile') or length(p_idempotency_key) not between 8 and 128 then raise exception 'INVALID_REQUEST'; end if;
 select * into m from public.meetings where id=p_meeting_id for update;
 if m.id is null then raise exception 'RESOURCE_NOT_FOUND'; end if;
 select * into a from public.announcements where id=m.announcement_id;
 select * into s from public.teaching_spaces where id=a.teaching_space_id;
 if not ((public.is_active_role('teacher') and s.teacher_id=auth.uid() and public.can_manage_space(s.id)) or (p_operation='cancel' and public.is_active_role('admin'))) then raise exception 'ACCESS_DENIED'; end if;
 v_payload=jsonb_build_object('changes',p_changes,'version',p_expected_version);
 select * into j from private.integration_jobs where requested_by=auth.uid() and operation=p_operation and meeting_id=m.id and idempotency_key=p_idempotency_key;
 if j.id is not null then
  if j.payload<>v_payload then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
  return jsonb_build_object('meetingId',m.id,'operationId',j.id,'status',m.status);
 end if;
 if m.row_version<>p_expected_version then raise exception 'VERSION_CONFLICT'; end if;
 if p_operation='create' and m.status not in ('draft','error') then raise exception 'INVALID_REQUEST'; end if;
 if p_operation in ('update','reconcile') and m.status not in ('scheduled','error') then raise exception 'INVALID_REQUEST'; end if;
 if p_operation<>'cancel' and m.ends_at<=now() then raise exception 'DEADLINE_PASSED'; end if;
 if (select count(*) from private.integration_jobs where requested_by=auth.uid() and created_at>now()-interval '1 hour')>=30 then raise exception 'RATE_LIMITED'; end if;
 if p_operation<>'cancel' then
  select gc.* into c from private.google_connections gc left join private.meeting_integrations mi on mi.connection_id=gc.id and mi.meeting_id=m.id
  where gc.teacher_id=s.teacher_id and (mi.meeting_id is not null or (gc.is_current and not exists(select 1 from private.meeting_integrations where meeting_id=m.id))) limit 1;
  if c.id is null or c.state<>'connected' then raise exception 'GOOGLE_RECONNECT_REQUIRED'; end if;
 end if;
 if p_operation='update' then
  if p_changes ? 'title' and length(trim(p_changes->>'title')) not between 1 and 200 then raise exception 'INVALID_REQUEST'; end if;
  update public.announcements set title=coalesce(p_changes->>'title',title),body=coalesce(p_changes->>'body',body),row_version=row_version+1 where id=a.id;
  update public.meetings set starts_at=coalesce((p_changes->>'starts_at')::timestamptz,starts_at),ends_at=coalesce((p_changes->>'ends_at')::timestamptz,ends_at),timezone=coalesce(p_changes->>'timezone',timezone) where id=m.id;
 end if;
 if p_operation in ('create','update') and not exists(select 1 from public.announcements where id=a.id and length(trim(title)) between 1 and 200) then raise exception 'INVALID_REQUEST'; end if;
 if p_operation='create' then
  insert into private.meeting_integrations(meeting_id,connection_id,google_event_id,conference_request_id)
  values(m.id,c.id,replace(m.id::text,'-',''),gen_random_uuid()::text) on conflict(meeting_id) do nothing;
 end if;
 update public.meetings set status=case when p_operation='cancel' then 'cancelled' when p_operation='create' then 'publishing' else status end,
 sync_status='pending',revision=revision+1,row_version=row_version+1,last_error_code=null where id=m.id returning * into m;
 if p_operation='cancel' then
  perform private.notify_space(a.teaching_space_id,'meeting_cancelled','meeting',m.id,'meeting-cancelled:'||m.id||':'||m.revision);
 end if;
 insert into private.integration_jobs(meeting_id,requested_by,operation,requested_revision,idempotency_key,payload) values(m.id,auth.uid(),p_operation,m.revision,p_idempotency_key,v_payload) returning * into j;
 perform private.audit('meeting_'||p_operation,'meeting',m.id);
 return jsonb_build_object('meetingId',m.id,'operationId',j.id,'status',m.status);
end $$;

create function public.retry_integration_job(p_job_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare j private.integration_jobs; a public.announcements; m public.meetings; s public.teaching_spaces;
begin
 select * into j from private.integration_jobs where id=p_job_id for update;
 select * into m from public.meetings where id=j.meeting_id;
 select * into a from public.announcements where id=m.announcement_id;
 select * into s from public.teaching_spaces where id=a.teaching_space_id;
 if not(public.is_active_role('admin') or(public.is_active_role('teacher') and s.teacher_id=auth.uid() and public.can_manage_space(s.id))) then raise exception 'ACCESS_DENIED'; end if;
 if j.status<>'error' or j.requested_revision<>m.revision then raise exception 'VERSION_CONFLICT'; end if;
 if j.updated_at>now()-interval '30 seconds' then raise exception 'RATE_LIMITED'; end if;
 update private.integration_jobs set status='pending',attempt_count=0,next_attempt_at=now(),last_error_code=null,updated_at=now() where id=j.id;
 update public.meetings set sync_status='pending',last_error_code=null,status=case when j.operation='create' then 'publishing' else status end where id=m.id;
 perform private.audit('integration_retry','meeting',m.id,jsonb_build_object('job_id',j.id));
 return jsonb_build_object('id',j.id,'status','pending');
end $$;

create function public.get_meeting_join_url(p_meeting_id uuid) returns text language plpgsql stable security definer set search_path='' as $$
declare m public.meetings; a public.announcements; v_url text; v_minutes int;
begin
 select * into m from public.meetings where id=p_meeting_id;
 select * into a from public.announcements where id=m.announcement_id;
 if not public.can_read_announcement(a.id) then raise exception 'ACCESS_DENIED'; end if;
 select greatest(0,least(60,(value#>>'{}')::int)) into v_minutes from public.platform_settings where key='join_minutes_before';
 if m.status<>'scheduled' or m.sync_status<>'synced' or a.status<>'published' or now()<m.starts_at-make_interval(mins=>coalesce(v_minutes,15)) or now()>m.ends_at then raise exception 'MEETING_NOT_JOINABLE'; end if;
 select meet_url into v_url from private.meeting_integrations where meeting_id=m.id;
 if v_url is null then raise exception 'MEETING_NOT_JOINABLE'; end if;
 return v_url;
end $$;

-- Service-only dispatch keeps tokens and operational payloads out of exposed schemas.
create function public.integration_command(p_action text,p_data jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare f private.oauth_flows; c private.google_connections; j private.integration_jobs; mi private.meeting_integrations; m public.meetings; a public.announcements; s public.teaching_spaces; inv private.teacher_invitations; v_id uuid; v_user uuid; v_result jsonb; v_ok boolean; v_event jsonb;
begin
 if auth.role()<>'service_role' then raise exception 'ACCESS_DENIED'; end if;
 if p_action='file_claim' then
  perform 1 from public.files where id=(p_data->>'file_id')::uuid and owner_id=(p_data->>'owner_id')::uuid for update;
  if not found then raise exception 'ACCESS_DENIED'; end if;
  if exists(select 1 from public.files where id=(p_data->>'file_id')::uuid and status='ready') then return jsonb_build_object('ready',true); end if;
  if not exists(select 1 from public.files where id=(p_data->>'file_id')::uuid and status='pending') then raise exception 'FILE_INVALID'; end if;
  if exists(select 1 from private.file_validation_leases where file_id=(p_data->>'file_id')::uuid and locked_until>now()) then raise exception 'RATE_LIMITED'; end if;
  v_id=gen_random_uuid();
  insert into private.file_validation_leases(file_id,lease_token,locked_until) values((p_data->>'file_id')::uuid,v_id,now()+interval '2 minutes') on conflict(file_id) do update set lease_token=excluded.lease_token,locked_until=excluded.locked_until;
  return jsonb_build_object('lease_token',v_id);
 elsif p_action='file_cleanup_claim' then
  perform 1 from public.files where id=(p_data->>'file_id')::uuid and storage_deleted_at is null and (status in ('deleted','rejected') or(status='pending' and created_at<now()-interval '24 hours')) for update;
  if not found or exists(select 1 from private.file_validation_leases where file_id=(p_data->>'file_id')::uuid and locked_until>now()) then return jsonb_build_object('cleanup',false); end if;
  update public.files set status='deleted' where id=(p_data->>'file_id')::uuid;
  insert into private.file_validation_leases(file_id,lease_token,locked_until) values((p_data->>'file_id')::uuid,gen_random_uuid(),now()+interval '2 minutes') on conflict(file_id) do update set locked_until=excluded.locked_until;
  return jsonb_build_object('cleanup',true);
 elsif p_action='file_cleanup_finish' then
  update public.files set storage_deleted_at=case when (p_data->>'success')::boolean then now() else null end,cleanup_failed=not(p_data->>'success')::boolean where id=(p_data->>'file_id')::uuid and status='deleted';
  delete from private.file_validation_leases where file_id=(p_data->>'file_id')::uuid;
  return '{}'::jsonb;
 elsif p_action='file_release' then
  delete from private.file_validation_leases where file_id=(p_data->>'file_id')::uuid and lease_token=(p_data->>'lease_token')::uuid;
  return '{}'::jsonb;
 elsif p_action='oauth_ticket' then
  if not exists(select 1 from public.account_access where user_id=(p_data->>'teacher_id')::uuid and role='teacher' and status='active') then raise exception 'ACCESS_DENIED'; end if;
  if (select count(*) from private.oauth_flows where teacher_id=(p_data->>'teacher_id')::uuid and created_at>now()-interval '1 hour')>10 then raise exception 'RATE_LIMITED'; end if;
  insert into private.oauth_flows(teacher_id,phase,token_hash,expires_at) values((p_data->>'teacher_id')::uuid,'ticket',p_data->>'token_hash',now()+interval '2 minutes');
  return '{}'::jsonb;
 elsif p_action='oauth_redirect' then
  update private.oauth_flows set consumed_at=now() where token_hash=p_data->>'ticket_hash' and phase='ticket' and consumed_at is null and expires_at>now() returning * into f;
  if f.id is null then raise exception 'OAUTH_FLOW_INVALID'; end if;
  insert into private.oauth_flows(teacher_id,phase,token_hash,proof_hash,nonce,expires_at) values(f.teacher_id,'state',p_data->>'state_hash',p_data->>'proof_hash',p_data->>'nonce',now()+interval '10 minutes');
  return jsonb_build_object('teacher_id',f.teacher_id);
 elsif p_action='oauth_consume' then
  update private.oauth_flows set consumed_at=now() where token_hash=p_data->>'state_hash' and proof_hash=p_data->>'proof_hash' and phase='state' and consumed_at is null and expires_at>now() returning * into f;
  if f.id is null then raise exception 'OAUTH_FLOW_INVALID'; end if;
  if not exists(select 1 from public.account_access where user_id=f.teacher_id and role='teacher' and status='active') then raise exception 'ACCESS_DENIED'; end if;
  return jsonb_build_object('teacher_id',f.teacher_id,'nonce',f.nonce);
 elsif p_action='connection_get' then
  select * into c from private.google_connections where teacher_id=(p_data->>'teacher_id')::uuid and is_current;
  return coalesce(to_jsonb(c),'null'::jsonb);
 elsif p_action='connection_save' then
  v_user=(p_data->>'teacher_id')::uuid;
  -- Serialize OAuth reconnects and prevent associating old event IDs with a different account.
  perform 1 from public.account_access where user_id=v_user and role='teacher' and status='active' for update;
  if not found then raise exception 'ACCESS_DENIED'; end if;
  select * into c from private.google_connections where teacher_id=v_user and is_current for update;
  if c.id is not null and c.google_subject<>p_data->>'google_subject' and exists(select 1 from private.meeting_integrations x join public.meetings mt on mt.id=x.meeting_id where x.connection_id=c.id and ((mt.ends_at>now() and mt.status<>'cancelled') or exists(select 1 from private.integration_jobs jb where jb.meeting_id=mt.id and jb.status in ('pending','running','error')))) then raise exception 'ACCOUNT_CHANGE_BLOCKED'; end if;
  update private.google_connections set is_current=false,ciphertext=null,iv=null,state='disconnected',updated_at=now() where teacher_id=v_user and google_subject<>p_data->>'google_subject' and is_current;
  insert into private.google_connections(teacher_id,google_subject,google_email,granted_scopes,ciphertext,iv,key_version)
  values(v_user,p_data->>'google_subject',p_data->>'google_email',array(select jsonb_array_elements_text(p_data->'scopes')),p_data->>'ciphertext',p_data->>'iv',p_data->>'key_version')
  on conflict(teacher_id,google_subject) do update set is_current=true,state='connected',google_email=excluded.google_email,granted_scopes=excluded.granted_scopes,ciphertext=excluded.ciphertext,iv=excluded.iv,key_version=excluded.key_version,updated_at=now() returning id into v_id;
  return jsonb_build_object('id',v_id);
 elsif p_action='tokens_update' then
  update private.google_connections set ciphertext=p_data->>'ciphertext',iv=p_data->>'iv',key_version=p_data->>'key_version',updated_at=now() where id=(p_data->>'connection_id')::uuid and state='connected';
  return '{}'::jsonb;
 elsif p_action='connection_error' then
  update private.google_connections set state='reconnect_required',updated_at=now() where id=(p_data->>'connection_id')::uuid;
  return '{}'::jsonb;
 elsif p_action='connection_disconnect' then
  update private.google_connections set ciphertext=null,iv=null,state='disconnected',updated_at=now() where teacher_id=(p_data->>'teacher_id')::uuid and is_current;
  return '{}'::jsonb;
 elsif p_action='invite_begin' then
  if not exists(select 1 from public.account_access where user_id=(p_data->>'admin_id')::uuid and role='admin' and status='active') then raise exception 'ACCESS_DENIED'; end if;
  if exists(select 1 from auth.users where lower(email)=lower(p_data->>'email')) then raise exception 'INVALID_REQUEST'; end if;
  if (select count(*) from private.teacher_invitations where created_by=(p_data->>'admin_id')::uuid and created_at>now()-interval '1 hour')>=30 then raise exception 'RATE_LIMITED'; end if;
  insert into private.teacher_invitations(email,display_name,created_by) values(lower(p_data->>'email'),p_data->>'display_name',(p_data->>'admin_id')::uuid) returning id into v_id;
  return jsonb_build_object('id',v_id);
 elsif p_action='invite_complete' then
  select * into inv from private.teacher_invitations where id=(p_data->>'id')::uuid and status='pending' for update;
  if inv.id is null or not exists(select 1 from auth.users where id=(p_data->>'user_id')::uuid and lower(email)=inv.email) then raise exception 'INVALID_REQUEST'; end if;
  if not exists(select 1 from public.account_access where user_id=inv.created_by and role='admin' and status='active') then raise exception 'ACCESS_DENIED'; end if;
  update public.account_access set role='teacher',status='active',activated_at=now() where user_id=(p_data->>'user_id')::uuid and status='pending';
  if not found then raise exception 'ACCESS_DENIED'; end if;
  update public.profiles set display_name=inv.display_name where id=(p_data->>'user_id')::uuid;
  update private.teacher_invitations set status='sent',user_id=(p_data->>'user_id')::uuid where id=inv.id;
  insert into private.audit_events(actor_id,action,resource_type,resource_id) values(inv.created_by,'teacher_invited','profile',(p_data->>'user_id')::uuid);
  return jsonb_build_object('id',inv.id,'status','sent');
 elsif p_action='invite_failed' then
  update private.teacher_invitations set status='failed' where id=(p_data->>'id')::uuid and status='pending'; return '{}'::jsonb;
 elsif p_action='job_claim' then
  -- Connection-level lease serializes Google token refresh and all event writes for a teacher.
  select x.* into j from private.integration_jobs x left join private.meeting_integrations xx on xx.meeting_id=x.meeting_id left join private.google_connections cc on cc.id=xx.connection_id
  where (x.status='pending' or(x.status='running' and x.locked_until<now())) and x.next_attempt_at<=now() and (cc.locked_until is null or cc.locked_until<now()) order by x.next_attempt_at,x.created_at limit 1 for update of x skip locked;
  if j.id is null then return 'null'::jsonb; end if;
  select * into mi from private.meeting_integrations where meeting_id=j.meeting_id;
  if mi.connection_id is not null then
   select * into c from private.google_connections where id=mi.connection_id for update skip locked;
   if c.id is null or c.locked_until>now() then return 'null'::jsonb; end if;
   update private.google_connections set locked_until=now()+interval '90 seconds' where id=c.id;
  end if;
  update private.integration_jobs set status='running',attempt_count=attempt_count+1,locked_until=now()+interval '90 seconds',lease_token=gen_random_uuid(),updated_at=now() where id=j.id returning * into j;
  select * into m from public.meetings where id=j.meeting_id;
  select * into a from public.announcements where id=m.announcement_id;
  select * into s from public.teaching_spaces where id=a.teaching_space_id;
  v_ok=s.is_active and exists(select 1 from public.account_access where user_id=s.teacher_id and role='teacher' and status='active');
  return jsonb_build_object('job',to_jsonb(j),'meeting',to_jsonb(m),'announcement',to_jsonb(a),'connection',to_jsonb(c),'integration',to_jsonb(mi),'allowed',v_ok);
 elsif p_action in ('job_finish','job_retry','job_error','job_superseded') then
  select * into j from private.integration_jobs where id=(p_data->>'job_id')::uuid and lease_token=(p_data->>'lease_token')::uuid and status='running' for update;
  if j.id is null then raise exception 'WORKER_LEASE_LOST'; end if;
  select * into m from public.meetings where id=j.meeting_id for update;
  select * into a from public.announcements where id=m.announcement_id;
  select * into s from public.teaching_spaces where id=a.teaching_space_id;
  select * into mi from private.meeting_integrations where meeting_id=m.id;
  if mi.connection_id is not null then update private.google_connections set locked_until=null where id=mi.connection_id; end if;
  if p_action='job_finish' then
   if p_data->>'etag' is not null then update private.meeting_integrations set google_etag=p_data->>'etag' where meeting_id=m.id; end if;
   if j.requested_revision<>m.revision or(m.status='cancelled' and j.operation<>'cancel') or(not s.is_active and j.operation<>'cancel') or(not exists(select 1 from public.account_access where user_id=s.teacher_id and role='teacher' and status='active') and j.operation<>'cancel') then
    update private.integration_jobs set status='superseded',locked_until=null,updated_at=now() where id=j.id;
    -- A late external creation must be removed when the account/assignment has been revoked or the local meeting cancelled.
    if m.status='cancelled' or not s.is_active or not exists(select 1 from public.account_access where user_id=s.teacher_id and role='teacher' and status='active') then
     update public.meetings set status='cancelled',sync_status='pending' where id=m.id;
     insert into private.integration_jobs(meeting_id,requested_by,operation,requested_revision,idempotency_key) values(m.id,j.requested_by,'cancel',m.revision,'compensate-'||j.id) on conflict do nothing;
    end if;
    return jsonb_build_object('status','superseded');
   end if;
   if j.operation='cancel' then
    update private.meeting_integrations set meet_url=null,updated_at=now() where meeting_id=m.id;
    update public.meetings set sync_status='synced',last_error_code=null where id=m.id;
   else
    if coalesce(p_data->>'meet_url','') !~ '^https://meet[.]google[.]com/[a-z]{3}-[a-z]{4}-[a-z]{3}$' then raise exception 'INVALID_REQUEST'; end if;
    update private.meeting_integrations set meet_url=p_data->>'meet_url',google_etag=p_data->>'etag',synced_start=m.starts_at,synced_end=m.ends_at,updated_at=now() where meeting_id=m.id;
    update public.meetings set status='scheduled',sync_status='synced',last_error_code=null where id=m.id;
    update public.announcements set status='published',published_at=coalesce(published_at,now()) where id=a.id;
    if j.operation<>'reconcile' then perform private.notify_space(a.teaching_space_id,case when j.operation='create' then 'meeting_created' else 'meeting_updated' end,'meeting',m.id,'meeting:'||m.id||':'||m.revision); end if;
   end if;
   update private.integration_jobs set status='completed',locked_until=null,last_error_code=null,updated_at=now() where id=j.id;
  elsif p_action='job_superseded' then update private.integration_jobs set status='superseded',locked_until=null,updated_at=now() where id=j.id;
  else
   update private.integration_jobs set status=case when p_action='job_retry' and attempt_count<8 then 'pending' else 'error' end,
    next_attempt_at=now()+make_interval(secs=>least(3600,greatest(5,coalesce((p_data->>'retry_seconds')::int,30)))),locked_until=null,last_error_code=p_data->>'code',updated_at=now() where id=j.id returning * into j;
   update public.meetings set sync_status=case when j.status='error' then 'error' else 'pending' end,last_error_code=p_data->>'code',status=case when j.status='error' and status='publishing' then 'error' else status end where id=m.id and revision=j.requested_revision;
  end if;
  return jsonb_build_object('status',j.status);
 elsif p_action='schedule_reconciliation' then
  insert into private.integration_jobs(meeting_id,requested_by,operation,requested_revision,idempotency_key)
  select mt.id,sp.teacher_id,'reconcile',mt.revision,'reconcile-'||mt.id||'-'||to_char(now(),'YYYYMMDDHH24') from public.meetings mt join public.announcements an on an.id=mt.announcement_id join public.teaching_spaces sp on sp.id=an.teaching_space_id join private.meeting_integrations ig on ig.meeting_id=mt.id
  where mt.status='scheduled' and mt.ends_at>now() and mt.starts_at<now()+interval '30 days' and not exists(select 1 from private.integration_jobs jo where jo.meeting_id=mt.id and jo.status in ('pending','running')) on conflict do nothing;
  delete from private.oauth_flows where expires_at<now()-interval '1 day';
  return '{}'::jsonb;
 else raise exception 'INVALID_REQUEST'; end if;
end $$;

revoke all on function public.integration_command(text,jsonb) from public,anon,authenticated;
grant execute on function public.integration_command(text,jsonb) to service_role;
revoke all on function public.google_connection_status(),public.integration_status(),public.queue_meeting_operation(uuid,text,int,text,jsonb),public.retry_integration_job(uuid),public.get_meeting_join_url(uuid) from public,anon;
grant execute on function public.google_connection_status(),public.integration_status(),public.queue_meeting_operation(uuid,text,int,text,jsonb),public.retry_integration_job(uuid),public.get_meeting_join_url(uuid) to authenticated;
