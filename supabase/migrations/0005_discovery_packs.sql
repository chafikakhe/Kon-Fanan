-- Additive catalogue and manually verified purchases. No payment success is inferred
-- from a browser redirect. Existing enrollment-based grants remain authoritative.
create table public.pack_offers (
 id text primary key check(id in ('pack-1','pack-2','pack-3')),
 name text not null,
 subject_count int not null check(subject_count between 1 and 3),
 total_price numeric(10,2) not null check(total_price > 0),
 currency text not null default 'MAD' check(currency='MAD'),
 is_active boolean not null default true,
 unique(subject_count)
);
insert into public.pack_offers(id,name,subject_count,total_price) values
 ('pack-1','Pack 1',1,100),('pack-2','Pack 2',2,180),('pack-3','Pack 3',3,270);
create table public.pack_orders (
 id uuid primary key default gen_random_uuid(),
 student_id uuid not null references public.profiles(id),
 pack_id text not null references public.pack_offers(id),
 pack_name text not null,
 subject_count int not null check(subject_count between 1 and 3),
 total_price numeric(10,2) not null check(total_price>0),
 currency text not null default 'MAD' check(currency='MAD'),
 level_id uuid not null references public.levels(id),
 subject_ids uuid[] not null,
 status text not null default 'pending_review' check(status in ('pending_review','active','rejected','revoked')),
 idempotency_key uuid not null,
 course_id uuid references public.courses(id),
 exercise_id uuid references public.exercises(id),
 reviewed_by uuid references public.profiles(id),
 reviewed_at timestamptz, payment_reference text,
 created_at timestamptz not null default now(),
 check(cardinality(subject_ids)=subject_count),
 check(status<>'active' or (reviewed_by is not null and reviewed_at is not null and length(trim(payment_reference)) between 3 and 200)),
 unique(student_id,idempotency_key)
);
create index pack_orders_student_status on public.pack_orders(student_id,status,level_id);
create index pack_orders_review on public.pack_orders(created_at) where status='pending_review';
alter table public.pack_offers enable row level security;
alter table public.pack_orders enable row level security;
revoke all on public.pack_offers,public.pack_orders from public,anon,authenticated;
grant select on public.pack_offers to anon,authenticated;
grant select on public.pack_orders to authenticated;
grant all on public.pack_offers,public.pack_orders to service_role;
create policy offers_read on public.pack_offers for select to anon,authenticated using(true);
create policy orders_read on public.pack_orders for select to authenticated using(student_id=auth.uid() or public.is_active_role('admin'));

-- This projection deliberately excludes exercise instructions, files and live URLs.
-- Private views have no client privileges; only the bounded catalogue RPC reads them.
create view private.catalog_subjects as
 select distinct c.level_id,s.id,s.code,s.label
 from public.class_subjects cs join public.classes c on c.id=cs.class_id
 join public.academic_years y on y.id=c.academic_year_id
 join public.levels l on l.id=c.level_id join public.subjects s on s.id=cs.subject_id
 where cs.is_active and c.status='active' and y.status='active' and l.is_active and s.is_active;
create view private.catalog_courses as
 select c.id,c.title,c.summary,c.chapter_label,c.body,c.content_language,c.video_provider,c.video_id,c.position,
 cl.level_id,cs.subject_id,p.display_name as teacher_name
 from public.courses c join public.teaching_spaces t on t.id=c.teaching_space_id
 join public.class_subjects cs on cs.id=t.class_subject_id join public.classes cl on cl.id=cs.class_id
 join public.academic_years y on y.id=cl.academic_year_id join public.levels l on l.id=cl.level_id
 join public.subjects s on s.id=cs.subject_id join public.profiles p on p.id=t.teacher_id
 join public.account_access a on a.user_id=t.teacher_id
 where c.status='published' and t.is_active and cs.is_active and cl.status='active'
 and y.status='active' and l.is_active and s.is_active and a.role='teacher' and a.status='active';
revoke all on private.catalog_subjects,private.catalog_courses from public,anon,authenticated;

