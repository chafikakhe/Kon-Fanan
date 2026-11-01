-- Course PDFs are part of the public lesson discovery. Exercise/submission files
-- stay private. Buckets stay private; only the signing Edge function gets paths.
create function public.discovery_course_documents(p_course_id uuid)
returns table(id uuid,label text,original_name text,mime_type text,size_bytes bigint)
language sql stable security definer set search_path='' as $$
 select f.id,coalesce(nullif(r.label,''),f.original_name),f.original_name,f.mime_type,f.size_bytes
 from public.course_resources r join public.files f on f.id=r.file_id
 join private.catalog_courses c on c.id=r.course_id
 where c.id=p_course_id and f.status='ready' and f.mime_type='application/pdf'
 and f.target_type='course' and f.target_id=c.id and f.bucket='course-materials'
 order by r.position,r.id;
$$;
create function public.public_course_document(p_course_id uuid,p_file_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 select jsonb_build_object('bucket',f.bucket,'object_path',f.object_path) into result
 from public.course_resources r join public.files f on f.id=r.file_id
 join private.catalog_courses c on c.id=r.course_id
 where c.id=p_course_id and f.id=p_file_id and f.status='ready' and f.mime_type='application/pdf'
 and f.target_type='course' and f.target_id=c.id and f.bucket='course-materials';
 if result is null then raise exception 'RESOURCE_NOT_FOUND'; end if;
 return result;
end $$;
revoke all on function public.discovery_course_documents(uuid),public.public_course_document(uuid,uuid) from public,anon,authenticated;
grant execute on function public.discovery_course_documents(uuid) to anon,authenticated,service_role;
grant execute on function public.public_course_document(uuid,uuid) to service_role;
