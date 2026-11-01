-- Safe self-service profile update. Role, status, email and assignments are never accepted.
create function public.save_profile(p_display_name text,p_language text default 'fr') returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.profiles;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 if length(trim(p_display_name)) not between 1 and 120 or p_language not in ('fr','ar') then raise exception 'INVALID_REQUEST'; end if;
 update public.profiles set display_name=trim(p_display_name),preferred_language=p_language,updated_at=now() where id=auth.uid() returning * into p;
 if p.id is null then raise exception 'AUTH_REQUIRED'; end if;
 return jsonb_build_object('id',p.id,'display_name',p.display_name,'preferred_language',p.preferred_language);
end $$;
revoke all on function public.save_profile(text,text) from public,anon;
grant execute on function public.save_profile(text,text) to authenticated;

-- Aggregate using the caller's RLS context, independent of UI page size.
create function public.dashboard_counts() returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object(
 'students',(select count(*) from public.account_access where role='student' and status='active'),
 'teachers',(select count(*) from public.account_access where role='teacher' and status='active'),
 'classes',(select count(*) from public.classes where status='active'),
 'admissions',(select count(*) from public.admission_requests where status='pending'),
 'courses',(select count(*) from public.courses where status='published'),
 'spaces',(select count(*) from public.teaching_spaces where is_active),
 'copies',(select count(*) from public.submissions where status='submitted'),
 'class_enrollments',coalesce((select jsonb_object_agg(class_id,n) from (select class_id,count(*) n from public.class_enrollments where status='active' group by class_id) q),'{}'::jsonb));
$$;
revoke all on function public.dashboard_counts() from public,anon;
grant execute on function public.dashboard_counts() to authenticated;

-- An exercise/competition statement includes its attachments. Freeze them after receipt.
create or replace function public.can_manage_file_target(p_target_type text,p_target_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select case p_target_type
 when 'course' then exists(select 1 from public.courses c where c.id=p_target_id and public.can_manage_space(c.teaching_space_id))
 when 'exercise' then exists(select 1 from public.exercises e join public.courses c on c.id=e.course_id where e.id=p_target_id and public.can_manage_space(c.teaching_space_id)) and not exists(select 1 from public.submissions s join public.submission_versions v on v.submission_id=s.id where s.exercise_id=p_target_id and v.submitted_at is not null)
 when 'competition' then exists(select 1 from public.competitions c where c.id=p_target_id and public.can_manage_space(c.teaching_space_id)) and not exists(select 1 from public.submissions s join public.submission_versions v on v.submission_id=s.id where s.competition_id=p_target_id and v.submitted_at is not null)
 when 'announcement' then exists(select 1 from public.announcements a where a.id=p_target_id and public.can_manage_space(a.teaching_space_id))
 when 'submission_version' then exists(select 1 from public.submission_versions v join public.submissions s on s.id=v.submission_id where v.id=p_target_id and v.submitted_at is null and s.student_id=auth.uid() and public.can_read_submission(s.id))
 else false end;
$$;

create function private.validate_meeting() returns trigger language plpgsql set search_path='' as $$
begin
 if not exists(select 1 from pg_timezone_names where name=new.timezone) then raise exception 'INVALID_TIMEZONE'; end if;
 if new.course_id is not null and not exists(select 1 from public.courses c join public.announcements a on a.teaching_space_id=c.teaching_space_id where c.id=new.course_id and a.id=new.announcement_id) then raise exception 'COURSE_SPACE_MISMATCH'; end if;
 return new;
end $$;
create trigger meeting_context_check before insert or update on public.meetings for each row execute function private.validate_meeting();
revoke all on function private.validate_meeting() from public,anon,authenticated;

-- Email is a support/admin projection, never a public profile column.
create function public.admin_directory(p_limit int default 100,p_offset int default 0) returns table(id uuid,email text) language plpgsql stable security definer set search_path='' as $$
begin
 perform private.assert_admin();
 return query select p.id,u.email::text from public.profiles p join auth.users u on u.id=p.id order by p.id limit greatest(1,least(p_limit,100)) offset greatest(0,p_offset);
end $$;
revoke all on function public.admin_directory(int,int) from public,anon;
grant execute on function public.admin_directory(int,int) to authenticated;