create function public.discovery_catalog(p_level_id uuid default null,p_subject_id uuid default null,p_course_id uuid default null,p_exercise_id uuid default null,p_offset int default 0)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_level uuid:=p_level_id; v_subject uuid:=p_subject_id; v_course uuid:=p_course_id; result jsonb;
begin
 if p_exercise_id is not null then
  select c.id,c.level_id,c.subject_id into v_course,v_level,v_subject
  from private.catalog_courses c join public.exercises e on e.course_id=c.id
  where e.id=p_exercise_id and e.status='published';
 elsif p_course_id is not null then
  select c.id,c.level_id,c.subject_id into v_course,v_level,v_subject from private.catalog_courses c where c.id=p_course_id;
 end if;
 select jsonb_build_object(
  'levels',coalesce((select jsonb_agg(to_jsonb(l) order by l.sort_order,l.id) from public.levels l where l.is_active),'[]'::jsonb),
  'subjects',coalesce((select jsonb_agg(to_jsonb(s) order by s.label,s.id) from private.catalog_subjects s where s.level_id=v_level),'[]'::jsonb),
  'courses',coalesce((select jsonb_agg(to_jsonb(page) order by page.position,page.id) from (
    select c.* from private.catalog_courses c where
    (v_course is not null and c.id=v_course) or
    (p_course_id is null and p_exercise_id is null and v_level is not null and v_subject is not null and c.level_id=v_level and c.subject_id=v_subject)
    order by c.position,c.id limit 24 offset greatest(0,least(coalesce(p_offset,0),100000))
  ) page),'[]'::jsonb),
  'has_more',p_course_id is null and p_exercise_id is null and (select count(*) from private.catalog_courses c where c.level_id=v_level and c.subject_id=v_subject)>greatest(0,least(coalesce(p_offset,0),100000))+24,
  'exercises',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'course_id',e.course_id,'title',e.title,'difficulty',e.difficulty,'position',e.position) order by e.position,e.id)
     from public.exercises e where e.course_id=v_course and e.status='published'),'[]'::jsonb),
  'packs',coalesce((select jsonb_agg(to_jsonb(p) order by p.subject_count) from public.pack_offers p),'[]'::jsonb),
  'level_id',v_level,'subject_id',v_subject,'course_id',v_course,
  'exercise_id',case when v_course is not null then p_exercise_id end,
  'checkout_mode','administrative_review'
 ) into result;
 return result;
end $$;

create function public.request_pack_order(p_pack_id text,p_level_id uuid,p_subject_ids uuid[],p_idempotency_key uuid,p_course_id uuid default null,p_exercise_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare offer public.pack_offers; existing public.pack_orders; result public.pack_orders; chosen uuid[]; account public.account_access;
begin
 select * into account from public.account_access where user_id=auth.uid() for update;
 if account.user_id is null or account.role<>'student' or account.status not in ('pending','active') then raise exception 'ACCESS_DENIED'; end if;
 if not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null and deleted_at is null) then raise exception 'EMAIL_NOT_CONFIRMED'; end if;
 if p_idempotency_key is null then raise exception 'IDEMPOTENCY_REQUIRED'; end if;
 select array_agg(x order by x) into chosen from unnest(p_subject_ids) x;
 select * into existing from public.pack_orders where student_id=auth.uid() and idempotency_key=p_idempotency_key;
 if existing.id is not null then
  if existing.pack_id is distinct from p_pack_id or existing.level_id is distinct from p_level_id or existing.subject_ids is distinct from chosen or existing.course_id is distinct from p_course_id or existing.exercise_id is distinct from p_exercise_id then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
  return to_jsonb(existing);
 end if;
 select * into offer from public.pack_offers where id=p_pack_id and is_active for share;
 if offer.id is null then raise exception 'PACK_UNAVAILABLE'; end if;
 if cardinality(chosen) is distinct from offer.subject_count or (select count(distinct x) from unnest(chosen) x)<>offer.subject_count
 or exists(select 1 from unnest(chosen) x where not exists(select 1 from private.catalog_subjects s where s.level_id=p_level_id and s.id=x)) then raise exception 'INVALID_SUBJECTS'; end if;
 if p_course_id is not null and not exists(select 1 from private.catalog_courses where id=p_course_id and level_id=p_level_id) then raise exception 'RESOURCE_NOT_FOUND'; end if;
 if p_exercise_id is not null and not exists(select 1 from public.exercises e join private.catalog_courses c on c.id=e.course_id where e.id=p_exercise_id and e.status='published' and e.course_id=p_course_id and c.level_id=p_level_id) then raise exception 'RESOURCE_NOT_FOUND'; end if;
 insert into public.pack_orders(student_id,pack_id,pack_name,subject_count,total_price,currency,level_id,subject_ids,idempotency_key,course_id,exercise_id)
 values(auth.uid(),offer.id,offer.name,offer.subject_count,offer.total_price,offer.currency,p_level_id,chosen,p_idempotency_key,p_course_id,p_exercise_id) returning * into result;
 perform private.audit('pack_requested','pack_order',result.id,jsonb_build_object('pack',offer.id,'total_price',offer.total_price,'status','pending_review'));
 return to_jsonb(result);
