-- Reference data only. No real users, passwords, tokens or pedagogical statistics.
-- Supabase local reset seeds these values; cloud migrations never silently seed demo accounts.
insert into public.levels(code,label,cycle,sort_order) values
 ('1AC','1ère année collège','college',1),('2AC','2ème année collège','college',2),('3AC','3ème année collège','college',3),
 ('1AL','1ère année lycée','lycee',4),('2AL','2ème année lycée','lycee',5),('3AL','3ème année lycée','lycee',6)
on conflict(code) do nothing;
insert into public.subjects(code,label) values('MATH','Mathématiques'),('PHY','Physique-chimie'),('FR','Français'),('PHILO','Philosophie') on conflict(code) do nothing;
insert into public.academic_years(label,starts_on,ends_on,is_current) values('2026–2027','2026-09-01','2027-07-31',not exists(select 1 from public.academic_years where is_current)) on conflict(label) do nothing;
