-- Kon-fanan core. All client mutations are validated commands, not table writes.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table public.profiles (
 id uuid primary key references auth.users(id) on delete restrict,
 display_name text not null check (length(display_name) between 1 and 120),
 preferred_language text not null default 'fr' check (preferred_language in ('fr','ar')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.account_access (
 user_id uuid primary key references public.profiles(id), role text not null default 'student' check(role in ('admin','teacher','student')),
 status text not null default 'pending' check(status in ('pending','active','rejected','suspended','archived')),
 activated_at timestamptz, suspended_at timestamptz, created_at timestamptz not null default now()
);
create table public.academic_years (
 id uuid primary key default gen_random_uuid(), label text not null unique, starts_on date not null, ends_on date not null,
 is_current boolean not null default false, status text not null default 'active' check(status in ('active','archived')),
 row_version integer not null default 1, created_at timestamptz not null default now(), check(starts_on<ends_on)
);
create unique index one_current_year on public.academic_years(is_current) where is_current;
create table public.levels (
 id uuid primary key default gen_random_uuid(), code text not null unique, label text not null,
 cycle text not null check(cycle in ('college','lycee')), sort_order int not null default 0, is_active boolean not null default true
);
create table public.subjects (
 id uuid primary key default gen_random_uuid(), code text not null unique, label text not null, is_active boolean not null default true
);
create table public.classes (
 id uuid primary key default gen_random_uuid(), academic_year_id uuid not null references public.academic_years(id),
 level_id uuid not null references public.levels(id), name text not null check(length(trim(name)) between 1 and 120),
 capacity int not null check(capacity>0 and capacity<=1000), status text not null default 'active' check(status in ('active','archived')),
 row_version int not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(academic_year_id,name), unique(id,academic_year_id)
);
create table public.class_subjects (
 id uuid primary key default gen_random_uuid(), class_id uuid not null references public.classes(id),
 subject_id uuid not null references public.subjects(id), is_active boolean not null default true, unique(class_id,subject_id), unique(id,class_id)
);
create table public.teaching_spaces (
 id uuid primary key default gen_random_uuid(), class_subject_id uuid not null references public.class_subjects(id),
 teacher_id uuid not null references public.profiles(id), is_active boolean not null default true,
 assigned_by uuid references public.profiles(id), assigned_at timestamptz not null default now(), unique(class_subject_id,teacher_id)
);
create table public.class_enrollments (
 id uuid primary key default gen_random_uuid(), student_id uuid not null references public.profiles(id), class_id uuid not null,
 academic_year_id uuid not null, status text not null default 'active' check(status in ('active','ended')),
 joined_at timestamptz not null default now(), ended_at timestamptz,
 foreign key(class_id,academic_year_id) references public.classes(id,academic_year_id), unique(id,class_id)
);
create unique index one_enrollment_per_year on public.class_enrollments(student_id,academic_year_id) where status='active';
create table public.student_subject_access (
 id uuid primary key default gen_random_uuid(), enrollment_id uuid not null, class_subject_id uuid not null,
 class_id uuid not null, status text not null default 'active' check(status in ('active','revoked')),
 granted_by uuid references public.profiles(id), granted_at timestamptz not null default now(), revoked_at timestamptz,
 foreign key(enrollment_id,class_id) references public.class_enrollments(id,class_id),
 foreign key(class_subject_id,class_id) references public.class_subjects(id,class_id), unique(enrollment_id,class_subject_id)
);
create table public.admission_requests (
 id uuid primary key default gen_random_uuid(), student_id uuid not null references public.profiles(id),
 requested_class_id uuid not null references public.classes(id), status text not null default 'pending' check(status in ('pending','accepted','rejected','withdrawn')),
 decided_by uuid references public.profiles(id), decided_at timestamptz, public_message text not null default '',
 accepted_enrollment_id uuid references public.class_enrollments(id), created_at timestamptz not null default now()
);
create unique index one_pending_admission on public.admission_requests(student_id) where status='pending';
create table public.platform_settings (key text primary key, value jsonb not null, updated_at timestamptz not null default now());
insert into public.platform_settings(key,value) values ('timezone','"Africa/Casablanca"'),('join_minutes_before','15'),('max_files','5'),('max_total_bytes','31457280');
create table public.courses (
 id uuid primary key default gen_random_uuid(), teaching_space_id uuid not null references public.teaching_spaces(id),
 title text not null default '', summary text not null default '', chapter_label text not null default '', body text not null default '',
 content_language text not null default 'fr' check(content_language in ('fr','ar','darija')),
 video_provider text check(video_provider in ('youtube','vimeo')), video_id text, position integer not null default 0,
 status text not null default 'draft' check(status in ('draft','published','archived')), published_at timestamptz,
 created_by uuid not null references public.profiles(id), row_version int not null default 1,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(video_id is null or (video_provider='youtube' and video_id ~ '^[A-Za-z0-9_-]{11}$') or (video_provider='vimeo' and video_id ~ '^[0-9]{1,15}$'))
);
create table public.exercises (
 id uuid primary key default gen_random_uuid(), course_id uuid not null references public.courses(id),
 title text not null default '', instructions text not null default '', position int not null default 0, difficulty text not null default 'standard',
 due_at timestamptz, allow_late boolean not null default false, max_score numeric not null default 20 check(max_score>0 and max_score<=1000),
 status text not null default 'draft' check(status in ('draft','published','archived')), published_at timestamptz,
 row_version int not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.course_progress (
 student_id uuid not null references public.profiles(id), course_id uuid not null references public.courses(id),
 status text not null check(status in ('started','completed')), started_at timestamptz not null default now(), completed_at timestamptz,
 primary key(student_id,course_id)
);
create table public.competitions (
 id uuid primary key default gen_random_uuid(), teaching_space_id uuid not null references public.teaching_spaces(id),
 kind text not null default 'challenge' check(kind in ('challenge','contest')), title text not null default '', summary text not null default '',
 instructions text not null default '', rules text not null default '', opens_at timestamptz not null, closes_at timestamptz not null,
 max_score numeric not null default 20 check(max_score>0 and max_score<=1000),
 status text not null default 'draft' check(status in ('draft','published','closed','archived','cancelled')),
 leaderboard_enabled boolean not null default false, results_published_at timestamptz, row_version int not null default 1,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(opens_at<closes_at)
);
create table public.submissions (
 id uuid primary key default gen_random_uuid(), student_id uuid not null references public.profiles(id),
 exercise_id uuid references public.exercises(id), competition_id uuid references public.competitions(id),
 status text not null default 'draft' check(status in ('draft','submitted','changes_requested','reviewed')),
 latest_version_id uuid, resubmit_until timestamptz, resubmit_requested_by uuid references public.profiles(id),
 row_version int not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(num_nonnulls(exercise_id,competition_id)=1)
);
create unique index unique_exercise_submission on public.submissions(student_id,exercise_id) where exercise_id is not null;
create unique index unique_competition_submission on public.submissions(student_id,competition_id) where competition_id is not null;
create table public.submission_versions (
 id uuid primary key default gen_random_uuid(), submission_id uuid not null references public.submissions(id),
 version_number int not null check(version_number>0), student_comment text not null default '', submitted_at timestamptz,
 is_late boolean not null default false, max_score_snapshot numeric, statement_snapshot text,
 created_at timestamptz not null default now(), unique(submission_id,version_number), unique(id,submission_id)
);
create unique index one_draft_version on public.submission_versions(submission_id) where submitted_at is null;
alter table public.submissions add constraint latest_version_belongs foreign key(latest_version_id,id) references public.submission_versions(id,submission_id) deferrable initially deferred;
create table public.evaluations (
 id uuid primary key default gen_random_uuid(), submission_version_id uuid not null unique references public.submission_versions(id),
 reviewer_id uuid not null references public.profiles(id), feedback text not null default '', score numeric,
 max_score numeric not null check(max_score>0), status text not null default 'draft' check(status in ('draft','published')),
 published_at timestamptz, row_version int not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(score is null or (score>=0 and score<=max_score))
);
create table public.announcements (
 id uuid primary key default gen_random_uuid(), teaching_space_id uuid not null references public.teaching_spaces(id),
 type text not null default 'notice' check(type in ('notice','live_session')), title text not null default '', body text not null default '',
 status text not null default 'draft' check(status in ('draft','published','archived')), published_at timestamptz,
 created_by uuid not null references public.profiles(id), row_version int not null default 1,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.meetings (
 id uuid primary key default gen_random_uuid(), announcement_id uuid not null unique references public.announcements(id), course_id uuid references public.courses(id),
 starts_at timestamptz not null, ends_at timestamptz not null, timezone text not null default 'Africa/Casablanca',
 status text not null default 'draft' check(status in ('draft','publishing','scheduled','cancelled','finished','error')),
 sync_status text not null default 'pending', revision int not null default 1, row_version int not null default 1, last_error_code text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(starts_at<ends_at)
);
create table public.notifications (
 id uuid primary key default gen_random_uuid(), recipient_id uuid not null references public.profiles(id), type text not null,
 target_type text not null, target_id uuid, dedupe_key text not null, created_at timestamptz not null default now(), read_at timestamptz,
 unique(recipient_id,dedupe_key)
);
create table public.files (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id),
 bucket text not null check(bucket in ('course-materials','student-submissions','announcement-materials')),
 object_path text not null unique, original_name text not null check(length(original_name) between 1 and 255),
 mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp','application/pdf')),
 size_bytes bigint not null check(size_bytes>0), status text not null default 'pending' check(status in ('pending','ready','rejected','deleted')),
 target_type text not null check(target_type in ('submission_version','course','exercise','competition','announcement')), target_id uuid not null,
 created_at timestamptz not null default now()
);
create table public.submission_files (id uuid primary key default gen_random_uuid(), submission_version_id uuid not null references public.submission_versions(id), file_id uuid not null unique references public.files(id), position int not null default 0);
create table public.course_resources (id uuid primary key default gen_random_uuid(), course_id uuid not null references public.courses(id), file_id uuid not null unique references public.files(id), label text not null default '', position int not null default 0);
create table public.exercise_resources (id uuid primary key default gen_random_uuid(), exercise_id uuid not null references public.exercises(id), file_id uuid not null unique references public.files(id), label text not null default '', position int not null default 0);
create table public.competition_resources (id uuid primary key default gen_random_uuid(), competition_id uuid not null references public.competitions(id), file_id uuid not null unique references public.files(id), label text not null default '', position int not null default 0);
create table public.announcement_resources (id uuid primary key default gen_random_uuid(), announcement_id uuid not null references public.announcements(id), file_id uuid not null unique references public.files(id), label text not null default '', position int not null default 0);
create table private.notification_outbox (
 id uuid primary key default gen_random_uuid(), recipient_id uuid not null, type text not null, target_type text not null, target_id uuid,
 dedupe_key text not null, status text not null default 'pending', created_at timestamptz not null default now(), delivered_at timestamptz,
 unique(recipient_id,dedupe_key)
);
create table private.audit_events (
 id uuid primary key default gen_random_uuid(), actor_id uuid, action text not null, resource_type text not null, resource_id uuid,
 changes jsonb not null default '{}', created_at timestamptz not null default now(), request_id uuid not null default gen_random_uuid()
);
create index access_lookup on public.student_subject_access(class_subject_id,enrollment_id) where status='active';
create index enrollment_lookup on public.class_enrollments(student_id,class_id) where status='active';
create index enrollment_capacity on public.class_enrollments(class_id) where status='active';
create index space_teacher on public.teaching_spaces(teacher_id,class_subject_id) where is_active;
create index course_listing on public.courses(teaching_space_id,status,published_at);
create index exercise_course on public.exercises(course_id);
create index submission_student on public.submissions(student_id,updated_at);
create index submission_exercise on public.submissions(exercise_id);
create index submission_competition on public.submissions(competition_id);
create index notification_recipient on public.notifications(recipient_id,read_at,created_at);
create index file_target on public.files(target_type,target_id);
create index announcement_listing on public.announcements(teaching_space_id,status,published_at);

-- Ignore ALL role/status claims in user-controlled metadata.
create function private.on_signup() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,display_name) values(new.id,left(coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'),''),'Étudiant'),120)) on conflict do nothing;
 insert into public.account_access(user_id,role,status) values(new.id,'student','pending') on conflict do nothing;
 return new;
end $$;
create trigger kon_fanan_signup after insert on auth.users for each row execute function private.on_signup();

create function public.is_active_role(p_role text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.account_access where user_id=auth.uid() and role=p_role and status='active');
$$;
create function public.has_subject_access(p_class_subject_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select public.is_active_role('student') and exists(
 select 1 from public.student_subject_access a join public.class_enrollments e on e.id=a.enrollment_id
 join public.class_subjects cs on cs.id=a.class_subject_id join public.classes c on c.id=cs.class_id
 join public.academic_years y on y.id=c.academic_year_id join public.subjects s on s.id=cs.subject_id
 where a.class_subject_id=p_class_subject_id and a.status='active' and e.status='active' and e.student_id=auth.uid()
 and cs.is_active and s.is_active and c.status='active' and y.status='active');
$$;
create function public.can_manage_space(p_space_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select public.is_active_role('admin') or (public.is_active_role('teacher') and exists(
 select 1 from public.teaching_spaces t join public.class_subjects cs on cs.id=t.class_subject_id
 join public.classes c on c.id=cs.class_id join public.academic_years y on y.id=c.academic_year_id
 where t.id=p_space_id and t.teacher_id=auth.uid() and t.is_active and cs.is_active and c.status='active' and y.status='active'));
$$;
create function public.can_read_space(p_space_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select public.can_manage_space(p_space_id) or exists(select 1 from public.teaching_spaces t where t.id=p_space_id and public.has_subject_access(t.class_subject_id));
$$;
create function public.can_read_course(p_course_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.courses c where c.id=p_course_id and (public.can_manage_space(c.teaching_space_id) or (c.status='published' and public.can_read_space(c.teaching_space_id))));
$$;
create function public.can_read_exercise(p_exercise_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.exercises e join public.courses c on c.id=e.course_id where e.id=p_exercise_id
 and (public.can_manage_space(c.teaching_space_id) or (e.status='published' and c.status='published' and public.can_read_space(c.teaching_space_id))));
$$;
create function public.can_read_competition(p_competition_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.competitions c where c.id=p_competition_id and (public.can_manage_space(c.teaching_space_id) or (c.status in ('published','closed') and public.can_read_space(c.teaching_space_id))));
$$;
create function public.can_read_announcement(p_announcement_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.announcements a where a.id=p_announcement_id and (public.can_manage_space(a.teaching_space_id) or (a.status='published' and public.can_read_space(a.teaching_space_id))));
$$;
create function public.can_manage_submission(p_submission_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.submissions s left join public.exercises e on e.id=s.exercise_id left join public.courses c on c.id=e.course_id
 left join public.competitions cp on cp.id=s.competition_id where s.id=p_submission_id and public.can_manage_space(coalesce(c.teaching_space_id,cp.teaching_space_id)));
$$;
create function public.can_read_submission(p_submission_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select public.can_manage_submission(p_submission_id) or exists(select 1 from public.submissions s where s.id=p_submission_id and s.student_id=auth.uid()
 and public.is_active_role('student') and (public.can_read_exercise(s.exercise_id) or public.can_read_competition(s.competition_id)));
$$;
create function public.can_read_evaluation(p_evaluation_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.evaluations ev join public.submission_versions v on v.id=ev.submission_version_id
 join public.submissions s on s.id=v.submission_id left join public.competitions cp on cp.id=s.competition_id where ev.id=p_evaluation_id
 and (public.can_manage_submission(s.id) or (public.can_read_submission(s.id) and ev.status='published' and (s.competition_id is null or cp.results_published_at is not null))));
$$;
create function public.can_manage_file_target(p_target_type text,p_target_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select case p_target_type
 when 'course' then exists(select 1 from public.courses c where c.id=p_target_id and public.can_manage_space(c.teaching_space_id))
 when 'exercise' then exists(select 1 from public.exercises e join public.courses c on c.id=e.course_id where e.id=p_target_id and public.can_manage_space(c.teaching_space_id))
 when 'competition' then exists(select 1 from public.competitions c where c.id=p_target_id and public.can_manage_space(c.teaching_space_id))
 when 'announcement' then exists(select 1 from public.announcements a where a.id=p_target_id and public.can_manage_space(a.teaching_space_id))
 when 'submission_version' then exists(select 1 from public.submission_versions v join public.submissions s on s.id=v.submission_id where v.id=p_target_id and v.submitted_at is null and s.student_id=auth.uid() and public.can_read_submission(s.id))
 else false end;
$$;
create function public.can_read_file(p_file_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.files f where f.id=p_file_id and f.status in ('pending','ready') and (
 (f.target_type='submission_version' and exists(select 1 from public.submission_versions v where v.id=f.target_id and public.can_read_submission(v.submission_id) and (f.status='ready' or f.owner_id=auth.uid())))
 or (f.status='ready' and ((f.target_type='course' and public.can_read_course(f.target_id)) or (f.target_type='exercise' and public.can_read_exercise(f.target_id)) or (f.target_type='competition' and public.can_read_competition(f.target_id)) or (f.target_type='announcement' and public.can_read_announcement(f.target_id))))
 or (f.owner_id=auth.uid() and f.target_type<>'submission_version' and public.is_active_role('teacher') and public.can_manage_file_target(f.target_type,f.target_id))));
$$;
create function private.assert_admin() returns void language plpgsql security definer set search_path='' as $$
begin if not public.is_active_role('admin') then raise exception 'ACCESS_DENIED' using errcode='42501'; end if; end $$;
create function private.assert_version(p_actual int,p_expected int) returns void language plpgsql set search_path='' as $$
begin if p_expected is null or p_actual<>p_expected then raise exception 'VERSION_CONFLICT' using errcode='40001'; end if; end $$;
create function private.audit(p_action text,p_type text,p_id uuid,p_changes jsonb default '{}') returns void language sql security definer set search_path='' as $$
 insert into private.audit_events(actor_id,action,resource_type,resource_id,changes) values(auth.uid(),p_action,p_type,p_id,p_changes);
$$;
-- Outbox insertion and delivery are in the same database transaction. No external IO.
create function private.emit_notification(p_recipient uuid,p_type text,p_target_type text,p_target_id uuid,p_key text) returns void language plpgsql security definer set search_path='' as $$
begin
 insert into private.notification_outbox(recipient_id,type,target_type,target_id,dedupe_key) values(p_recipient,p_type,p_target_type,p_target_id,p_key) on conflict do nothing;
 insert into public.notifications(recipient_id,type,target_type,target_id,dedupe_key) values(p_recipient,p_type,p_target_type,p_target_id,p_key) on conflict do nothing;
 update private.notification_outbox set status='delivered',delivered_at=now() where recipient_id=p_recipient and dedupe_key=p_key;
end $$;
create function private.notify_space(p_space_id uuid,p_type text,p_target_type text,p_target_id uuid,p_key text) returns void language plpgsql security definer set search_path='' as $$
declare r record;
begin
 for r in select distinct e.student_id from public.teaching_spaces t join public.student_subject_access a on a.class_subject_id=t.class_subject_id
 join public.class_enrollments e on e.id=a.enrollment_id join public.account_access ac on ac.user_id=e.student_id
 join public.class_subjects cs on cs.id=t.class_subject_id join public.classes c on c.id=cs.class_id join public.academic_years y on y.id=c.academic_year_id
 where t.id=p_space_id and a.status='active' and e.status='active' and ac.status='active' and ac.role='student' and cs.is_active and c.status='active' and y.status='active'
 loop perform private.emit_notification(r.student_id,p_type,p_target_type,p_target_id,p_key); end loop;
end $$;

create function public.open_classes() returns table(id uuid,name text,academic_year_id uuid,year_label text,level_id uuid,level_label text)
language sql stable security definer set search_path='' as $$
 select c.id,c.name,c.academic_year_id,y.label,c.level_id,l.label from public.classes c join public.academic_years y on y.id=c.academic_year_id
 join public.levels l on l.id=c.level_id where c.status='active' and y.status='active' and y.is_current and l.is_active order by l.sort_order,c.name;
$$;
create function public.request_admission(p_class_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.admission_requests; ac public.account_access;
begin
 select * into ac from public.account_access where user_id=auth.uid() for update;
 if ac.role<>'student' or ac.status not in ('pending','rejected') or ac.user_id is null then raise exception 'ACCESS_DENIED'; end if;
 if not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null) then raise exception 'EMAIL_NOT_CONFIRMED'; end if;
 if not exists(select 1 from public.open_classes() where id=p_class_id) then raise exception 'CLASS_UNAVAILABLE'; end if;
 select * into r from public.admission_requests where student_id=auth.uid() and status='pending' for update;
 if r.id is not null then
  if r.requested_class_id<>p_class_id then update public.admission_requests set requested_class_id=p_class_id where id=r.id returning * into r; end if;
  return to_jsonb(r);
 end if;
 insert into public.admission_requests(student_id,requested_class_id) values(auth.uid(),p_class_id) returning * into r;
 update public.account_access set status='pending' where user_id=auth.uid();
 return to_jsonb(r);
end $$;
create function public.decide_admission(p_request_id uuid,p_decision text,p_class_id uuid default null,p_subject_ids uuid[] default '{}',p_message text default '') returns jsonb
language plpgsql security definer set search_path='' as $$
declare r public.admission_requests; c public.classes; e public.class_enrollments; sid uuid;
begin
 perform private.assert_admin();
 select * into r from public.admission_requests where id=p_request_id for update;
 if r.id is null then raise exception 'RESOURCE_NOT_FOUND'; end if;
 if r.status=p_decision then return to_jsonb(r); end if;
 if r.status<>'pending' or p_decision not in ('accepted','rejected') then raise exception 'INVALID_TRANSITION'; end if;
 if not exists(select 1 from public.account_access where user_id=r.student_id and role='student' and status in ('pending','rejected','active')) then raise exception 'ACCOUNT_UNAVAILABLE'; end if;
 if p_decision='accepted' then
  select * into c from public.classes where id=p_class_id for update;
  if c.id is null or c.status<>'active' or not exists(select 1 from public.academic_years where id=c.academic_year_id and status='active') then raise exception 'CLASS_UNAVAILABLE'; end if;
  if exists(select 1 from public.class_enrollments where student_id=r.student_id and academic_year_id=c.academic_year_id and status='active') then raise exception 'ALREADY_ENROLLED'; end if;
  if (select count(*) from public.class_enrollments where class_id=c.id and status='active')>=c.capacity then raise exception 'CLASS_FULL'; end if;
  if coalesce(cardinality(p_subject_ids),0)=0 or exists(select 1 from unnest(p_subject_ids) x where not exists(select 1 from public.class_subjects cs join public.subjects s on s.id=cs.subject_id where cs.id=x and cs.class_id=c.id and cs.is_active and s.is_active)) then raise exception 'INVALID_SUBJECTS'; end if;
  insert into public.class_enrollments(student_id,class_id,academic_year_id) values(r.student_id,c.id,c.academic_year_id) returning * into e;
  foreach sid in array p_subject_ids loop
   insert into public.student_subject_access(enrollment_id,class_subject_id,class_id,granted_by) values(e.id,sid,c.id,auth.uid()) on conflict do nothing;
  end loop;
  update public.account_access set status='active',activated_at=now() where user_id=r.student_id;
 else
  update public.account_access set status='rejected' where user_id=r.student_id and status='pending';
 end if;
 update public.admission_requests set status=p_decision,decided_by=auth.uid(),decided_at=now(),public_message=left(p_message,2000),accepted_enrollment_id=e.id where id=r.id returning * into r;
 perform private.audit('admission_'||p_decision,'admission',r.id,jsonb_build_object('class_id',p_class_id,'class_subject_ids',p_subject_ids));
 perform private.emit_notification(r.student_id,'admission_'||p_decision,'admission',r.id,'admission:'||r.id);
 return to_jsonb(r);
end $$;
create function public.save_class(p_data jsonb,p_id uuid default null,p_expected_version int default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.classes; sid uuid;
begin
 perform private.assert_admin();
 if p_id is null then
  insert into public.classes(name,level_id,academic_year_id,capacity) values(p_data->>'name',(p_data->>'level_id')::uuid,(p_data->>'academic_year_id')::uuid,(p_data->>'capacity')::int) returning * into c;
 else
  select * into c from public.classes where id=p_id for update;
  if c.id is null then raise exception 'RESOURCE_NOT_FOUND'; end if;
  perform private.assert_version(c.row_version,p_expected_version);
  if p_data ? 'academic_year_id' and (p_data->>'academic_year_id')::uuid<>c.academic_year_id then raise exception 'YEAR_IMMUTABLE'; end if;
  if coalesce((p_data->>'capacity')::int,c.capacity)<(select count(*) from public.class_enrollments where class_id=c.id and status='active') then raise exception 'CAPACITY_BELOW_ENROLLMENT'; end if;
  update public.classes set name=coalesce(p_data->>'name',name),level_id=coalesce((p_data->>'level_id')::uuid,level_id),capacity=coalesce((p_data->>'capacity')::int,capacity),status=coalesce(p_data->>'status',status),row_version=row_version+1,updated_at=now() where id=c.id returning * into c;
 end if;
 if p_data ? 'subject_ids' then
  update public.class_subjects set is_active=false where class_id=c.id and subject_id not in (select value::uuid from jsonb_array_elements_text(p_data->'subject_ids'));
  for sid in select value::uuid from jsonb_array_elements_text(p_data->'subject_ids') loop
   if not exists(select 1 from public.subjects where id=sid and is_active) then raise exception 'INVALID_SUBJECTS'; end if;
   insert into public.class_subjects(class_id,subject_id) values(c.id,sid) on conflict(class_id,subject_id) do update set is_active=true;
  end loop;
 end if;
 perform private.audit('class_saved','class',c.id,jsonb_build_object('name',c.name,'capacity',c.capacity,'status',c.status));
 return to_jsonb(c);
end $$;
create function public.set_subject_access(p_enrollment_id uuid,p_class_subject_id uuid,p_active boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare e public.class_enrollments; a public.student_subject_access;
begin
 perform private.assert_admin(); select * into e from public.class_enrollments where id=p_enrollment_id and status='active' for update;
 if e.id is null then raise exception 'ENROLLMENT_UNAVAILABLE'; end if;
 if not exists(select 1 from public.class_subjects where id=p_class_subject_id and class_id=e.class_id and (is_active or not p_active)) then raise exception 'INVALID_SUBJECTS'; end if;
 insert into public.student_subject_access(enrollment_id,class_subject_id,class_id,status,granted_by,revoked_at)
 values(e.id,p_class_subject_id,e.class_id,case when p_active then 'active' else 'revoked' end,auth.uid(),case when p_active then null else now() end)
 on conflict(enrollment_id,class_subject_id) do update set status=excluded.status,granted_by=auth.uid(),granted_at=case when p_active then now() else public.student_subject_access.granted_at end,revoked_at=excluded.revoked_at returning * into a;
 perform private.audit('subject_access_changed','student',e.student_id,jsonb_build_object('class_subject_id',p_class_subject_id,'active',p_active));
 perform private.emit_notification(e.student_id,'subject_access_changed','subject',p_class_subject_id,'access:'||a.id||':'||txid_current());
 return to_jsonb(a);
end $$;
create function public.assign_teacher(p_teacher_id uuid,p_class_subject_id uuid,p_active boolean default true) returns jsonb language plpgsql security definer set search_path='' as $$
declare t public.teaching_spaces;
begin
 perform private.assert_admin();
 if not exists(select 1 from public.account_access where user_id=p_teacher_id and role='teacher' and (status='active' or not p_active)) then raise exception 'TEACHER_UNAVAILABLE'; end if;
 if not exists(select 1 from public.class_subjects where id=p_class_subject_id and (is_active or not p_active)) then raise exception 'INVALID_SUBJECTS'; end if;
 insert into public.teaching_spaces(teacher_id,class_subject_id,is_active,assigned_by) values(p_teacher_id,p_class_subject_id,p_active,auth.uid())
 on conflict(class_subject_id,teacher_id) do update set is_active=excluded.is_active,assigned_by=auth.uid(),assigned_at=now() returning * into t;
 perform private.audit('teacher_assigned','teaching_space',t.id,jsonb_build_object('active',p_active)); return to_jsonb(t);
end $$;
create function public.set_account_status(p_user_id uuid,p_status text) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.account_access;
begin
 perform private.assert_admin();
 if p_user_id=auth.uid() then raise exception 'CANNOT_SUSPEND_SELF'; end if;
 select * into a from public.account_access where user_id=p_user_id for update;
 if a.user_id is null or p_status not in ('active','suspended','archived') then raise exception 'INVALID_REQUEST'; end if;
 if a.status in ('pending','rejected') and a.role='student' then raise exception 'ADMISSION_REQUIRED'; end if;
 if a.role='admin' then raise exception 'ADMIN_STATUS_REQUIRES_SERVER'; end if;
 update public.account_access set status=p_status,suspended_at=case when p_status='suspended' then now() else null end where user_id=p_user_id returning * into a;
 perform private.audit('account_status_changed','account',p_user_id,jsonb_build_object('status',p_status)); return to_jsonb(a);
end $$;
create function public.transfer_student(p_enrollment_id uuid,p_class_id uuid,p_subject_ids uuid[]) returns jsonb language plpgsql security definer set search_path='' as $$
declare e public.class_enrollments; c public.classes; n public.class_enrollments; sid uuid;
begin
 perform private.assert_admin(); select * into e from public.class_enrollments where id=p_enrollment_id for update;
 if e.id is null or e.status<>'active' then raise exception 'ENROLLMENT_UNAVAILABLE'; end if;
 select * into c from public.classes where id=p_class_id for update;
 if c.id is null or c.status<>'active' or c.id=e.class_id then raise exception 'CLASS_UNAVAILABLE'; end if;
 if (select count(*) from public.class_enrollments where class_id=c.id and status='active')>=c.capacity then raise exception 'CLASS_FULL'; end if;
 if coalesce(cardinality(p_subject_ids),0)=0 or exists(select 1 from unnest(p_subject_ids) x where not exists(select 1 from public.class_subjects where id=x and class_id=c.id and is_active)) then raise exception 'INVALID_SUBJECTS'; end if;
 update public.student_subject_access set status='revoked',revoked_at=now() where enrollment_id=e.id;
 update public.class_enrollments set status='ended',ended_at=now() where id=e.id;
 insert into public.class_enrollments(student_id,class_id,academic_year_id) values(e.student_id,c.id,c.academic_year_id) returning * into n;
 foreach sid in array p_subject_ids loop insert into public.student_subject_access(enrollment_id,class_subject_id,class_id,granted_by) values(n.id,sid,c.id,auth.uid()) on conflict do nothing; end loop;
 perform private.audit('student_transferred','student',e.student_id,jsonb_build_object('from',e.class_id,'to',c.id)); return to_jsonb(n);
end $$;

create function public.save_course(p_data jsonb,p_id uuid default null,p_expected_version int default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.courses; sp uuid;
begin
 if p_id is null then
  sp:=(p_data->>'teaching_space_id')::uuid;
  if not public.can_manage_space(sp) then raise exception 'ACCESS_DENIED'; end if;
  insert into public.courses(teaching_space_id,title,summary,chapter_label,body,content_language,video_provider,video_id,position,created_by)
  values(sp,coalesce(p_data->>'title',''),coalesce(p_data->>'summary',''),coalesce(p_data->>'chapter_label',''),coalesce(p_data->>'body',''),coalesce(p_data->>'content_language','fr'),nullif(p_data->>'video_provider',''),nullif(p_data->>'video_id',''),coalesce((p_data->>'position')::int,0),auth.uid()) returning * into c;
 else
  select * into c from public.courses where id=p_id for update;
  if c.id is null or not public.can_manage_space(c.teaching_space_id) then raise exception 'ACCESS_DENIED'; end if;
  perform private.assert_version(c.row_version,p_expected_version);
  if p_data ? 'teaching_space_id' and (p_data->>'teaching_space_id')::uuid<>c.teaching_space_id then raise exception 'SPACE_IMMUTABLE'; end if;
  update public.courses set title=coalesce(p_data->>'title',title),summary=coalesce(p_data->>'summary',summary),chapter_label=coalesce(p_data->>'chapter_label',chapter_label),body=coalesce(p_data->>'body',body),content_language=coalesce(p_data->>'content_language',content_language),video_provider=case when p_data ? 'video_provider' then nullif(p_data->>'video_provider','') else video_provider end,video_id=case when p_data ? 'video_id' then nullif(p_data->>'video_id','') else video_id end,position=coalesce((p_data->>'position')::int,position),row_version=row_version+1,updated_at=now() where id=p_id returning * into c;
  if c.status='published' and (length(trim(c.title))=0 or length(trim(c.body))=0 or c.video_id is null or c.video_provider is null) then raise exception 'COURSE_INCOMPLETE'; end if;
 end if;
 if public.is_active_role('admin') then perform private.audit('course_saved','course',c.id); end if;
 return to_jsonb(c);
end $$;
create function public.save_exercise(p_data jsonb,p_id uuid default null,p_expected_version int default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare e public.exercises; c public.courses; st text;
begin
 if p_id is null then
  select * into c from public.courses where id=(p_data->>'course_id')::uuid;
  if c.id is null or not public.can_manage_space(c.teaching_space_id) then raise exception 'ACCESS_DENIED'; end if;
  insert into public.exercises(course_id,title,instructions,position,difficulty,due_at,allow_late,max_score)
  values(c.id,coalesce(p_data->>'title',''),coalesce(p_data->>'instructions',''),coalesce((p_data->>'position')::int,0),coalesce(p_data->>'difficulty','standard'),(p_data->>'due_at')::timestamptz,coalesce((p_data->>'allow_late')::bool,false),coalesce((p_data->>'max_score')::numeric,20)) returning * into e;
 else
  select * into e from public.exercises where id=p_id for update;
  select * into c from public.courses where id=e.course_id;
  if c.id is null or not public.can_manage_space(c.teaching_space_id) then raise exception 'ACCESS_DENIED'; end if;
  perform private.assert_version(e.row_version,p_expected_version);
  if p_data ? 'course_id' and (p_data->>'course_id')::uuid<>e.course_id then raise exception 'COURSE_IMMUTABLE'; end if;
  if exists(select 1 from public.submissions s join public.submission_versions v on v.submission_id=s.id where s.exercise_id=e.id and v.submitted_at is not null)
  and ((p_data ? 'instructions' and p_data->>'instructions'<>e.instructions) or (p_data ? 'max_score' and (p_data->>'max_score')::numeric<>e.max_score)) then raise exception 'STATEMENT_LOCKED'; end if;
  update public.exercises set title=coalesce(p_data->>'title',title),instructions=coalesce(p_data->>'instructions',instructions),position=coalesce((p_data->>'position')::int,position),difficulty=coalesce(p_data->>'difficulty',difficulty),due_at=case when p_data ? 'due_at' then (p_data->>'due_at')::timestamptz else due_at end,allow_late=coalesce((p_data->>'allow_late')::boolean,allow_late),max_score=coalesce((p_data->>'max_score')::numeric,max_score),row_version=row_version+1,updated_at=now() where id=e.id returning * into e;
 end if;
 st:=coalesce(p_data->>'status',e.status);
 if st not in ('draft','published','archived') then raise exception 'INVALID_STATUS'; end if;
 if st='published' and (trim(e.title)='' or trim(e.instructions)='') then raise exception 'EXERCISE_INCOMPLETE'; end if;
 if e.status='published' and st='draft' then raise exception 'INVALID_TRANSITION'; end if;
 update public.exercises set status=st,published_at=case when st='published' then coalesce(published_at,now()) else published_at end where id=e.id returning * into e;
 return to_jsonb(e);
end $$;
create function public.publish_course(p_course_id uuid,p_expected_version int) returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.courses;
begin
 select * into c from public.courses where id=p_course_id for update;
 if c.id is null or not public.can_manage_space(c.teaching_space_id) then raise exception 'ACCESS_DENIED'; end if;
 perform private.assert_version(c.row_version,p_expected_version);
 if c.status='archived' then raise exception 'INVALID_TRANSITION'; end if;
 if trim(c.title)='' or trim(c.body)='' or c.video_provider is null or c.video_id is null then raise exception 'COURSE_INCOMPLETE'; end if;
 if not exists(select 1 from public.exercises where course_id=c.id and status in ('draft','published') and trim(title)<>'' and trim(instructions)<>'') then raise exception 'EXERCISE_REQUIRED'; end if;
 if exists(select 1 from public.files f where f.target_type='course' and f.target_id=c.id and f.status='pending') then raise exception 'FILES_NOT_READY'; end if;
 update public.exercises set status='published',published_at=coalesce(published_at,now()),row_version=row_version+1 where course_id=c.id and status='draft' and trim(title)<>'' and trim(instructions)<>'';
 update public.courses set status='published',published_at=coalesce(published_at,now()),row_version=row_version+1,updated_at=now() where id=c.id returning * into c;
 perform private.notify_space(c.teaching_space_id,'course_published','course',c.id,'course:'||c.id);
 if public.is_active_role('admin') then perform private.audit('course_published','course',c.id); end if;
 return to_jsonb(c);
end $$;
create function public.save_competition(p_data jsonb,p_id uuid default null,p_expected_version int default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.competitions;
begin
 if p_id is null then
  if not public.can_manage_space((p_data->>'teaching_space_id')::uuid) then raise exception 'ACCESS_DENIED'; end if;
  insert into public.competitions(teaching_space_id,kind,title,summary,instructions,rules,opens_at,closes_at,max_score,leaderboard_enabled)
  values((p_data->>'teaching_space_id')::uuid,coalesce(p_data->>'kind','challenge'),coalesce(p_data->>'title',''),coalesce(p_data->>'summary',''),coalesce(p_data->>'instructions',''),coalesce(p_data->>'rules',''),(p_data->>'opens_at')::timestamptz,(p_data->>'closes_at')::timestamptz,coalesce((p_data->>'max_score')::numeric,20),coalesce((p_data->>'leaderboard_enabled')::bool,false)) returning * into c;
 else
  select * into c from public.competitions where id=p_id for update;
  if c.id is null or not public.can_manage_space(c.teaching_space_id) then raise exception 'ACCESS_DENIED'; end if;
  perform private.assert_version(c.row_version,p_expected_version);
  if p_data ? 'teaching_space_id' and (p_data->>'teaching_space_id')::uuid<>c.teaching_space_id then raise exception 'SPACE_IMMUTABLE'; end if;
  if exists(select 1 from public.submissions s join public.submission_versions v on v.submission_id=s.id where s.competition_id=c.id and v.submitted_at is not null)
  and ((p_data ? 'instructions' and p_data->>'instructions'<>c.instructions) or (p_data ? 'max_score' and (p_data->>'max_score')::numeric<>c.max_score)) then raise exception 'STATEMENT_LOCKED'; end if;
  update public.competitions set title=coalesce(p_data->>'title',title),summary=coalesce(p_data->>'summary',summary),instructions=coalesce(p_data->>'instructions',instructions),rules=coalesce(p_data->>'rules',rules),opens_at=coalesce((p_data->>'opens_at')::timestamptz,opens_at),closes_at=coalesce((p_data->>'closes_at')::timestamptz,closes_at),max_score=coalesce((p_data->>'max_score')::numeric,max_score),leaderboard_enabled=coalesce((p_data->>'leaderboard_enabled')::bool,leaderboard_enabled),row_version=row_version+1,updated_at=now() where id=c.id returning * into c;
 end if; return to_jsonb(c);
end $$;
create function public.publish_competition(p_competition_id uuid,p_expected_version int) returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.competitions;
begin
 select * into c from public.competitions where id=p_competition_id for update;
 if c.id is null or not public.can_manage_space(c.teaching_space_id) then raise exception 'ACCESS_DENIED'; end if;
 perform private.assert_version(c.row_version,p_expected_version);
 if c.status not in ('draft','published') or trim(c.title)='' or trim(c.instructions)='' or c.closes_at<=now() then raise exception 'COMPETITION_INCOMPLETE'; end if;
 update public.competitions set status='published',row_version=row_version+1,updated_at=now() where id=c.id returning * into c;
 perform private.notify_space(c.teaching_space_id,'competition_published','competition',c.id,'competition:'||c.id); return to_jsonb(c);
end $$;
create function public.save_announcement(p_data jsonb,p_id uuid default null,p_expected_version int default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.announcements;
begin
 if p_id is null then
  if not public.can_manage_space((p_data->>'teaching_space_id')::uuid) then raise exception 'ACCESS_DENIED'; end if;
  insert into public.announcements(teaching_space_id,title,body,created_by) values((p_data->>'teaching_space_id')::uuid,coalesce(p_data->>'title',''),coalesce(p_data->>'body',''),auth.uid()) returning * into a;
 else
  select * into a from public.announcements where id=p_id for update;
  if a.id is null or not public.can_manage_space(a.teaching_space_id) then raise exception 'ACCESS_DENIED'; end if;
  perform private.assert_version(a.row_version,p_expected_version);
  if a.type<>'notice' then raise exception 'MEETING_WORKFLOW_REQUIRED'; end if;
  if p_data ? 'teaching_space_id' and (p_data->>'teaching_space_id')::uuid<>a.teaching_space_id then raise exception 'SPACE_IMMUTABLE'; end if;
  update public.announcements set title=coalesce(p_data->>'title',title),body=coalesce(p_data->>'body',body),row_version=row_version+1,updated_at=now() where id=a.id returning * into a;
 end if;
 if a.status='published' and (trim(a.title)='' or trim(a.body)='') then raise exception 'ANNOUNCEMENT_INCOMPLETE'; end if;
 return to_jsonb(a);
end $$;
create function public.publish_announcement(p_announcement_id uuid,p_expected_version int) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.announcements;
begin
 select * into a from public.announcements where id=p_announcement_id for update;
 if a.id is null or not public.can_manage_space(a.teaching_space_id) then raise exception 'ACCESS_DENIED'; end if;
 perform private.assert_version(a.row_version,p_expected_version);
 if a.type<>'notice' then raise exception 'MEETING_WORKFLOW_REQUIRED'; end if;
 if a.status='archived' or trim(a.title)='' or trim(a.body)='' then raise exception 'ANNOUNCEMENT_INCOMPLETE'; end if;
 update public.announcements set status='published',published_at=coalesce(published_at,now()),row_version=row_version+1,updated_at=now() where id=a.id returning * into a;
 perform private.notify_space(a.teaching_space_id,'announcement_published','announcement',a.id,'announcement:'||a.id); return to_jsonb(a);
end $$;
create function public.save_meeting(p_data jsonb,p_id uuid default null,p_expected_version int default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare m public.meetings; a public.announcements; sp uuid;
begin
 if not public.is_active_role('teacher') then raise exception 'ACCESS_DENIED'; end if;
 if p_id is null then
  sp:=(p_data->>'teaching_space_id')::uuid;
  if not public.can_manage_space(sp) then raise exception 'ACCESS_DENIED'; end if;
  insert into public.announcements(teaching_space_id,type,title,body,created_by) values(sp,'live_session',coalesce(p_data->>'title',''),coalesce(p_data->>'body',''),auth.uid()) returning * into a;
  insert into public.meetings(announcement_id,course_id,starts_at,ends_at,timezone) values(a.id,(p_data->>'course_id')::uuid,(p_data->>'starts_at')::timestamptz,(p_data->>'ends_at')::timestamptz,coalesce(p_data->>'timezone','Africa/Casablanca')) returning * into m;
 else
  select * into m from public.meetings where id=p_id for update;
  select * into a from public.announcements where id=m.announcement_id for update;
  if a.id is null or not public.can_manage_space(a.teaching_space_id) then raise exception 'ACCESS_DENIED'; end if;
  perform private.assert_version(m.row_version,p_expected_version);
  if m.status<>'draft' then raise exception 'MEETING_WORKFLOW_REQUIRED'; end if;
  if p_data ? 'teaching_space_id' and (p_data->>'teaching_space_id')::uuid<>a.teaching_space_id then raise exception 'SPACE_IMMUTABLE'; end if;
  update public.announcements set title=coalesce(p_data->>'title',title),body=coalesce(p_data->>'body',body),row_version=row_version+1,updated_at=now() where id=a.id;
  update public.meetings set course_id=case when p_data ? 'course_id' then (p_data->>'course_id')::uuid else course_id end,starts_at=coalesce((p_data->>'starts_at')::timestamptz,starts_at),ends_at=coalesce((p_data->>'ends_at')::timestamptz,ends_at),timezone=coalesce(p_data->>'timezone',timezone),row_version=row_version+1,revision=revision+1,updated_at=now() where id=m.id returning * into m;
 end if;
 if not exists(select 1 from pg_timezone_names where name=m.timezone) then raise exception 'INVALID_TIMEZONE'; end if;
 if m.course_id is not null and not exists(select 1 from public.courses where id=m.course_id and teaching_space_id=a.teaching_space_id) then raise exception 'COURSE_SPACE_MISMATCH'; end if;
 return to_jsonb(m);
end $$;

create function private.assert_submission_open(p_submission_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare s public.submissions; e public.exercises; c public.competitions;
begin
 select * into s from public.submissions where id=p_submission_id;
 if s.id is null or s.student_id<>auth.uid() or not public.is_active_role('student') or not public.can_read_submission(s.id) then raise exception 'ACCESS_DENIED'; end if;
 if s.resubmit_until is not null and s.resubmit_until>=now() then return; end if;
 if s.exercise_id is not null then
  select * into e from public.exercises where id=s.exercise_id;
  if e.due_at is not null and e.due_at<now() and not e.allow_late then raise exception 'DEADLINE_PASSED'; end if;
 else
  select * into c from public.competitions where id=s.competition_id;
  if c.status<>'published' or now()<c.opens_at or now()>c.closes_at then raise exception 'DEADLINE_PASSED'; end if;
 end if;
end $$;
create function public.start_submission_version(p_exercise_id uuid default null,p_competition_id uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.submissions; v public.submission_versions; n int;
begin
 if not public.is_active_role('student') or num_nonnulls(p_exercise_id,p_competition_id)<>1 then raise exception 'ACCESS_DENIED'; end if;
 if (p_exercise_id is not null and not public.can_read_exercise(p_exercise_id)) or (p_competition_id is not null and not public.can_read_competition(p_competition_id)) then raise exception 'ACCESS_DENIED'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||coalesce(p_exercise_id,p_competition_id)::text,0));
 select * into s from public.submissions where student_id=auth.uid() and (exercise_id=p_exercise_id or competition_id=p_competition_id) for update;
 if s.id is null then
  insert into public.submissions(student_id,exercise_id,competition_id) values(auth.uid(),p_exercise_id,p_competition_id) returning * into s;
 end if;
 perform private.assert_submission_open(s.id);
 select * into v from public.submission_versions where submission_id=s.id and submitted_at is null;
 if v.id is not null then return to_jsonb(v); end if;
 if s.latest_version_id is not null and (s.status<>'changes_requested' or s.resubmit_until is null or s.resubmit_until<now()) then raise exception 'RESUBMISSION_NOT_ALLOWED'; end if;
 select coalesce(max(version_number),0)+1 into n from public.submission_versions where submission_id=s.id;
 insert into public.submission_versions(submission_id,version_number) values(s.id,n) returning * into v;
 update public.submissions set latest_version_id=v.id,status='draft',row_version=row_version+1,updated_at=now() where id=s.id;
 return to_jsonb(v);
end $$;
create function public.save_submission_draft(p_version_id uuid,p_comment text default '') returns jsonb language plpgsql security definer set search_path='' as $$
declare v public.submission_versions;
begin
 select * into v from public.submission_versions where id=p_version_id for update;
 if v.id is null or v.submitted_at is not null then raise exception 'VERSION_IMMUTABLE'; end if;
 perform private.assert_submission_open(v.submission_id);
 update public.submission_versions set student_comment=left(p_comment,10000) where id=v.id returning * into v;
 return to_jsonb(v);
end $$;
create function public.submit_work(p_version_id uuid,p_comment text default '') returns jsonb language plpgsql security definer set search_path='' as $$
declare v public.submission_versions; s public.submissions; e public.exercises; cp public.competitions; t uuid; cnt int; total bigint;
begin
 select * into v from public.submission_versions where id=p_version_id for update;
 select * into s from public.submissions where id=v.submission_id for update;
 if s.id is null or s.student_id<>auth.uid() or not public.is_active_role('student') or not public.can_read_submission(s.id) then raise exception 'ACCESS_DENIED'; end if;
 if v.submitted_at is not null then
  if v.student_comment<>left(p_comment,10000) then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
  return to_jsonb(v);
 end if;
 if s.latest_version_id<>v.id then raise exception 'VERSION_IMMUTABLE'; end if;
 perform private.assert_submission_open(s.id);
 if exists(select 1 from public.files where target_type='submission_version' and target_id=v.id and status='pending') then raise exception 'FILES_NOT_READY'; end if;
 select count(*),coalesce(sum(f.size_bytes),0) into cnt,total from public.submission_files sf join public.files f on f.id=sf.file_id
 where sf.submission_version_id=v.id and f.owner_id=auth.uid() and f.status='ready' and f.target_id=v.id and f.target_type='submission_version';
 if cnt<1 or cnt>5 or total>31457280 then raise exception 'INVALID_FILES'; end if;
 if s.exercise_id is not null then
  select * into e from public.exercises where id=s.exercise_id;
  select ts.teacher_id into t from public.courses c join public.teaching_spaces ts on ts.id=c.teaching_space_id where c.id=e.course_id;
 else
  select * into cp from public.competitions where id=s.competition_id;
  select teacher_id into t from public.teaching_spaces where id=cp.teaching_space_id;
 end if;
 update public.submission_versions set submitted_at=now(),student_comment=left(p_comment,10000),max_score_snapshot=coalesce(e.max_score,cp.max_score),statement_snapshot=coalesce(e.instructions,cp.instructions),is_late=case when e.id is not null then coalesce(now()>e.due_at,false) else now()>cp.closes_at end where id=v.id returning * into v;
 update public.submissions set status='submitted',resubmit_until=null,row_version=row_version+1,updated_at=now() where id=s.id;
 perform private.emit_notification(t,'work_submitted','submission',s.id,'work:'||v.id); return to_jsonb(v);
end $$;
create function public.save_evaluation(p_version_id uuid,p_feedback text,p_score numeric default null,p_expected_version int default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare v public.submission_versions; ev public.evaluations;
begin
 select * into v from public.submission_versions where id=p_version_id for update;
 if v.id is null or v.submitted_at is null or not public.can_manage_submission(v.submission_id) then raise exception 'ACCESS_DENIED'; end if;
 if p_score is not null and (p_score<0 or p_score>v.max_score_snapshot) then raise exception 'INVALID_SCORE'; end if;
 select * into ev from public.evaluations where submission_version_id=v.id for update;
 if ev.id is null then
  insert into public.evaluations(submission_version_id,reviewer_id,feedback,score,max_score) values(v.id,auth.uid(),left(p_feedback,20000),p_score,v.max_score_snapshot) returning * into ev;
 else
  perform private.assert_version(ev.row_version,p_expected_version);
  perform private.audit('evaluation_updated','evaluation',ev.id,jsonb_build_object('previous_status',ev.status));
  update public.evaluations set feedback=left(p_feedback,20000),score=p_score,status='draft',published_at=null,reviewer_id=auth.uid(),row_version=row_version+1,updated_at=now() where id=ev.id returning * into ev;
 end if; return to_jsonb(ev);
end $$;
create function public.publish_evaluation(p_evaluation_id uuid,p_expected_version int) returns jsonb language plpgsql security definer set search_path='' as $$
declare ev public.evaluations; v public.submission_versions; s public.submissions;
begin
 select * into ev from public.evaluations where id=p_evaluation_id for update;
 select * into v from public.submission_versions where id=ev.submission_version_id;
 select * into s from public.submissions where id=v.submission_id for update;
 if ev.id is null or not public.can_manage_submission(s.id) then raise exception 'ACCESS_DENIED'; end if;
 perform private.assert_version(ev.row_version,p_expected_version);
 if trim(ev.feedback)='' then raise exception 'FEEDBACK_REQUIRED'; end if;
 update public.evaluations set status='published',published_at=now(),row_version=row_version+1,updated_at=now() where id=ev.id returning * into ev;
 if s.latest_version_id=v.id then update public.submissions set status='reviewed',row_version=row_version+1,updated_at=now() where id=s.id; end if;
 if s.competition_id is null or exists(select 1 from public.competitions where id=s.competition_id and results_published_at is not null) then
  perform private.emit_notification(s.student_id,'evaluation_published','submission',s.id,'evaluation:'||ev.id||':'||ev.row_version);
 end if;
 perform private.audit('evaluation_published','evaluation',ev.id); return to_jsonb(ev);
end $$;
create function public.request_resubmission(p_submission_id uuid,p_until timestamptz,p_feedback text) returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.submissions;
begin
 select * into s from public.submissions where id=p_submission_id for update;
 if s.id is null or not public.can_manage_submission(s.id) then raise exception 'ACCESS_DENIED'; end if;
 if s.status not in ('submitted','reviewed','changes_requested') or p_until<=now() or p_until>now()+interval '90 days' or trim(p_feedback)='' then raise exception 'INVALID_REQUEST'; end if;
 update public.submissions set status='changes_requested',resubmit_until=p_until,resubmit_requested_by=auth.uid(),row_version=row_version+1,updated_at=now() where id=s.id returning * into s;
 -- Feedback is a published correction on the submitted version; competition visibility still waits for results.
 perform public.save_evaluation(s.latest_version_id,p_feedback,null,(select row_version from public.evaluations where submission_version_id=s.latest_version_id));
 update public.evaluations set status='published',published_at=now() where submission_version_id=s.latest_version_id;
 perform private.emit_notification(s.student_id,'resubmission_requested','submission',s.id,'resubmit:'||s.id||':'||s.row_version);
 return to_jsonb(s);
end $$;
create function public.publish_competition_results(p_competition_id uuid,p_expected_version int) returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.competitions;
begin
 select * into c from public.competitions where id=p_competition_id for update;
 if c.id is null or not public.can_manage_space(c.teaching_space_id) then raise exception 'ACCESS_DENIED'; end if;
 perform private.assert_version(c.row_version,p_expected_version);
 if c.status not in ('published','closed') or c.closes_at>now() then raise exception 'COMPETITION_NOT_CLOSED'; end if;
 if exists(select 1 from public.submissions s join public.submission_versions v on v.id=s.latest_version_id left join public.evaluations ev on ev.submission_version_id=v.id where s.competition_id=c.id and v.submitted_at is not null and (ev.id is null or ev.status<>'published')) then raise exception 'EVALUATIONS_INCOMPLETE'; end if;
 update public.competitions set status='closed',results_published_at=coalesce(results_published_at,now()),row_version=row_version+1,updated_at=now() where id=c.id returning * into c;
 perform private.notify_space(c.teaching_space_id,'results_published','competition',c.id,'results:'||c.id); return to_jsonb(c);
end $$;
create function public.competition_leaderboard(p_competition_id uuid) returns table(rank bigint,pseudonym text,score numeric,max_score numeric,is_me boolean)
language plpgsql stable security definer set search_path='' as $$
begin
 if not public.can_read_competition(p_competition_id) or not exists(select 1 from public.competitions where id=p_competition_id and leaderboard_enabled and results_published_at is not null) then raise exception 'ACCESS_DENIED'; end if;
 return query select rank() over(order by ev.score desc), 'Élève '||upper(substr(md5(s.student_id::text||p_competition_id::text),1,6)),ev.score,ev.max_score,s.student_id=auth.uid()
 from public.submissions s join public.submission_versions v on v.id=s.latest_version_id join public.evaluations ev on ev.submission_version_id=v.id
 where s.competition_id=p_competition_id and v.submitted_at is not null and ev.status='published' and ev.score is not null order by ev.score desc;
end $$;
create function public.set_course_progress(p_course_id uuid,p_status text) returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.course_progress;
begin
 if not public.is_active_role('student') or not public.can_read_course(p_course_id) or p_status not in ('started','completed') then raise exception 'ACCESS_DENIED'; end if;
 insert into public.course_progress(student_id,course_id,status,completed_at) values(auth.uid(),p_course_id,p_status,case when p_status='completed' then now() else null end)
 on conflict(student_id,course_id) do update set status=excluded.status,completed_at=excluded.completed_at returning * into p; return to_jsonb(p);
end $$;
create function public.mark_notification_read(p_id uuid default null) returns void language sql security definer set search_path='' as $$
 update public.notifications set read_at=coalesce(read_at,now()) where recipient_id=auth.uid() and (p_id is null or id=p_id);
$$;

create function public.reserve_file(p_target_type text,p_target_id uuid,p_name text,p_mime text,p_size bigint) returns jsonb language plpgsql security definer set search_path='' as $$
declare f public.files; v public.submission_versions; max_count int; max_bytes bigint; reserved bigint; n int; bucket_name text; ext text; new_id uuid:=gen_random_uuid();
begin
 if not public.can_manage_file_target(p_target_type,p_target_id) then raise exception 'ACCESS_DENIED'; end if;
 if p_mime not in ('image/jpeg','image/png','image/webp','application/pdf') or p_size<=0 or p_name is null or length(p_name) not between 1 and 255 then raise exception 'INVALID_FILE'; end if;
 perform pg_advisory_xact_lock(hashtextextended('file:'||p_target_type||p_target_id::text,0));
 if p_target_type='submission_version' then
  select * into v from public.submission_versions where id=p_target_id for update;
  if v.submitted_at is not null then raise exception 'VERSION_IMMUTABLE'; end if;
  perform private.assert_submission_open(v.submission_id);
  max_count:=least(5,coalesce((select (value::text)::int from public.platform_settings where key='max_files'),5));
  max_bytes:=least(31457280,coalesce((select (value::text)::bigint from public.platform_settings where key='max_total_bytes'),31457280));
  if p_size>(case when p_mime='application/pdf' then 20971520 else 10485760 end) then raise exception 'FILE_TOO_LARGE'; end if;
  bucket_name:='student-submissions';
 elsif p_target_type='announcement' then
  max_count:=3; max_bytes:=31457280; bucket_name:='announcement-materials'; if p_size>10485760 then raise exception 'FILE_TOO_LARGE'; end if;
 else
  max_count:=10; max_bytes:=209715200; bucket_name:='course-materials'; if p_size>20971520 then raise exception 'FILE_TOO_LARGE'; end if;
 end if;
 select count(*),coalesce(sum(size_bytes),0) into n,reserved from public.files where target_type=p_target_type and target_id=p_target_id and status in ('pending','ready');
 if n>=max_count or reserved+p_size>max_bytes then raise exception 'FILE_QUOTA_EXCEEDED'; end if;
 ext:=case p_mime when 'image/jpeg' then 'jpg' when 'image/png' then 'png' when 'image/webp' then 'webp' else 'pdf' end;
 insert into public.files(id,owner_id,bucket,object_path,original_name,mime_type,size_bytes,target_type,target_id)
 values(new_id,auth.uid(),bucket_name,case when p_target_type='submission_version' then auth.uid()::text||'/'||v.submission_id||'/'||p_target_id||'/'||new_id||'.'||ext else p_target_type||'/'||p_target_id||'/'||new_id||'.'||ext end,p_name,p_mime,p_size,p_target_type,p_target_id) returning * into f;
 return to_jsonb(f);
end $$;
create function public.finalize_file(p_file_id uuid,p_size bigint,p_mime text,p_object_path text default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare f public.files; old_sub text; old_claims text; v public.submission_versions;
begin
 select * into f from public.files where id=p_file_id for update;
 if f.id is null then raise exception 'RESOURCE_NOT_FOUND'; end if;
 if f.status='ready' then return to_jsonb(f); end if;
 if f.status<>'pending' or p_mime<>f.mime_type or p_size<=0 or (p_object_path is not null and p_object_path<>f.object_path||'.validated') then raise exception 'INVALID_FILE'; end if;
 perform pg_advisory_xact_lock(hashtextextended('file:'||f.target_type||f.target_id::text,0));
 if p_size>(case when f.target_type='announcement' then 10485760 when f.target_type='submission_version' and p_mime<>'application/pdf' then 10485760 else 20971520 end) then raise exception 'FILE_TOO_LARGE'; end if;
 if f.target_type='submission_version' and p_size+(select coalesce(sum(size_bytes),0) from public.files where target_type=f.target_type and target_id=f.target_id and id<>f.id and status in ('pending','ready'))>least(31457280,coalesce((select (value::text)::bigint from public.platform_settings where key='max_total_bytes'),31457280)) then raise exception 'FILE_QUOTA_EXCEEDED'; end if;
 -- Only service_role may execute. Re-check the reserving user's CURRENT permissions.
 old_sub:=current_setting('request.jwt.claim.sub',true); old_claims:=current_setting('request.jwt.claims',true);
 perform set_config('request.jwt.claim.sub',f.owner_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',f.owner_id,'role','authenticated')::text,true);
 if not public.can_manage_file_target(f.target_type,f.target_id) then raise exception 'ACCESS_DENIED'; end if;
 if f.target_type='submission_version' then
  select * into v from public.submission_versions where id=f.target_id for update;
  perform private.assert_submission_open(v.submission_id);
 end if;
 update public.files set status='ready',size_bytes=p_size,object_path=coalesce(p_object_path,object_path) where id=f.id returning * into f;
 case f.target_type
 when 'submission_version' then insert into public.submission_files(submission_version_id,file_id) values(f.target_id,f.id);
 when 'course' then insert into public.course_resources(course_id,file_id,label) values(f.target_id,f.id,f.original_name);
 when 'exercise' then insert into public.exercise_resources(exercise_id,file_id,label) values(f.target_id,f.id,f.original_name);
 when 'competition' then insert into public.competition_resources(competition_id,file_id,label) values(f.target_id,f.id,f.original_name);
 when 'announcement' then insert into public.announcement_resources(announcement_id,file_id,label) values(f.target_id,f.id,f.original_name);
 else raise exception 'INVALID_FILE'; end case;
 perform set_config('request.jwt.claim.sub',coalesce(old_sub,''),true); perform set_config('request.jwt.claims',coalesce(old_claims,''),true);
 return to_jsonb(f);
end $$;
create function public.delete_draft_file(p_file_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare f public.files; v public.submission_versions;
begin
 select * into f from public.files where id=p_file_id for update;
 if f.id is null or f.owner_id<>auth.uid() or not public.can_manage_file_target(f.target_type,f.target_id) then raise exception 'ACCESS_DENIED'; end if;
 if f.target_type='submission_version' then
  select * into v from public.submission_versions where id=f.target_id for update;
  if v.submitted_at is not null then raise exception 'VERSION_IMMUTABLE'; end if;
  delete from public.submission_files where file_id=f.id;
 else
  delete from public.course_resources where file_id=f.id;
  delete from public.exercise_resources where file_id=f.id;
  delete from public.competition_resources where file_id=f.id;
  delete from public.announcement_resources where file_id=f.id;
 end if;
 update public.files set status='deleted' where id=f.id returning * into f; return to_jsonb(f);
end $$;
create function public.archive_content(p_kind text,p_id uuid,p_expected_version int) returns void language plpgsql security definer set search_path='' as $$
declare sp uuid; ver int;
begin
 case p_kind
 when 'course' then select teaching_space_id,row_version into sp,ver from public.courses where id=p_id for update;
 when 'exercise' then select c.teaching_space_id,e.row_version into sp,ver from public.exercises e join public.courses c on c.id=e.course_id where e.id=p_id for update of e;
 when 'competition' then select teaching_space_id,row_version into sp,ver from public.competitions where id=p_id for update;
 when 'announcement' then select teaching_space_id,row_version into sp,ver from public.announcements where id=p_id and type='notice' for update;
 else raise exception 'INVALID_REQUEST'; end case;
 if sp is null or not public.can_manage_space(sp) then raise exception 'ACCESS_DENIED'; end if;
 perform private.assert_version(ver,p_expected_version);
 case p_kind
 when 'course' then update public.courses set status='archived',row_version=row_version+1,updated_at=now() where id=p_id;
 when 'exercise' then update public.exercises set status='archived',row_version=row_version+1,updated_at=now() where id=p_id;
 when 'competition' then update public.competitions set status='archived',row_version=row_version+1,updated_at=now() where id=p_id;
 when 'announcement' then update public.announcements set status='archived',row_version=row_version+1,updated_at=now() where id=p_id;
 end case;
 perform private.audit('content_archived',p_kind,p_id);
end $$;
create function public.transfer_course(p_course_id uuid,p_teaching_space_id uuid,p_expected_version int,p_reason text default '') returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.courses; old_space public.teaching_spaces; target public.teaching_spaces;
begin
 perform private.assert_admin(); select * into c from public.courses where id=p_course_id for update;
 if c.id is null then raise exception 'RESOURCE_NOT_FOUND'; end if;
 perform private.assert_version(c.row_version,p_expected_version);
 select * into old_space from public.teaching_spaces where id=c.teaching_space_id;
 select * into target from public.teaching_spaces where id=p_teaching_space_id;
 if target.id is null or not target.is_active or target.class_subject_id<>old_space.class_subject_id or not exists(select 1 from public.account_access where user_id=target.teacher_id and role='teacher' and status='active') then raise exception 'INVALID_TARGET_SPACE'; end if;
 update public.courses set teaching_space_id=target.id,row_version=row_version+1,updated_at=now() where id=c.id returning * into c;
 perform private.audit('course_transferred','course',c.id,jsonb_build_object('from_space',old_space.id,'to_space',target.id,'reason',left(p_reason,1000))); return to_jsonb(c);
end $$;
create function public.save_reference(p_kind text,p_data jsonb,p_id uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; k text; val jsonb;
begin
 perform private.assert_admin();
 case p_kind
 when 'subjects' then
  if p_id is null then insert into public.subjects(code,label) values(p_data->>'code',p_data->>'label') returning to_jsonb(subjects.*) into result;
  else update public.subjects set code=coalesce(p_data->>'code',code),label=coalesce(p_data->>'label',label),is_active=coalesce((p_data->>'is_active')::bool,is_active) where id=p_id returning to_jsonb(subjects.*) into result; end if;
 when 'levels' then
  if p_id is null then insert into public.levels(code,label,cycle,sort_order) values(p_data->>'code',p_data->>'label',p_data->>'cycle',coalesce((p_data->>'sort_order')::int,0)) returning to_jsonb(levels.*) into result;
  else update public.levels set label=coalesce(p_data->>'label',label),sort_order=coalesce((p_data->>'sort_order')::int,sort_order),is_active=coalesce((p_data->>'is_active')::bool,is_active) where id=p_id returning to_jsonb(levels.*) into result; end if;
 when 'academic_years' then
  perform pg_advisory_xact_lock(hashtextextended('current_academic_year',0));
  if coalesce((p_data->>'is_current')::bool,false) then update public.academic_years set is_current=false where is_current; end if;
  if p_id is null then insert into public.academic_years(label,starts_on,ends_on,is_current) values(p_data->>'label',(p_data->>'starts_on')::date,(p_data->>'ends_on')::date,coalesce((p_data->>'is_current')::bool,false)) returning to_jsonb(academic_years.*) into result;
  else update public.academic_years set label=coalesce(p_data->>'label',label),starts_on=coalesce((p_data->>'starts_on')::date,starts_on),ends_on=coalesce((p_data->>'ends_on')::date,ends_on),is_current=coalesce((p_data->>'is_current')::bool,is_current),status=coalesce(p_data->>'status',status),row_version=row_version+1 where id=p_id returning to_jsonb(academic_years.*) into result; end if;
 when 'settings' then
  k:=p_data->>'key'; val:=p_data->'value';
  if k='timezone' then
   if not exists(select 1 from pg_timezone_names where name=val#>>'{}') then raise exception 'INVALID_TIMEZONE'; end if;
  elsif k='join_minutes_before' then
   if (val::text)::int not between 0 and 60 then raise exception 'INVALID_SETTING'; end if;
  elsif k='max_files' then
   if (val::text)::int not between 1 and 5 then raise exception 'INVALID_SETTING'; end if;
  elsif k='max_total_bytes' then
   if (val::text)::bigint not between 1048576 and 31457280 then raise exception 'INVALID_SETTING'; end if;
  else raise exception 'INVALID_SETTING'; end if;
  if val is null then raise exception 'INVALID_SETTING'; end if;
  insert into public.platform_settings(key,value) values(k,val) on conflict(key) do update set value=excluded.value,updated_at=now() returning to_jsonb(platform_settings.*) into result;
 else raise exception 'INVALID_REQUEST'; end case;
 if result is null then raise exception 'RESOURCE_NOT_FOUND'; end if;
 perform private.audit('reference_saved',p_kind,p_id); return result;
end $$;
create function public.get_platform_settings() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin perform private.assert_admin(); return (select jsonb_object_agg(key,value) from public.platform_settings); end $$;
create function public.get_audit_events(p_limit int default 50,p_offset int default 0) returns setof private.audit_events language plpgsql stable security definer set search_path='' as $$
begin perform private.assert_admin(); return query select * from private.audit_events order by created_at desc,id desc limit greatest(1,least(p_limit,100)) offset greatest(0,p_offset); end $$;

-- RLS helpers avoid recursive policies by running with a fixed empty search path.
create function public.can_read_class(p_class_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select public.is_active_role('admin') or (public.is_active_role('student') and exists(select 1 from public.class_enrollments where class_id=p_class_id and student_id=auth.uid() and status='active'))
 or (public.is_active_role('teacher') and exists(select 1 from public.teaching_spaces t join public.class_subjects cs on cs.id=t.class_subject_id where cs.class_id=p_class_id and public.can_manage_space(t.id)));
$$;
create function public.can_read_enrollment(p_enrollment_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select public.is_active_role('admin') or exists(select 1 from public.class_enrollments e where e.id=p_enrollment_id and
 ((e.student_id=auth.uid() and public.is_active_role('student')) or (e.status='active' and exists(select 1 from public.student_subject_access a join public.teaching_spaces t on t.class_subject_id=a.class_subject_id where a.enrollment_id=e.id and a.status='active' and public.can_manage_space(t.id)))));
$$;
create function public.can_read_profile(p_user_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select p_user_id=auth.uid() or public.is_active_role('admin')
 or (public.is_active_role('student') and exists(select 1 from public.teaching_spaces t where t.teacher_id=p_user_id and public.has_subject_access(t.class_subject_id)))
 or (public.is_active_role('teacher') and exists(select 1 from public.class_enrollments e where e.student_id=p_user_id and e.status='active' and public.can_read_enrollment(e.id)));
$$;
-- Harden file visibility: a teacher cannot open a student's unsubmitted draft.
create or replace function public.can_read_file(p_file_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.files f where f.id=p_file_id and f.status in ('pending','ready') and (
 (f.target_type='submission_version' and exists(select 1 from public.submission_versions v join public.submissions s on s.id=v.submission_id where v.id=f.target_id and public.can_read_submission(s.id)
 and ((s.student_id=auth.uid()) or (f.status='ready' and v.submitted_at is not null))))
 or (f.status='ready' and ((f.target_type='course' and public.can_read_course(f.target_id)) or (f.target_type='exercise' and public.can_read_exercise(f.target_id)) or (f.target_type='competition' and public.can_read_competition(f.target_id)) or (f.target_type='announcement' and public.can_read_announcement(f.target_id))))
 or (f.owner_id=auth.uid() and f.target_type<>'submission_version' and public.can_manage_file_target(f.target_type,f.target_id))));
$$;

do $$ declare t text; begin
 foreach t in array array['profiles','account_access','academic_years','levels','subjects','classes','class_subjects','teaching_spaces','class_enrollments','student_subject_access','admission_requests','platform_settings','courses','exercises','course_progress','competitions','submissions','submission_versions','evaluations','announcements','meetings','notifications','files','submission_files','course_resources','exercise_resources','competition_resources','announcement_resources'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on table public.%I from anon, authenticated',t);
  execute format('grant select on table public.%I to authenticated',t);
  execute format('grant all on table public.%I to service_role',t);
 end loop;
end $$;
create policy profiles_read on public.profiles for select to authenticated using(public.can_read_profile(id));
create policy profiles_update on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
grant update(display_name,preferred_language) on public.profiles to authenticated;
create policy account_read on public.account_access for select to authenticated using(user_id=auth.uid() or public.is_active_role('admin'));
create policy years_read on public.academic_years for select to authenticated using(public.is_active_role('admin') or exists(select 1 from public.classes c where c.academic_year_id=academic_years.id and public.can_read_class(c.id)));
create policy levels_read on public.levels for select to authenticated using(public.is_active_role('admin') or exists(select 1 from public.classes c where c.level_id=levels.id and public.can_read_class(c.id)));
create policy subjects_read on public.subjects for select to authenticated using(public.is_active_role('admin') or exists(select 1 from public.class_subjects cs where cs.subject_id=subjects.id and (public.has_subject_access(cs.id) or exists(select 1 from public.teaching_spaces t where t.class_subject_id=cs.id and public.can_manage_space(t.id)))));
create policy classes_read on public.classes for select to authenticated using(public.can_read_class(id));
create policy class_subjects_read on public.class_subjects for select to authenticated using(public.is_active_role('admin') or public.has_subject_access(id) or exists(select 1 from public.teaching_spaces t where t.class_subject_id=class_subjects.id and public.can_manage_space(t.id)));
create policy spaces_read on public.teaching_spaces for select to authenticated using(public.can_read_space(id));
create policy enrollments_read on public.class_enrollments for select to authenticated using(public.can_read_enrollment(id));
create policy access_read on public.student_subject_access for select to authenticated using(public.is_active_role('admin') or exists(select 1 from public.class_enrollments e where e.id=student_subject_access.enrollment_id and e.student_id=auth.uid() and public.is_active_role('student')) or exists(select 1 from public.teaching_spaces t where t.class_subject_id=student_subject_access.class_subject_id and public.can_manage_space(t.id)));
create policy admissions_read on public.admission_requests for select to authenticated using(student_id=auth.uid() or public.is_active_role('admin'));
create policy settings_read on public.platform_settings for select to authenticated using(public.is_active_role('admin'));
create policy courses_read on public.courses for select to authenticated using(public.can_read_course(id));
create policy exercises_read on public.exercises for select to authenticated using(public.can_read_exercise(id));
create policy progress_read on public.course_progress for select to authenticated using((student_id=auth.uid() and public.is_active_role('student') and public.can_read_course(course_id)) or exists(select 1 from public.courses c where c.id=course_progress.course_id and public.can_manage_space(c.teaching_space_id)));
create policy competitions_read on public.competitions for select to authenticated using(public.can_read_competition(id));
create policy submissions_read on public.submissions for select to authenticated using(public.can_read_submission(id));
create policy versions_read on public.submission_versions for select to authenticated using(public.can_read_submission(submission_id) and (submitted_at is not null or exists(select 1 from public.submissions s where s.id=submission_versions.submission_id and s.student_id=auth.uid())));
create policy evaluations_read on public.evaluations for select to authenticated using(public.can_read_evaluation(id));
create policy announcements_read on public.announcements for select to authenticated using(public.can_read_announcement(id));
create policy meetings_read on public.meetings for select to authenticated using(public.can_read_announcement(announcement_id));
create policy notifications_read on public.notifications for select to authenticated using(recipient_id=auth.uid());
create policy files_read on public.files for select to authenticated using(public.can_read_file(id));
create policy submission_files_read on public.submission_files for select to authenticated using(public.can_read_file(file_id));
create policy course_resources_read on public.course_resources for select to authenticated using(public.can_read_file(file_id));
create policy exercise_resources_read on public.exercise_resources for select to authenticated using(public.can_read_file(file_id));
create policy competition_resources_read on public.competition_resources for select to authenticated using(public.can_read_file(file_id));
create policy announcement_resources_read on public.announcement_resources for select to authenticated using(public.can_read_file(file_id));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('course-materials','course-materials',false,20971520,array['image/jpeg','image/png','image/webp','application/pdf']),
 ('student-submissions','student-submissions',false,20971520,array['image/jpeg','image/png','image/webp','application/pdf']),
 ('announcement-materials','announcement-materials',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy kon_fanan_reserved_upload on storage.objects for insert to authenticated with check(
 exists(select 1 from public.files f where f.bucket=objects.bucket_id and f.object_path=objects.name and f.owner_id=auth.uid() and f.status='pending' and public.can_manage_file_target(f.target_type,f.target_id))
);
create policy kon_fanan_ready_read on storage.objects for select to authenticated using(
 exists(select 1 from public.files f where f.bucket=objects.bucket_id and f.object_path=objects.name and f.status='ready' and public.can_read_file(f.id))
);
-- No UPDATE/DELETE policy: clients cannot overwrite or delete submitted objects.
-- Draft removal goes through delete_draft_file, then the service Storage API cleanup.

-- Default EXECUTE is public in PostgreSQL. Remove it from EVERY application function.
revoke all on all functions in schema private from public, anon, authenticated;
revoke all on all tables in schema private from public, anon, authenticated;
grant all on all tables in schema private to service_role;
grant execute on all functions in schema private to service_role;
revoke all on all functions in schema public from public, anon, authenticated;
grant execute on function public.open_classes() to anon,authenticated;
do $$ declare f record; begin
 for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in (
 'is_active_role','has_subject_access','can_manage_space','can_read_space','can_read_course','can_read_exercise','can_read_competition','can_read_announcement','can_manage_submission','can_read_submission','can_read_evaluation','can_manage_file_target','can_read_file','can_read_class','can_read_enrollment','can_read_profile',
 'request_admission','decide_admission','save_class','set_subject_access','assign_teacher','set_account_status','transfer_student','save_course','save_exercise','publish_course','save_competition','publish_competition','save_announcement','publish_announcement','save_meeting','start_submission_version','save_submission_draft','submit_work','save_evaluation','publish_evaluation','request_resubmission','publish_competition_results','competition_leaderboard','set_course_progress','mark_notification_read','reserve_file','delete_draft_file','archive_content','transfer_course','save_reference','get_platform_settings','get_audit_events') loop
 execute 'grant execute on function '||f.signature||' to authenticated';
 end loop;
end $$;
grant execute on all functions in schema public to service_role;
revoke all on function public.finalize_file(uuid,bigint,text,text) from public,anon,authenticated;
