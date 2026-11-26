-- Teachers can publish an existing Meet link without any Google OAuth credentials.
-- URLs stay private: students receive them only through the existing join gate.
alter table public.meetings add column link_source text not null default 'google'
  check (link_source in ('google','manual'));

create table private.manual_meeting_links (
  meeting_id uuid primary key references public.meetings(id) on delete cascade,
  meet_url text not null check (meet_url ~ '^https://meet[.]google[.]com/[a-z]{3}-[a-z]{4}-[a-z]{3}$'),
  updated_at timestamptz not null default now()
);
revoke all on private.manual_meeting_links from public,anon,authenticated;

-- Unpublished sessions with no Google event can use the simpler workflow too.
update public.meetings m set link_source='manual'
where m.status in ('draft','error')
and not exists(select 1 from private.meeting_integrations i where i.meeting_id=m.id);

-- A legacy Google command must never enqueue work for a manually managed session.
create function private.require_google_meeting() returns trigger
language plpgsql set search_path='' as $$
begin
  if not exists(select 1 from public.meetings where id=new.meeting_id and link_source='google') then
    raise exception 'MEETING_WORKFLOW_REQUIRED';
  end if;
  return new;
end $$;
create trigger google_meeting_source before insert or update on private.meeting_integrations
for each row execute function private.require_google_meeting();
create trigger google_job_source before insert or update on private.integration_jobs
for each row execute function private.require_google_meeting();
revoke all on function private.require_google_meeting() from public,anon,authenticated;

create function public.get_manual_meeting_link(p_meeting_id uuid) returns text
language plpgsql stable security definer set search_path='' as $$
declare a public.announcements;
begin
  select an.* into a from public.announcements an join public.meetings m on m.announcement_id=an.id
    where m.id=p_meeting_id and m.link_source='manual';
  if a.id is null or not public.can_manage_space(a.teaching_space_id) then raise exception 'ACCESS_DENIED'; end if;
  return (select meet_url from private.manual_meeting_links where meeting_id=p_meeting_id);
end $$;