end $$;

create function public.review_pack_order(p_order_id uuid,p_decision text,p_payment_reference text default '') returns jsonb
language plpgsql security definer set search_path='' as $$
declare result public.pack_orders; account public.account_access;
begin
 perform private.assert_admin();
 if p_decision not in ('active','rejected','revoked') then raise exception 'INVALID_STATUS'; end if;
 -- Match the request lock order to avoid deadlocks for the same student.
 select * into result from public.pack_orders where id=p_order_id;
 if result.id is null then raise exception 'RESOURCE_NOT_FOUND'; end if;
 select * into account from public.account_access where user_id=result.student_id for update;
 select * into result from public.pack_orders where id=p_order_id for update;
 if result.status=p_decision then return to_jsonb(result); end if;
 if (result.status='pending_review' and p_decision not in ('active','rejected')) or (result.status='active' and p_decision<>'revoked') or result.status in ('rejected','revoked') then raise exception 'INVALID_STATUS'; end if;
 if p_decision='active' then
  if coalesce(length(trim(p_payment_reference)),0) not between 3 and 200 then raise exception 'PAYMENT_REFERENCE_REQUIRED'; end if;
  if account.role<>'student' or account.status not in ('pending','active') then raise exception 'ACCESS_DENIED'; end if;
  if exists(select 1 from unnest(result.subject_ids) x where not exists(select 1 from private.catalog_subjects s where s.level_id=result.level_id and s.id=x)) then raise exception 'INVALID_SUBJECTS'; end if;
  if not exists(select 1 from auth.users where id=result.student_id and email_confirmed_at is not null and deleted_at is null) then raise exception 'EMAIL_NOT_CONFIRMED'; end if;
  update public.account_access set status='active',activated_at=coalesce(activated_at,now()) where user_id=result.student_id and status='pending';
 end if;
 update public.pack_orders set status=p_decision,reviewed_by=auth.uid(),reviewed_at=now(),
 payment_reference=case when p_decision='active' then trim(p_payment_reference) else payment_reference end where id=result.id returning * into result;
 perform private.audit('pack_'||p_decision,'pack_order',result.id,jsonb_build_object('status',p_decision,'payment_reference',result.payment_reference));
 perform private.emit_notification(result.student_id,'pack_'||p_decision,'pack_order',result.id,'pack:'||result.id||':'||p_decision);
 return to_jsonb(result);