create function public.save_manual_meeting(p_data jsonb,p_publish boolean default false,p_id uuid default null,p_expected_version int default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare m public.meetings; a public.announcements; sp uuid; v_url text; v_match text[]; v_published boolean;
begin
  if not public.is_active_role('teacher') then raise exception 'ACCESS_DENIED'; end if;
  if p_data is null or jsonb_typeof(p_data)<>'object' or p_publish is null then raise exception 'INVALID_REQUEST'; end if;
  if coalesce(length(trim(p_data->>'title')),0) not between 1 and 200 or coalesce(length(p_data->>'body'),0)>20000 then raise exception 'INVALID_REQUEST'; end if;
  if p_data->>'starts_at' is null or p_data->>'ends_at' is null or (p_data->>'ends_at')::timestamptz<=(p_data->>'starts_at')::timestamptz then raise exception 'INVALID_MEETING_TIME'; end if;
  v_url=nullif(trim(p_data->>'meet_url'),'');
  if v_url is not null then
    if length(v_url)>2048 then raise exception 'INVALID_MEET_URL'; end if;
    v_match=regexp_match(v_url,'^https://meet[.]google[.]com/([a-z]{3}-[a-z]{4}-[a-z]{3})/?([?#][^[:space:]]*)?$');
    if v_match is null then raise exception 'INVALID_MEET_URL'; end if;
    v_url='https://meet.google.com/'||v_match[1];
  end if;
  if (select count(*) from private.audit_events where actor_id=auth.uid() and action='manual_meeting_saved' and created_at>now()-interval '1 hour')>=60 then raise exception 'RATE_LIMITED'; end if;
  if p_id is null then
    sp=(p_data->>'teaching_space_id')::uuid;
    if sp is null or not public.can_manage_space(sp) then raise exception 'ACCESS_DENIED'; end if;
    v_published=false;
    insert into public.announcements(teaching_space_id,type,title,body,created_by)
      values(sp,'live_session',trim(p_data->>'title'),coalesce(p_data->>'body',''),auth.uid()) returning * into a;
    insert into public.meetings(announcement_id,course_id,starts_at,ends_at,timezone,link_source)
      values(a.id,nullif(p_data->>'course_id','')::uuid,(p_data->>'starts_at')::timestamptz,(p_data->>'ends_at')::timestamptz,coalesce(p_data->>'timezone','Africa/Casablanca'),'manual') returning * into m;
  else
    select * into m from public.meetings where id=p_id for update;
    select * into a from public.announcements where id=m.announcement_id for update;
    if a.id is null or not public.can_manage_space(a.teaching_space_id) then raise exception 'ACCESS_DENIED'; end if;
    perform private.assert_version(m.row_version,p_expected_version);
    if m.link_source<>'manual' or m.status not in ('draft','error','scheduled') or a.status='archived' then raise exception 'MEETING_WORKFLOW_REQUIRED'; end if;
    if p_data ? 'teaching_space_id' and (p_data->>'teaching_space_id')::uuid is distinct from a.teaching_space_id then raise exception 'SPACE_IMMUTABLE'; end if;
    v_published=m.status='scheduled';
    update public.announcements set title=trim(p_data->>'title'),body=coalesce(p_data->>'body',''),row_version=row_version+1,updated_at=now() where id=a.id;
    update public.meetings set course_id=nullif(p_data->>'course_id','')::uuid,
      starts_at=(p_data->>'starts_at')::timestamptz,ends_at=(p_data->>'ends_at')::timestamptz,
      timezone=coalesce(p_data->>'timezone','Africa/Casablanca'),row_version=row_version+1,revision=revision+1,updated_at=now() where id=m.id returning * into m;
  end if;
  if p_publish or v_published then
    if v_url is null then raise exception 'MEET_URL_REQUIRED'; end if;
    if m.ends_at<=now() then raise exception 'MEETING_ENDED'; end if;
    update public.meetings set status='scheduled',sync_status='synced',last_error_code=null where id=m.id returning * into m;
    update public.announcements set status='published',published_at=coalesce(published_at,now()),updated_at=now() where id=a.id;
    perform private.notify_space(a.teaching_space_id,case when v_published then 'meeting_updated' else 'meeting_created' end,'meeting',m.id,'meeting:'||m.id||':'||m.revision);
  else
    update public.meetings set status='draft',sync_status=case when v_url is null then 'pending' else 'synced' end,last_error_code=null where id=m.id returning * into m;
  end if;
  if v_url is null then delete from private.manual_meeting_links where meeting_id=m.id;
  else insert into private.manual_meeting_links(meeting_id,meet_url) values(m.id,v_url)
    on conflict(meeting_id) do update set meet_url=excluded.meet_url,updated_at=now();
  end if;
  perform private.audit('manual_meeting_saved','meeting',m.id,jsonb_build_object('published',m.status='scheduled'));
  return to_jsonb(m);
end $$;

create function public.cancel_manual_meeting(p_meeting_id uuid,p_expected_version int) returns jsonb
language plpgsql security definer set search_path='' as $$
declare m public.meetings; a public.announcements;
begin
  select * into m from public.meetings where id=p_meeting_id for update;
  select * into a from public.announcements where id=m.announcement_id;
  if a.id is null or not public.can_manage_space(a.teaching_space_id) then raise exception 'ACCESS_DENIED'; end if;
  if m.link_source<>'manual' then raise exception 'MEETING_WORKFLOW_REQUIRED'; end if;
  if m.status='cancelled' then return to_jsonb(m); end if;
  perform private.assert_version(m.row_version,p_expected_version);
  update public.meetings set status='cancelled',sync_status='synced',row_version=row_version+1,revision=revision+1,updated_at=now() where id=m.id returning * into m;
  delete from private.manual_meeting_links where meeting_id=m.id;
  if a.status='published' then
    perform private.notify_space(a.teaching_space_id,'meeting_cancelled','meeting',m.id,'meeting-cancelled:'||m.id||':'||m.revision);
  end if;
  perform private.audit('manual_meeting_cancelled','meeting',m.id);
  return to_jsonb(m);
end $$;

create or replace function public.get_meeting_join_url(p_meeting_id uuid) returns text
language plpgsql stable security definer set search_path='' as $$
declare m public.meetings; a public.announcements; v_url text; v_minutes int;
begin
  select * into m from public.meetings where id=p_meeting_id;
  select * into a from public.announcements where id=m.announcement_id;
  if not public.can_read_announcement(a.id) then raise exception 'ACCESS_DENIED'; end if;
  select greatest(0,least(60,(value#>>'{}')::int)) into v_minutes from public.platform_settings where key='join_minutes_before';
  if m.status<>'scheduled' or m.sync_status<>'synced' or a.status<>'published' or now()<m.starts_at-make_interval(mins=>coalesce(v_minutes,15)) or now()>m.ends_at then raise exception 'MEETING_NOT_JOINABLE'; end if;
  if m.link_source='manual' then select meet_url into v_url from private.manual_meeting_links where meeting_id=m.id;
  else select meet_url into v_url from private.meeting_integrations where meeting_id=m.id; end if;
  if v_url is null then raise exception 'MEETING_NOT_JOINABLE'; end if;
  return v_url;
end $$;

revoke all on function public.get_manual_meeting_link(uuid),public.save_manual_meeting(jsonb,boolean,uuid,int),public.cancel_manual_meeting(uuid,int) from public,anon;
grant execute on function public.get_manual_meeting_link(uuid),public.save_manual_meeting(jsonb,boolean,uuid,int),public.cancel_manual_meeting(uuid,int) to authenticated;