end $$;
create function public.set_pack_availability(p_pack_id text,p_active boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 perform private.assert_admin();
 update public.pack_offers set is_active=p_active where id=p_pack_id;
 if not found then raise exception 'PACK_UNAVAILABLE'; end if;
 perform private.audit('pack_availability','pack_offer',null,jsonb_build_object('pack',p_pack_id,'active',p_active));
end $$;

-- Keep all legacy enrollment grants, and add exactly the selected level/subjects.
create or replace function public.has_subject_access(p_class_subject_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select public.is_active_role('student') and exists(
  select 1 from public.class_subjects cs join public.classes c on c.id=cs.class_id
  join public.academic_years y on y.id=c.academic_year_id join public.subjects s on s.id=cs.subject_id
  where cs.id=p_class_subject_id and cs.is_active and s.is_active and c.status='active' and y.status='active' and (
   exists(select 1 from public.student_subject_access a join public.class_enrollments e on e.id=a.enrollment_id
    where a.class_subject_id=cs.id and a.status='active' and e.status='active' and e.student_id=auth.uid())
   or exists(select 1 from public.pack_orders o where o.student_id=auth.uid() and o.status='active' and o.level_id=c.level_id and cs.subject_id=any(o.subject_ids))
  )
 );
$$;
create or replace function public.can_read_class(p_class_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select public.is_active_role('admin') or
 (public.is_active_role('student') and (exists(select 1 from public.class_enrollments where class_id=p_class_id and student_id=auth.uid() and status='active') or exists(select 1 from public.class_subjects cs where cs.class_id=p_class_id and public.has_subject_access(cs.id))))
 or (public.is_active_role('teacher') and exists(select 1 from public.teaching_spaces t join public.class_subjects cs on cs.id=t.class_subject_id where cs.class_id=p_class_id and public.can_manage_space(t.id)));
$$;

-- Teachers can identify pupils whose purchased subjects belong to their spaces.
-- Auth email remains private; this only extends the existing public profile rule.
create or replace function public.can_read_profile(p_user_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select p_user_id=auth.uid() or public.is_active_role('admin')
 or (public.is_active_role('student') and exists(select 1 from public.teaching_spaces t where t.teacher_id=p_user_id and public.has_subject_access(t.class_subject_id)))
 or (public.is_active_role('teacher') and (
  exists(select 1 from public.class_enrollments e where e.student_id=p_user_id and e.status='active' and public.can_read_enrollment(e.id))
  or exists(select 1 from public.pack_orders o join public.account_access ac on ac.user_id=o.student_id
    join public.classes c on c.level_id=o.level_id join public.class_subjects cs on cs.class_id=c.id
    join public.teaching_spaces t on t.class_subject_id=cs.id
    where o.student_id=p_user_id and o.status='active' and ac.role='student' and ac.status='active'
    and cs.is_active and cs.subject_id=any(o.subject_ids) and public.can_manage_space(t.id))
  ));
$$;
create index pack_orders_active_level on public.pack_orders(level_id) where status='active';
create or replace function private.notify_space(p_space_id uuid,p_type text,p_target_type text,p_target_id uuid,p_key text) returns void language plpgsql security definer set search_path='' as $$
declare r record;
begin
 for r in
  select distinct e.student_id from public.teaching_spaces t join public.student_subject_access a on a.class_subject_id=t.class_subject_id
  join public.class_enrollments e on e.id=a.enrollment_id join public.account_access ac on ac.user_id=e.student_id
  join public.class_subjects cs on cs.id=t.class_subject_id join public.classes c on c.id=cs.class_id join public.academic_years y on y.id=c.academic_year_id
  where t.id=p_space_id and a.status='active' and e.status='active' and ac.status='active' and ac.role='student' and cs.is_active and c.status='active' and y.status='active'
  union
  select distinct o.student_id from public.teaching_spaces t join public.class_subjects cs on cs.id=t.class_subject_id
  join public.classes c on c.id=cs.class_id join public.academic_years y on y.id=c.academic_year_id
  join public.subjects s on s.id=cs.subject_id
  join public.pack_orders o on o.level_id=c.level_id and cs.subject_id=any(o.subject_ids)
  join public.account_access ac on ac.user_id=o.student_id
  where t.id=p_space_id and t.is_active and cs.is_active and s.is_active and c.status='active' and y.status='active'
  and o.status='active' and ac.status='active' and ac.role='student'
 loop perform private.emit_notification(r.student_id,p_type,p_target_type,p_target_id,p_key); end loop;
end $$;

revoke all on function public.discovery_catalog(uuid,uuid,uuid,uuid,int),public.request_pack_order(text,uuid,uuid[],uuid,uuid,uuid),public.review_pack_order(uuid,text,text),public.set_pack_availability(text,boolean) from public,anon,authenticated;
grant execute on function public.discovery_catalog(uuid,uuid,uuid,uuid,int) to anon,authenticated,service_role;
grant execute on function public.request_pack_order(text,uuid,uuid[],uuid,uuid,uuid),public.review_pack_order(uuid,text,text),public.set_pack_availability(text,boolean) to authenticated,service_role;
