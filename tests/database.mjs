process.on("uncaughtException", (e) => {
  console.error(e.message, e.where || "", e.position || "");
  process.exit(1);
});
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const db = new PGlite();
const uid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
let checks = 0;
const check = (condition, label) => {
  assert.ok(condition, label);
  console.log(`✓ ${label}`);
  checks++;
};
const sql = async (query, params = []) => (await db.query(query, params)).rows;
const one = async (query, params = []) => (await sql(query, params))[0];
const call = async (fn, args = []) =>
  (
    await one(
      `select public.${fn}(${args.map((_, i) => `$${i + 1}`).join(",")}) as data`,
      args,
    )
  ).data;
const as = async (id, role = "authenticated") => {
  await db.exec("reset role");
  await sql(
    "select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",
    [id || "", JSON.stringify({ sub: id || "", role })],
  );
  await db.exec(`set role ${role}`);
};
const root = async () => db.exec("reset role");
const rejects = async (action, pattern, label) => {
  try {
    await action();
    assert.fail(`Expected rejection: ${label}`);
  } catch (error) {
    assert.match(error.message, pattern, label);
    check(true, label);
  }
};
await db.exec(`
create role anon;
create role authenticated;
create role service_role bypassrls;
create schema auth;
create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,deleted_at timestamptz,raw_user_meta_data jsonb default '{}',raw_app_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create function auth.role() returns text language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role','') $$;
grant usage on schema auth to anon,authenticated,service_role;
grant execute on all functions in schema auth to anon,authenticated,service_role;
create schema storage;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,unique(bucket_id,name));
alter table storage.objects enable row level security;
grant usage on schema public,storage to anon,authenticated,service_role;
grant all on storage.objects to authenticated,service_role;
grant all on storage.buckets to service_role;
`);
await db.exec(
  await readFile(
    new URL("../supabase/migrations/0001_core.sql", import.meta.url),
    "utf8",
  ),
);
check(true, "Migration core appliquée sur PostgreSQL PGlite");
try {
  const integration = await readFile(
    new URL("../supabase/migrations/0002_integrations.sql", import.meta.url),
    "utf8",
  );
  await db.exec(integration);
  check(true, "Migration intégrations appliquée");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
await db.exec(
  await readFile(
    new URL("../supabase/migrations/0003_profile_stats.sql", import.meta.url),
    "utf8",
  ),
);
const admin = uid(1),
  teacher = uid(2),
  teacher2 = uid(3),
  student = uid(4),
  pending = uid(5),
  outsider = uid(6),
  suspended = uid(7),
  pending2 = uid(8);
for (const id of [
  admin,
  teacher,
  teacher2,
  student,
  pending,
  outsider,
  suspended,
  pending2,
]) {
  await sql(
    "insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)",
    [
      id,
      `test-${id.slice(-1)}@example.test`,
      JSON.stringify({
        display_name: `Test ${id.slice(-1)}`,
        role: "admin",
        status: "active",
      }),
    ],
  );
}
check(
  (
    await one(
      "select role,status from public.account_access where user_id=$1",
      [student],
    )
  ).role === "student",
  "Métadonnées falsifiées ne donnent pas le rôle admin",
);
await sql(
  "update public.account_access set role='admin',status='active' where user_id=$1",
  [admin],
);
await sql(
  "update public.account_access set role='teacher',status='active' where user_id=any($1::uuid[])",
  [[teacher, teacher2]],
);
await sql(
  "update public.account_access set status='active' where user_id=any($1::uuid[])",
  [[student, outsider]],
);
await sql(
  "update public.account_access set status='suspended' where user_id=$1",
  [suspended],
);
await as(admin);
const year = await call("save_reference", [
  "academic_years",
  {
    label: "2026–2027",
    starts_on: "2026-09-01",
    ends_on: "2027-07-01",
    is_current: true,
  },
]);
const level = await call("save_reference", [
  "levels",
  { code: "3AC", label: "3ème collège", cycle: "college" },
]);
const math = await call("save_reference", [
  "subjects",
  { code: "MATH", label: "Mathématiques" },
]);
const philosophy = await call("save_reference", [
  "subjects",
  { code: "PHILO", label: "Philosophie" },
]);
const school = await call("save_class", [
  {
    name: "3ème A",
    academic_year_id: year.id,
    level_id: level.id,
    capacity: 2,
    subject_ids: [math.id, philosophy.id],
  },
]);
const otherSchool = await call("save_class", [
  {
    name: "3ème B",
    academic_year_id: year.id,
    level_id: level.id,
    capacity: 1,
    subject_ids: [math.id],
  },
]);
const cs = await one(
  "select * from public.class_subjects where class_id=$1 and subject_id=$2",
  [school.id, math.id],
);
const csPhilo = await one(
  "select * from public.class_subjects where class_id=$1 and subject_id=$2",
  [school.id, philosophy.id],
);
const otherCs = await one(
  "select * from public.class_subjects where class_id=$1",
  [otherSchool.id],
);
const space = await call("assign_teacher", [teacher, cs.id]);
const space2 = await call("assign_teacher", [teacher2, cs.id]);
const philoSpace = await call("assign_teacher", [teacher2, csPhilo.id]);
const otherSpace = await call("assign_teacher", [teacher2, otherCs.id]);
await root();
await sql(
  "insert into public.class_enrollments(id,student_id,class_id,academic_year_id) values($1,$2,$3,$4),($5,$6,$7,$4)",
  [uid(20), student, school.id, year.id, uid(21), outsider, otherSchool.id],
);
await sql(
  "insert into public.student_subject_access(enrollment_id,class_subject_id,class_id) values($1,$2,$3),($4,$5,$6)",
  [uid(20), cs.id, school.id, uid(21), otherCs.id, otherSchool.id],
);
await as(pending);
const request = await call("request_admission", [school.id]);
check(
  (await sql("select * from public.courses")).length === 0,
  "Étudiant pending ne lit aucun contenu",
);
await rejects(
  () =>
    sql("update public.account_access set role='admin' where user_id=$1", [
      pending,
    ]),
  /permission denied/,
  "Écriture directe rôle/statut interdite",
);
await rejects(
  () =>
    call("save_class", [
      {
        name: "Attack",
        capacity: 5,
        academic_year_id: year.id,
        level_id: level.id,
      },
    ]),
  /ACCESS_DENIED/,
  "RPC administration refusée à un étudiant",
);
await as(admin);
await rejects(
  () =>
    call("decide_admission", [request.id, "accepted", school.id, [otherCs.id]]),
  /INVALID_SUBJECTS/,
  "Admission refuse une matière d’une autre classe",
);
const accepted = await call("decide_admission", [
  request.id,
  "accepted",
  school.id,
  [cs.id],
  "Bienvenue",
]);
check(
  accepted.status === "accepted",
  "Admission atomique active classe et matière",
);
const replay = await call("decide_admission", [
  request.id,
  "accepted",
  school.id,
  [cs.id],
  "Bienvenue",
]);
check(
  replay.accepted_enrollment_id === accepted.accepted_enrollment_id,
  "Admission répétée retourne la même inscription",
);
await as(pending2);
const req2 = await call("request_admission", [school.id]);
await as(admin);
await rejects(
  () => call("decide_admission", [req2.id, "accepted", school.id, [cs.id]]),
  /CLASS_FULL/,
  "Capacité contrôlée : dernière place indisponible",
);
check(
  (
    await one("select status from public.account_access where user_id=$1", [
      pending2,
    ])
  ).status === "pending",
  "Échec admission sans activation partielle",
);
await rejects(
  () => call("save_class", [{ capacity: 1 }, school.id, school.row_version]),
  /CAPACITY_BELOW_ENROLLMENT/,
  "Capacité ne peut pas passer sous l’effectif",
);
await as(teacher);
let course = await call("save_course", [
  {
    teaching_space_id: space.id,
    title: "Équations",
    body: "Résoudre x + 2 = 4",
    video_provider: "youtube",
    video_id: "dQw4w9WgXcQ",
  },
]);
await rejects(
  () => call("publish_course", [course.id, course.row_version]),
  /EXERCISE_REQUIRED/,
  "Publication exige un exercice",
);
const exercise = await call("save_exercise", [
  {
    course_id: course.id,
    title: "Équation simple",
    instructions: "Résoudre x + 2 = 4",
    max_score: 20,
  },
]);
course = await call("publish_course", [course.id, course.row_version]);
check(
  course.status === "published",
  "Publication cours et exercice dans la même transaction",
);
await as(teacher2);
const secondCourse = await call("save_course", [
  {
    teaching_space_id: space2.id,
    title: "Cours second prof",
    body: "Contenu",
    video_provider: "youtube",
    video_id: "dQw4w9WgXcQ",
  },
]);
await call("save_exercise", [
  { course_id: secondCourse.id, title: "Exercice", instructions: "Consigne" },
]);
await call("publish_course", [secondCourse.id, 1]);
await rejects(
  () =>
    call("save_course", [
      { title: "Intrusion" },
      course.id,
      course.row_version,
    ]),
  /ACCESS_DENIED/,
  "Professeur même matière ne modifie pas le cours d’un autre",
);
const foreignCourse = await call("save_course", [
  {
    teaching_space_id: otherSpace.id,
    title: "Autre classe",
    body: "Contenu",
    video_provider: "youtube",
    video_id: "dQw4w9WgXcQ",
  },
]);
await call("save_exercise", [
  { course_id: foreignCourse.id, title: "Exercice", instructions: "Consigne" },
]);
await call("publish_course", [foreignCourse.id, 1]);
const privateCourse = await call("save_course", [
  {
    teaching_space_id: philoSpace.id,
    title: "Philosophie",
    body: "Contenu",
    video_provider: "youtube",
    video_id: "dQw4w9WgXcQ",
  },
]);
await call("save_exercise", [
  { course_id: privateCourse.id, title: "Exercice", instructions: "Consigne" },
]);
await call("publish_course", [privateCourse.id, 1]);
await as(student);
check(
  (await sql("select * from public.courses")).length === 2,
  "Étudiant lit les deux professeurs de sa matière, aucune autre classe/matière",
);
check(
  (await sql("select * from public.subjects")).length === 1,
  "Référentiel étudiant limité à sa matière autorisée",
);
check(
  (await sql("select * from public.profiles")).length === 3,
  "Profils étudiant : soi-même et ses professeurs uniquement",
);
await rejects(
  () => call("start_submission_version", [null, uid(999)]),
  /ACCESS_DENIED/,
  "Cible étrangère refusée",
);
const version = await call("start_submission_version", [exercise.id]);
check(
  (await call("start_submission_version", [exercise.id])).id === version.id,
  "Reprise de brouillon sans version dupliquée",
);
await rejects(
  () => call("submit_work", [version.id, ""]),
  /INVALID_FILES/,
  "Remise sans fichier refusée",
);
await rejects(
  () =>
    call("reserve_file", [
      "submission_version",
      version.id,
      "attack.html",
      "text/html",
      50,
    ]),
  /INVALID_FILE/,
  "MIME interdit refusé à la réservation",
);
await rejects(
  () =>
    call("reserve_file", [
      "submission_version",
      version.id,
      "large.jpg",
      "image/jpeg",
      11000000,
    ]),
  /FILE_TOO_LARGE/,
  "Quota individuel serveur imposé",
);
const file = await call("reserve_file", [
  "submission_version",
  version.id,
  "copie.jpg",
  "image/jpeg",
  1024,
]);
await sql("insert into storage.objects(bucket_id,name) values($1,$2)", [
  file.bucket,
  file.object_path,
]);
await rejects(
  () =>
    sql("insert into storage.objects(bucket_id,name) values($1,$2)", [
      file.bucket,
      student + "/arbitrary.jpg",
    ]),
  /row-level security/,
  "Storage refuse un chemin sans réservation",
);
await rejects(
  () => call("finalize_file", [file.id, 1024, "image/jpeg"]),
  /permission denied/,
  "Finalisation réservée au service serveur",
);
await as(teacher);
check(
  (await sql("select * from public.files where id=$1", [file.id])).length === 0,
  "Professeur ne lit pas un fichier étudiant en brouillon",
);
await as(null, "service_role");
await call("finalize_file", [file.id, 1024, "image/jpeg"]);
await as(student);
const submitted = await call("submit_work", [version.id, "Ma réponse"]);
check(
  submitted.submitted_at && submitted.max_score_snapshot === 20,
  "Remise fige date, consigne et barème serveur",
);
await call("submit_work", [version.id, "Ma réponse"]);
await rejects(
  () => call("submit_work", [version.id, "autre payload"]),
  /IDEMPOTENCY_CONFLICT/,
  "Replay avec contenu différent refusé",
);
await rejects(
  () => call("delete_draft_file", [file.id]),
  /ACCESS_DENIED|VERSION_IMMUTABLE/,
  "Fichier soumis non supprimable",
);
await rejects(
  () =>
    call("reserve_file", [
      "submission_version",
      version.id,
      "second.jpg",
      "image/jpeg",
      50,
    ]),
  /ACCESS_DENIED|VERSION_IMMUTABLE/,
  "Version soumise non remplaçable",
);
const updatedStorage = await sql(
  "update storage.objects set name='replaced.jpg' where name=$1 returning *",
  [file.object_path],
);
check(
  updatedStorage.length === 0,
  "Storage ne permet pas d’écraser un objet soumis",
);
await as(teacher2);
check(
  (await sql("select * from public.submissions")).length === 0,
  "Un second professeur de la matière ne lit pas les copies du premier",
);
await as(teacher);
check(
  (await sql("select * from public.submissions")).length === 1,
  "Professeur responsable reçoit la copie",
);
check(
  (await sql("select * from public.notifications where type='work_submitted'"))
    .length === 1,
  "Remise répétée ne duplique pas la notification",
);
await rejects(
  () =>
    call("save_exercise", [
      { instructions: "Nouvelle consigne" },
      exercise.id,
      2,
    ]),
  /STATEMENT_LOCKED/,
  "Consigne notée protégée après première remise",
);
await rejects(
  () => call("save_evaluation", [version.id, "Feedback", 21]),
  /INVALID_SCORE/,
  "Note hors barème refusée",
);
const evaluation = await call("save_evaluation", [
  version.id,
  "Bon raisonnement",
  16,
]);
await as(student);
check(
  (await sql("select * from public.evaluations")).length === 0,
  "Correction brouillon totalement invisible",
);
await as(teacher);
await call("publish_evaluation", [evaluation.id, evaluation.row_version]);
await as(student);
check(
  Number((await one("select score from public.evaluations")).score) === 16,
  "Correction publiée visible au propriétaire",
);
await as(outsider);
check(
  (await sql("select * from public.evaluations")).length === 0,
  "Correction invisible à un autre étudiant",
);
await as(teacher);
await call("request_resubmission", [
  version.submission_id,
  new Date(Date.now() + 86400000).toISOString(),
  "Justifier la dernière étape",
]);
await as(student);
const secondVersion = await call("start_submission_version", [exercise.id]);
check(
  secondVersion.version_number === 2 && secondVersion.id !== version.id,
  "Nouvelle remise crée V2 et conserve V1",
);
check(
  (await sql("select * from public.submission_versions")).length === 2,
  "Historique de versions conservé",
);
await as(admin);
await call("set_subject_access", [uid(20), cs.id, false]);
await as(student);
check(
  (await sql("select * from public.courses")).length === 0,
  "Révocation matière appliquée immédiatement aux lectures",
);
check(
  (await sql("select * from public.files")).length === 0,
  "Révocation appliquée aux fichiers privés",
);
await rejects(
  () => call("set_course_progress", [course.id, "completed"]),
  /ACCESS_DENIED/,
  "Révocation appliquée aux écritures",
);
await as(admin);
await call("set_subject_access", [uid(20), cs.id, true]);
await call("set_account_status", [student, "suspended"]);
await as(student);
check(
  (await sql("select * from public.courses")).length === 0,
  "Suspension bloque le contenu malgré JWT existant",
);
await rejects(
  () => call("start_submission_version", [exercise.id]),
  /ACCESS_DENIED/,
  "Suspension bloque les remises",
);
await rejects(
  () => sql("select * from private.audit_events"),
  /permission denied/,
  "Schéma privé interdit au client",
);
await rejects(
  () => call("get_audit_events"),
  /ACCESS_DENIED/,
  "Projection audit réservée admin",
);

// Competition results have a second publication gate, even after evaluation publication.
await as(admin);
await call("set_account_status", [student, "active"]);
await as(teacher);
let competition = await call("save_competition", [
  {
    teaching_space_id: space.id,
    title: "Défi privé",
    instructions: "Explique ton raisonnement",
    opens_at: new Date(Date.now() - 3600000).toISOString(),
    closes_at: new Date(Date.now() + 3600000).toISOString(),
    leaderboard_enabled: true,
  },
]);
competition = await call("publish_competition", [
  competition.id,
  competition.row_version,
]);
await as(student);
const contestVersion = await call("start_submission_version", [
  null,
  competition.id,
]);
const contestFile = await call("reserve_file", [
  "submission_version",
  contestVersion.id,
  "reponse.pdf",
  "application/pdf",
  1024,
]);
await sql("insert into storage.objects(bucket_id,name) values($1,$2)", [
  contestFile.bucket,
  contestFile.object_path,
]);
await as(null, "service_role");
await call("finalize_file", [contestFile.id, 1024, "application/pdf"]);
await as(student);
await call("submit_work", [contestVersion.id, "Mon raisonnement"]);
await as(teacher);
const contestEvaluation = await call("save_evaluation", [
  contestVersion.id,
  "Excellent raisonnement",
  18,
]);
await call("publish_evaluation", [
  contestEvaluation.id,
  contestEvaluation.row_version,
]);
await as(student);
check(
  (
    await sql("select * from public.evaluations where id=$1", [
      contestEvaluation.id,
    ])
  ).length === 0,
  "Résultat de compétition caché malgré correction publiée",
);
await rejects(
  () => call("competition_leaderboard", [competition.id]),
  /ACCESS_DENIED/,
  "Classement caché avant publication des résultats",
);
await root();
await sql(
  "update public.competitions set closes_at=now()-interval '1 minute',opens_at=now()-interval '1 hour' where id=$1",
  [competition.id],
);
await as(teacher);
await call("publish_competition_results", [
  competition.id,
  competition.row_version,
]);
await as(student);
check(
  (
    await sql("select * from public.evaluations where id=$1", [
      contestEvaluation.id,
    ])
  ).length === 1,
  "Publication des résultats libère la correction de compétition",
);
const ranking = await sql("select * from public.competition_leaderboard($1)", [
  competition.id,
]);
check(
  ranking.length === 1 &&
    ranking[0].pseudonym.startsWith("Élève ") &&
    !JSON.stringify(ranking).includes("@"),
  "Classement limité aux pseudonymes et résultats publiés",
);
// Durable jobs, idempotency, access checks and cancellation race, without claiming a real Google call.
await root();
await sql(
  "insert into private.google_connections(teacher_id,google_subject,google_email,granted_scopes,ciphertext,iv,key_version) values($1,'fixture-google','teacher@example.test',ARRAY['calendar.events.owned'],'fixture','fixture','v1')",
  [teacher],
);
await as(teacher);
let meeting = await call("save_meeting", [
  {
    teaching_space_id: space.id,
    title: "Révision",
    body: "Cours en direct",
    starts_at: new Date(Date.now() + 300000).toISOString(),
    ends_at: new Date(Date.now() + 3900000).toISOString(),
    timezone: "Africa/Casablanca",
  },
]);
const queued = await call("queue_meeting_operation", [
  meeting.id,
  "create",
  meeting.row_version,
  "fixture-create-key",
  {},
]);
const repeated = await call("queue_meeting_operation", [
  meeting.id,
  "create",
  meeting.row_version,
  "fixture-create-key",
  {},
]);
check(
  queued.operationId === repeated.operationId,
  "Double clic séance : même opération durable",
);
await rejects(
  () =>
    call("queue_meeting_operation", [
      meeting.id,
      "create",
      meeting.row_version,
      "fixture-create-key",
      { title: "different" },
    ]),
  /IDEMPOTENCY_CONFLICT/,
  "Même clé de séance et payload différent : conflit",
);
await as(student);
check(
  (await sql("select * from public.meetings where id=$1", [meeting.id]))
    .length === 0,
  "Séance en préparation invisible aux étudiants",
);
await rejects(
  () => call("integration_command", ["job_claim", {}]),
  /permission denied|ACCESS_DENIED/,
  "Worker privilégié inaccessible au client",
);
await as(null, "service_role");
let context = await call("integration_command", ["job_claim", {}]);
check(
  context.integration.google_event_id === meeting.id.replaceAll("-", ""),
  "Identifiant Google stable dérivé de la séance",
);
await call("integration_command", [
  "job_finish",
  {
    job_id: context.job.id,
    lease_token: context.job.lease_token,
    meet_url: "https://meet.google.com/abc-defg-hij",
    etag: "fixture-etag",
  },
]);
await as(student);
check(
  (await call("get_meeting_join_url", [meeting.id])) ===
    "https://meet.google.com/abc-defg-hij",
  "Lien séance délivré après revalidation du contexte et de la fenêtre",
);
await as(outsider);
await rejects(
  () => call("get_meeting_join_url", [meeting.id]),
  /ACCESS_DENIED/,
  "Étudiant autre classe ne reçoit aucun lien Meet",
);
await as(teacher);
const racing = await call("save_meeting", [
  {
    teaching_space_id: space.id,
    title: "Course annulation",
    starts_at: new Date(Date.now() + 300000).toISOString(),
    ends_at: new Date(Date.now() + 3900000).toISOString(),
  },
]);
await call("queue_meeting_operation", [
  racing.id,
  "create",
  1,
  "fixture-race-create",
  {},
]);
await as(null, "service_role");
context = await call("integration_command", ["job_claim", {}]);
await as(teacher);
await call("queue_meeting_operation", [
  racing.id,
  "cancel",
  2,
  "fixture-race-cancel",
  {},
]);
await as(null, "service_role");
await call("integration_command", [
  "job_finish",
  {
    job_id: context.job.id,
    lease_token: context.job.lease_token,
    meet_url: "https://meet.google.com/abc-defg-hij",
  },
]);
await as(teacher);
check(
  (await one("select status from public.meetings where id=$1", [racing.id]))
    .status === "cancelled",
  "Fin de création tardive ne republie pas une séance annulée",
);
await as(null, "service_role");
await call("integration_command", [
  "oauth_ticket",
  { teacher_id: teacher, token_hash: "ticket-fixture" },
]);
await call("integration_command", [
  "oauth_redirect",
  {
    ticket_hash: "ticket-fixture",
    state_hash: "state-fixture",
    proof_hash: "proof-fixture",
    nonce: "nonce-fixture",
  },
]);
await rejects(
  () =>
    call("integration_command", [
      "oauth_redirect",
      {
        ticket_hash: "ticket-fixture",
        state_hash: "state-again",
        proof_hash: "proof",
        nonce: "n",
      },
    ]),
  /OAUTH_FLOW_INVALID/,
  "Ticket OAuth à usage unique",
);
await rejects(
  () =>
    call("integration_command", [
      "oauth_consume",
      { state_hash: "state-fixture", proof_hash: "wrong-browser" },
    ]),
  /OAUTH_FLOW_INVALID/,
  "Callback OAuth avec mauvaise preuve navigateur refusé",
);
const flow = await call("integration_command", [
  "oauth_consume",
  { state_hash: "state-fixture", proof_hash: "proof-fixture" },
]);
check(
  flow.teacher_id === teacher && flow.nonce === "nonce-fixture",
  "State OAuth lié au professeur et au nonce",
);
await rejects(
  () =>
    call("integration_command", [
      "oauth_consume",
      { state_hash: "state-fixture", proof_hash: "proof-fixture" },
    ]),
  /OAUTH_FLOW_INVALID/,
  "State OAuth consommé non rejouable",
);
await as(student);
await call("save_profile", ["Nouveau nom", "fr"]);
await rejects(
  () => call("admin_directory"),
  /ACCESS_DENIED/,
  "Annuaire email interdit aux étudiants",
);
await rejects(
  () => call("set_account_status", [student, "active"]),
  /ACCESS_DENIED/,
  "Édition du profil ne donne aucun droit sur le statut",
);
await as(null, "anon");
check(
  (await sql("select * from public.open_classes()")).length === 2,
  "Inscription anonyme reçoit uniquement la projection des classes",
);
await rejects(
  () => sql("select * from public.profiles"),
  /permission denied/,
  "Anonyme ne lit pas les profils",
);
await root();
const bootstrapId = "a35938cd-c92b-4a33-a12d-828f52d478e7";
const bootstrapMigration = await readFile(
  new URL("../supabase/migrations/0004_bootstrap_admin.sql", import.meta.url),
  "utf8",
);
const adminsBefore = Number(
  (await one("select count(*) n from public.account_access where role='admin'"))
    .n,
);
await db.exec(bootstrapMigration);
check(
  Number(
    (
      await one(
        "select count(*) n from public.account_access where role='admin'",
      )
    ).n,
  ) === adminsBefore,
  "Bootstrap absent : aucun autre compte promu",
);
await sql(
  "insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,'bootstrap-fixture@example.test',now(),$2)",
  [bootstrapId, JSON.stringify({ display_name: "Profil à conserver" })],
);
await db.exec(bootstrapMigration);
const bootstrapped = await one(
  "select role,status from public.account_access where user_id=$1",
  [bootstrapId],
);
check(
  bootstrapped.role === "admin" && bootstrapped.status === "active",
  "Bootstrap : seul le compte Auth ciblé devient admin actif",
);
check(
  (
    await one("select display_name from public.profiles where id=$1", [
      bootstrapId,
    ])
  ).display_name === "Profil à conserver",
  "Bootstrap conserve les informations du profil",
);
await db.exec(bootstrapMigration);
check(
  Number(
    (
      await one(
        "select count(*) n from private.audit_events where resource_id=$1 and action='administrator_bootstrapped'",
        [bootstrapId],
      )
    ).n,
  ) === 1,
  "Bootstrap répété : une seule trace d’audit",
);

// Public discovery and purchase lifecycle: use the real functions and RLS roles.
await root();
await db.exec(
  await readFile(
    new URL("../supabase/migrations/0005_discovery_packs.sql", import.meta.url),
    "utf8",
  ),
);
check(true, "Migration additive catalogue et packs appliquée");
const buyer = uid(1000),
  otherBuyer = uid(1001),
  unconfirmedBuyer = uid(1002);
for (const id of [buyer, otherBuyer, unconfirmedBuyer])
  await sql(
    "insert into auth.users(id,email,email_confirmed_at) values($1,$2,$3)",
    [
      id,
      `buyer-${id.slice(-4)}@example.test`,
      id === unconfirmedBuyer ? null : new Date().toISOString(),
    ],
  );
await as(null, "anon");
const catalog = await call("discovery_catalog", [
  level.id,
  math.id,
  course.id,
  exercise.id,
  0,
]);
check(
  catalog.level_id === level.id &&
    catalog.subject_id === math.id &&
    catalog.course_id === course.id &&
    catalog.exercise_id === exercise.id,
  "Exercice public résolu vers son vrai niveau, sa matière et son cours",
);
check(
  catalog.courses[0].body === "Résoudre x + 2 = 4" &&
    catalog.exercises.some((e) => e.id === exercise.id),
  "Cours publié consultable sans compte avec liste des exercices",
);
check(
  !catalog.exercises.some((e) => "instructions" in e || "max_score" in e) &&
    !("meet_url" in catalog),
  "Catalogue public sans consigne, document privé ni lien live",
);
check(
  catalog.packs.map((p) => Number(p.total_price)).join(",") === "100,180,270",
  "Prix totaux exacts des trois packs",
);
await rejects(
  () => sql("select * from public.exercises where id=$1", [exercise.id]),
  /permission denied/,
  "Énoncé direct refusé au visiteur anonyme",
);
await rejects(
  () =>
    call("request_pack_order", [
      "pack-1",
      level.id,
      [math.id],
      uid(1003),
      null,
      null,
    ]),
  /permission denied/,
  "Demande d’achat anonyme interdite côté serveur",
);
await as(unconfirmedBuyer);
await rejects(
  () =>
    call("request_pack_order", [
      "pack-1",
      level.id,
      [math.id],
      uid(1003),
      null,
      null,
    ]),
  /EMAIL_NOT_CONFIRMED/,
  "Email non confirmé ne peut pas demander un pack",
);
await as(buyer);
await rejects(
  () =>
    call("request_pack_order", [
      "pack-2",
      level.id,
      [math.id, math.id],
      uid(1003),
      null,
      null,
    ]),
  /INVALID_SUBJECTS/,
  "Doublons de matières refusés côté serveur",
);
await rejects(
  () =>
    call("request_pack_order", [
      "pack-1",
      level.id,
      [math.id, philosophy.id],
      uid(1003),
      null,
      null,
    ]),
  /INVALID_SUBJECTS/,
  "Nombre de matières supérieur au pack refusé",
);
await rejects(
  () =>
    call("request_pack_order", [
      "pack-3",
      level.id,
      [math.id, philosophy.id],
      uid(1003),
      null,
      null,
    ]),
  /INVALID_SUBJECTS/,
  "Pack impossible faute de trois matières refusé",
);
await rejects(
  () =>
    call("request_pack_order", [
      "pack-1",
      uid(9999),
      [math.id],
      uid(1003),
      null,
      null,
    ]),
  /INVALID_SUBJECTS/,
  "Matière hors du niveau refusée",
);
await rejects(
  () =>
    call("request_pack_order", [
      "pack-1",
      level.id,
      null,
      uid(1003),
      null,
      null,
    ]),
  /INVALID_SUBJECTS/,
  "Sélection nulle refusée",
);
const purchaseKey = uid(1004);
const order = await call("request_pack_order", [
  "pack-1",
  level.id,
  [math.id],
  purchaseKey,
  course.id,
  exercise.id,
]);
check(
  order.status === "pending_review" &&
    Number(order.total_price) === 100 &&
    order.subject_ids[0] === math.id,
  "Serveur enregistre le pack, le prix, la sélection et le statut en attente",
);
check(
  order.course_id === course.id && order.exercise_id === exercise.id,
  "Contexte de reprise conservé dans la demande serveur",
);
check(
  (
    await call("request_pack_order", [
      "pack-1",
      level.id,
      [math.id],
      purchaseKey,
      course.id,
      exercise.id,
    ])
  ).id === order.id,
  "Double envoi avec même clé : une seule demande",
);
await rejects(
  () =>
    call("request_pack_order", [
      "pack-1",
      level.id,
      [philosophy.id],
      purchaseKey,
      course.id,
      exercise.id,
    ]),
  /IDEMPOTENCY_CONFLICT/,
  "Réutiliser une clé avec un autre choix est refusé",
);
check(
  (await sql("select * from public.exercises where id=$1", [exercise.id]))
    .length === 0,
  "Demande en attente ne débloque pas l’énoncé par URL directe",
);
await rejects(
  () => call("start_submission_version", [exercise.id, null]),
  /ACCESS_DENIED/,
  "Demande en attente ne permet pas de déposer une copie",
);
await rejects(
  () => call("get_meeting_join_url", [meeting.id]),
  /ACCESS_DENIED/,
  "Demande en attente ne donne pas le lien live",
);
await rejects(
  () =>
    sql("update public.pack_orders set status='active' where id=$1", [
      order.id,
    ]),
  /permission denied/,
  "Activation par écriture directe interdite",
);
await rejects(
  () => call("review_pack_order", [order.id, "active", "fake"]),
  /ACCESS_DENIED/,
  "Étudiant ne peut pas valider son propre règlement",
);
await as(otherBuyer);
check(
  (await sql("select * from public.pack_orders")).length === 0,
  "Demandes d’un autre étudiant invisibles",
);
await as(admin);
await rejects(
  () => call("review_pack_order", [order.id, "active", ""]),
  /PAYMENT_REFERENCE_REQUIRED/,
  "Administration doit fournir une référence de règlement",
);
const activated = await call("review_pack_order", [
  order.id,
  "active",
  "RECEIPT-VERIFIED-001",
]);
check(
  activated.status === "active" && activated.reviewed_by === admin,
  "Validation administrative explicite active le pack et conserve le valideur",
);
await call("review_pack_order", [order.id, "active", "RECEIPT-VERIFIED-001"]);
await as(buyer);
check(
  (
    await one("select status from public.account_access where user_id=$1", [
      buyer,
    ])
  ).status === "active",
  "Compte pending activé uniquement après validation administrative",
);
check(
  (await sql("select * from public.exercises where id=$1", [exercise.id]))
    .length === 1,
  "Pack actif donne accès à l’exercice acheté via RLS",
);
check(
  (await call("has_subject_access", [otherCs.id])) === true,
  "Pack couvre les cours de la même matière et du même niveau",
);
check(
  (await call("has_subject_access", [csPhilo.id])) === false &&
    (await sql("select * from public.courses where id=$1", [privateCourse.id]))
      .length === 0,
  "Une matière achetée ne donne aucun accès à une autre matière",
);
check(
  (await sql("select * from public.classes where id=$1", [school.id]))
    .length === 1,
  "Métadonnées de la classe accessibles au détenteur de pack sans inscription historique",
);
await as(teacher);
check(
  (await sql("select * from public.profiles where id=$1", [buyer])).length ===
    1,
  "Professeur de la matière achetée peut identifier son nouvel étudiant",
);
await root();
await sql(
  "select private.notify_space($1,'meeting_scheduled','meeting',$2,'pack-live-notification-fixture')",
  [space.id, meeting.id],
);
await as(buyer);
check(
  (
    await sql(
      "select * from public.notifications where dedupe_key='pack-live-notification-fixture'",
    )
  ).length === 1,
  "Étudiant avec pack reçoit les notifications de sa matière",
);
// Create a separate joinable live; no Google request is simulated as verified.
await root();
const packAnnouncement = uid(1010),
  packMeeting = uid(1011),
  philoAnnouncement = uid(1012),
  philoMeeting = uid(1013);
await sql(
  "insert into public.announcements(id,teaching_space_id,type,title,status,created_by) values($1,$2,'live_session','Live math','published',$3),($4,$5,'live_session','Live philo','published',$6)",
  [
    packAnnouncement,
    space.id,
    teacher,
    philoAnnouncement,
    philoSpace.id,
    teacher2,
  ],
);
await sql(
  "insert into public.meetings(id,announcement_id,starts_at,ends_at,status,sync_status) values($1,$2,now(),now()+interval '1 hour','scheduled','synced'),($3,$4,now(),now()+interval '1 hour','scheduled','synced')",
  [packMeeting, packAnnouncement, philoMeeting, philoAnnouncement],
);
const liveConnection = (
  await one("select id from private.google_connections where teacher_id=$1", [
    teacher,
  ])
).id;
await sql(
  "insert into private.meeting_integrations(meeting_id,connection_id,google_event_id,conference_request_id,meet_url) values($1,$2,'pack-live-math','pack-live-math','https://meet.google.com/abc-defg-hij'),($3,$2,'pack-live-philo','pack-live-philo','https://meet.google.com/xyz-abcd-efg')",
  [packMeeting, liveConnection, philoMeeting],
);
await as(buyer);
check(
  (await call("get_meeting_join_url", [packMeeting])) ===
    "https://meet.google.com/abc-defg-hij",
  "Live de la matière achetée délivré par le contrôle serveur existant",
);
await rejects(
  () => call("get_meeting_join_url", [philoMeeting]),
  /ACCESS_DENIED/,
  "URL directe du live d’une autre matière refusée",
);
await as(admin);
await call("review_pack_order", [order.id, "revoked", ""]);
await as(buyer);
check(
  !(await call("can_read_exercise", [exercise.id])),
  "Révocation du pack retire immédiatement l’accès à l’exercice",
);
await rejects(
  () => call("get_meeting_join_url", [packMeeting]),
  /ACCESS_DENIED/,
  "Révocation du pack retire immédiatement le lien live",
);
await as(student);
check(
  await call("can_read_exercise", [exercise.id]),
  "Accès historiques conservés après migration et révocation d’un pack tiers",
);
await as(otherBuyer);
const secondOrder = await call("request_pack_order", [
  "pack-2",
  level.id,
  [math.id, philosophy.id],
  uid(1020),
  null,
  null,
]);
check(
  secondOrder.subject_count === 2 && Number(secondOrder.total_price) === 180,
  "Pack 2 conserve exactement deux matières pour 180 DH au total",
);
await as(admin);
await call("review_pack_order", [secondOrder.id, "rejected", ""]);
await as(otherBuyer);
check(
  !(await call("has_subject_access", [cs.id])),
  "Demande refusée ne donne aucun accès",
);
await as(admin);
const additionalSubject = await call("save_reference", [
  "subjects",
  { code: "PHY", label: "Physique-chimie" },
]);
await root();
await sql(
  "insert into public.class_subjects(class_id,subject_id) values($1,$2)",
  [school.id, additionalSubject.id],
);
await as(buyer);
const thirdOrder = await call("request_pack_order", [
  "pack-3",
  level.id,
  [math.id, philosophy.id, additionalSubject.id],
  uid(1030),
  null,
  null,
]);
check(
  thirdOrder.subject_count === 3 && Number(thirdOrder.total_price) === 270,
  "Pack 3 enregistre trois matières distinctes pour 270 DH au total",
);
await as(admin);
await call("review_pack_order", [thirdOrder.id, "active", "VERIFIED-PACK3"]);
const differentLevel = await call("save_reference", [
  "levels",
  { code: "2AC", label: "2ème collège", cycle: "college" },
]);
const differentSchool = await call("save_class", [
  {
    name: "2ème A",
    academic_year_id: year.id,
    level_id: differentLevel.id,
    capacity: 10,
    subject_ids: [math.id],
  },
]);
await root();
const differentCs = await one(
  "select id from public.class_subjects where class_id=$1",
  [differentSchool.id],
);
await as(buyer);
check(
  !(await call("has_subject_access", [differentCs.id])),
  "Pack ne débloque pas la même matière à un autre niveau",
);
await as(admin);
await call("set_account_status", [buyer, "suspended"]);
await as(buyer);
check(
  !(await call("has_subject_access", [cs.id])),
  "Compte suspendu ne conserve pas un accès issu du pack actif",
);
await as(admin);
await rejects(
  () => call("review_pack_order", [thirdOrder.id, "rejected", ""]),
  /INVALID_STATUS/,
  "Transition de statut incohérente refusée après activation",
);
await call("set_account_status", [buyer, "active"]);
await as(admin);
await call("set_pack_availability", ["pack-1", false]);
await as(buyer);
await rejects(
  () =>
    call("request_pack_order", [
      "pack-1",
      level.id,
      [math.id],
      uid(1021),
      null,
      null,
    ]),
  /PACK_UNAVAILABLE/,
  "Pack suspendu ne peut plus recevoir de nouvelles demandes",
);
await root();

await db.exec(
  await readFile(
    new URL(
      "../supabase/migrations/0006_public_course_documents.sql",
      import.meta.url,
    ),
    "utf8",
  ),
);
const publicPdf = uid(2000),
  privateExercisePdf = uid(2001);
await sql(
  "insert into public.files(id,owner_id,bucket,object_path,original_name,mime_type,size_bytes,status,target_type,target_id) values($1,$2,'course-materials','fixture-course.pdf','Cours.pdf','application/pdf',100,'ready','course',$3),($4,$2,'course-materials','fixture-exercise.pdf','Exercice.pdf','application/pdf',100,'ready','exercise',$5)",
  [publicPdf, teacher, course.id, privateExercisePdf, exercise.id],
);
await sql(
  "insert into public.course_resources(course_id,file_id,label) values($1,$2,$3)",
  [course.id, publicPdf, "Livre du cours"],
);
await as(null, "anon");
const publicDocuments = await sql(
  "select * from public.discovery_course_documents($1)",
  [course.id],
);
check(
  publicDocuments.length === 1 && publicDocuments[0].id === publicPdf,
  "Visiteur découvre uniquement le PDF attaché au cours publié",
);
check(
  !("object_path" in publicDocuments[0]) && !("bucket" in publicDocuments[0]),
  "Projection publique des PDF sans chemin Storage",
);
await rejects(
  () => call("public_course_document", [course.id, publicPdf]),
  /permission denied/,
  "Seul le serveur peut obtenir le chemin de signature du PDF",
);
await rejects(
  () => sql("select * from public.files where id=$1", [privateExercisePdf]),
  /permission denied/,
  "Le partage du PDF du cours ne publie pas les fichiers des exercices",
);
await as(null, "service_role");
check(
  (await call("public_course_document", [course.id, publicPdf])).object_path ===
    "fixture-course.pdf",
  "Serveur obtient le seul chemin du PDF de cours validé",
);
await rejects(
  () => call("public_course_document", [course.id, privateExercisePdf]),
  /RESOURCE_NOT_FOUND/,
  "Demande de signature d’un PDF exercice refusée",
);
await rejects(
  () => call("public_course_document", [secondCourse.id, publicPdf]),
  /RESOURCE_NOT_FOUND/,
  "PDF d’un autre cours non substituable",
);
await root();
await sql("update public.courses set status='archived' where id=$1", [
  course.id,
]);
await as(null, "anon");
check(
  (
    await sql("select * from public.discovery_course_documents($1)", [
      course.id,
    ])
  ).length === 0,
  "PDF retiré du catalogue dès archivage du cours",
);
await as(null, "service_role");
await rejects(
  () => call("public_course_document", [course.id, publicPdf]),
  /RESOURCE_NOT_FOUND/,
  "Archivage empêche toute nouvelle signature du PDF",
);
await root();

// The exercise-PDF creation flow reuses the protected reservation/finalization pipeline.
await as(teacher);
let pdfExercise = await call("save_exercise", [
  {
    course_id: course.id,
    title: "Exercice PDF",
    instructions: "Énoncé dans le PDF joint.",
    status: "draft",
  },
]);
await root();
await sql("update public.courses set status='published' where id=$1", [
  course.id,
]);
await as(teacher);
const exercisePdfReservation = await call("reserve_file", [
  "exercise",
  pdfExercise.id,
  "Exercice.pdf",
  "application/pdf",
  200,
]);
check(
  exercisePdfReservation.status === "pending",
  "PDF exercice réservé sans publication avant validation",
);
await as(null, "service_role");
await call("finalize_file", [
  exercisePdfReservation.id,
  200,
  "application/pdf",
  null,
]);
await as(teacher);
check(
  (
    await sql("select * from public.exercise_resources where exercise_id=$1", [
      pdfExercise.id,
    ])
  ).length === 1,
  "Finalisation rattache le PDF à l’exercice sans le publier comme document de cours",
);
pdfExercise = await call("save_exercise", [
  { status: "published" },
  pdfExercise.id,
  pdfExercise.row_version,
]);
await as(student);
check(
  await call("can_read_file", [exercisePdfReservation.id]),
  "Étudiant autorisé à la matière peut lire le PDF exercice validé",
);
await as(outsider);
check(
  !(await call("can_read_file", [exercisePdfReservation.id])),
  "Étudiant sans droit matière ne peut pas lire le PDF exercice",
);
await as(null, "anon");
await rejects(
  () =>
    sql("select * from public.exercise_resources where file_id=$1", [
      exercisePdfReservation.id,
    ]),
  /permission denied/,
  "Pièce jointe PDF exercice invisible aux visiteurs",
);
await as(teacher);
await rejects(
  () =>
    call("reserve_file", [
      "exercise",
      exercise.id,
      "Changement.pdf",
      "application/pdf",
      200,
    ]),
  /ACCESS_DENIED/,
  "Énoncé PDF d’un exercice déjà remis reste protégé contre les ajouts",
);
await root();
// Direct teacher provisioning: exercise the real signup trigger in PostgreSQL.
const preserved = await sql(
  "select to_jsonb(t) as row from public.teaching_spaces t order by id",
);
const oldAccounts = await sql(
  "select to_jsonb(a) as row from public.account_access a order by user_id",
);
await db.exec(
  await readFile(
    new URL(
      "../supabase/migrations/0007_teacher_accounts.sql",
      import.meta.url,
    ),
    "utf8",
  ),
);
check(true, "Migration comptes professeurs appliquée");
const newTeacher = uid(9001);
async function provisionTeacher(
  id,
  creator = admin,
  names = { first_name: "Nadia", last_name: "Benali" },
) {
  // Match GoTrue Admin's transaction: insert first, then apply app_metadata.
  await db.exec("begin");
  try {
    await sql(
      "insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)",
      [id, `teacher-${id}@example.test`, JSON.stringify(names)],
    );
    await sql("update auth.users set raw_app_meta_data=$2 where id=$1", [
      id,
      JSON.stringify({ kon_fanan_teacher: { created_by: creator } }),
    ]);
    await db.exec("commit");
  } catch (error) {
    await db.exec("rollback");
    throw error;
  }
}

await provisionTeacher(newTeacher);
const insertedTeacher = uid(9002);
await sql(
  "insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data) values($1,$2,$3,$4)",
  [
    insertedTeacher,
    "teacher-insert@example.test",
    JSON.stringify({ first_name: "Amine", last_name: "Recette" }),
    JSON.stringify({ kon_fanan_teacher: { created_by: admin } }),
  ],
);
check(
  (
    await one("select role from public.account_access where user_id=$1", [
      insertedTeacher,
    ])
  ).role === "teacher",
  "Métadonnées présentes dès insertion également prises en charge",
);
await sql("update public.profiles set display_name='Nom modifié' where id=$1", [
  insertedTeacher,
]);
await sql(
  "update public.account_access set status='suspended' where user_id=$1",
  [insertedTeacher],
);
await sql(
  "update auth.users set raw_app_meta_data=raw_app_meta_data || '{\"another_provider\":true}'::jsonb where id=$1",
  [insertedTeacher],
);
check(
  (
    await one("select display_name from public.profiles where id=$1", [
      insertedTeacher,
    ])
  ).display_name === "Nom modifié" &&
    (
      await one("select status from public.account_access where user_id=$1", [
        insertedTeacher,
      ])
    ).status === "suspended",
  "Mise à jour Auth ultérieure ne réinitialise ni profil ni suspension",
);
const newProfile = await one("select * from public.profiles where id=$1", [
  newTeacher,
]);
check(
  newProfile.display_name === "Nadia Benali" &&
    newProfile.first_name === "Nadia" &&
    newProfile.last_name === "Benali",
  "Nom, prénom et profil créés par le trigger Auth",
);
check(
  (
    await one("select * from public.account_access where user_id=$1", [
      newTeacher,
    ])
  ).status === "active",
  "Accès professeur immédiatement actif",
);
check(
  (
    await one(
      "select * from private.audit_events where resource_id=$1 and action='teacher_created'",
      [newTeacher],
    )
  ).actor_id === admin,
  "Création auditée sans identifiants secrets",
);
await as(newTeacher);
check(
  await call("is_active_role", ["teacher"]),
  "Le nouveau compte possède immédiatement le rôle professeur",
);
await rejects(
  () => call("authorize_teacher_creation", [admin]),
  /permission denied/,
  "Un professeur ne peut pas appeler la commande serveur de création",
);
await as(student);
await rejects(
  () => call("authorize_teacher_creation", [admin]),
  /permission denied/,
  "Un étudiant ne peut pas appeler la commande serveur de création",
);
await as(null, "anon");
await rejects(
  () => call("authorize_teacher_creation", [admin]),
  /permission denied/,
  "Un visiteur ne peut pas appeler la commande serveur de création",
);
await as(null, "service_role");
check(
  await call("authorize_teacher_creation", [admin]),
  "Le serveur autorise un administrateur actif",
);
await rejects(
  () => call("authorize_teacher_creation", [teacher]),
  /ACCESS_DENIED/,
  "Le serveur refuse un créateur non administrateur",
);
await root();
for (const [i, creator] of [teacher, student, suspended, uid(9999)].entries()) {
  const rejectedId = uid(9010 + i);
  await rejects(
    () => provisionTeacher(rejectedId, creator),
    /ACCESS_DENIED/,
    "Le trigger refuse un créateur sans accès admin actif",
  );
  check(
    !(await one("select 1 from auth.users where id=$1", [rejectedId])),
    "Création refusée : aucune identité Auth résiduelle",
  );
}
const spoofedId = uid(9020);
await sql(
  "insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)",
  [
    spoofedId,
    "spoof@example.test",
    JSON.stringify({
      first_name: "Faux",
      last_name: "Admin",
      role: "teacher",
      status: "active",
      kon_fanan_teacher: { created_by: admin },
    }),
  ],
);
const spoofedAccess = await one(
  "select * from public.account_access where user_id=$1",
  [spoofedId],
);
check(
  spoofedAccess.role === "student" && spoofedAccess.status === "pending",
  "Les métadonnées utilisateur ne permettent pas de créer un professeur",
);
const invalidId = uid(9030);
await rejects(
  () =>
    provisionTeacher(invalidId, admin, { first_name: "", last_name: "Benali" }),
  /INVALID_REQUEST/,
  "Profil invalide refusé",
);
check(
  !(await one("select 1 from auth.users where id=$1", [invalidId])),
  "Échec de validation du profil annule aussi le compte Auth",
);
const failedId = uid(9040);
await db.exec(`create function private.test_teacher_failure() returns trigger language plpgsql as $$ begin
  if new.id='${failedId}'::uuid then raise exception 'TEST_ACCESS_FAILURE'; end if; return new; end $$;
  create trigger test_teacher_failure before update on public.profiles for each row execute function private.test_teacher_failure();`);
await rejects(
  () => provisionTeacher(failedId),
  /TEST_ACCESS_FAILURE/,
  "Échec injecté après création du profil",
);
check(
  !(await one("select 1 from auth.users where id=$1", [failedId])) &&
    !(await one("select 1 from public.profiles where id=$1", [failedId])) &&
    !(await one("select 1 from public.account_access where user_id=$1", [
      failedId,
    ])) &&
    !(await one("select 1 from private.audit_events where resource_id=$1", [
      failedId,
    ])),
  "Échec du rôle : compte Auth, profil, accès et audit entièrement annulés",
);
await db.exec(
  "drop trigger test_teacher_failure on public.profiles; drop function private.test_teacher_failure()",
);
assert.deepEqual(
  await sql(
    "select to_jsonb(t) as row from public.teaching_spaces t order by id",
  ),
  preserved,
);
assert.deepEqual(
  await sql(
    "select to_jsonb(a) as row from public.account_access a where user_id<>all($1::uuid[]) order by user_id",
    [[newTeacher, insertedTeacher, spoofedId]],
  ),
  oldAccounts,
);
check(true, "Comptes existants et affectations conservés à l’identique");
await sql(
  "insert into private.audit_events(actor_id,action,resource_type,resource_id) select $1,'teacher_created','profile',gen_random_uuid() from generate_series(1,28)",
  [admin],
);
await rejects(
  () => provisionTeacher(uid(9050)),
  /RATE_LIMITED/,
  "Limite serveur de 30 créations par heure et administrateur",
);
check(
  !(await one("select 1 from auth.users where id=$1", [uid(9050)])),
  "Limite atteinte : aucune identité Auth créée",
);
await root();
await db.exec(
  await readFile(
    new URL(
      "../supabase/migrations/0008_student_whatsapp.sql",
      import.meta.url,
    ),
    "utf8",
  ),
);
const whatsappStudent = uid(9900),
  whatsappClass = uid(9903);
await sql(
  "insert into public.academic_years(id,label,starts_on,ends_on,status) values($1,'WhatsApp test','2026-09-01','2027-07-01','active')",
  [uid(9901)],
);
await sql(
  "insert into public.levels(id,code,label,cycle) values($1,'WA','WhatsApp test','college')",
  [uid(9902)],
);
await sql(
  "insert into public.classes(id,name,academic_year_id,level_id,capacity,status) values($1,'WhatsApp test',$2,$3,10,'active')",
  [whatsappClass, uid(9901), uid(9902)],
);
await sql(
  "insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,'whatsapp@example.test',now(),$2)",
  [
    whatsappStudent,
    JSON.stringify({
      display_name: "Test WhatsApp",
      whatsapp_number: "+212612345678",
      requested_class_id: whatsappClass,
      role: "admin",
      password: "not-copied-from-metadata",
    }),
  ],
);
check(
  (
    await one("select status from public.account_access where user_id=$1", [
      whatsappStudent,
    ])
  ).status === "pending",
  "Inscription sans confirmation email : compte étudiant en attente uniquement",
);
check(
  Boolean(
    await one(
      "select 1 from public.admission_requests where student_id=$1 and status='pending'",
      [whatsappStudent],
    ),
  ),
  "Demande créée avec l’identité dans la même transaction",
);
check(
  !JSON.stringify(
    await one("select * from public.student_contacts where student_id=$1", [
      whatsappStudent,
    ]),
  ).includes("password"),
  "Aucun mot de passe copié dans les contacts",
);
await rejects(
  () =>
    sql(
      "insert into auth.users(id,email,raw_user_meta_data) values($1,'bad-phone@example.test',$2)",
      [uid(9904), JSON.stringify({ whatsapp_number: "invalid" })],
    ),
  /INVALID_WHATSAPP/,
  "Numéro invalide refusé côté SQL",
);
check(
  !(await one("select 1 from auth.users where id=$1", [uid(9904)])),
  "Numéro invalide : insertion Auth entièrement annulée",
);
await as(whatsappStudent);
check(
  (await sql("select * from public.student_contacts")).length === 1,
  "Le compte en attente lit uniquement son contact",
);
check(
  (await call("save_student_contact", ["+212612345679", whatsappStudent]))
    .whatsapp_number === "+212612345679",
  "L’étudiant peut mettre à jour son propre numéro",
);
await rejects(
  () => call("save_student_contact", ["+212612345678", outsider]),
  /ACCESS_DENIED/,
  "L’étudiant ne peut pas modifier le contact d’un autre compte",
);
await rejects(
  () =>
    sql("update public.student_contacts set whatsapp_number='+212600000000'"),
  /permission denied/i,
  "Aucune modification directe du contact",
);
await as(teacher);
await rejects(
  () => call("save_student_contact", ["+212612345678", whatsappStudent]),
  /ACCESS_DENIED/,
  "Le professeur ne peut modifier les contacts étudiants",
);
check(
  (await sql("select * from public.student_contacts")).length === 0,
  "Le professeur ne voit aucun numéro WhatsApp",
);
await as(outsider);
check(
  (await sql("select * from public.student_contacts")).length === 0,
  "Un autre étudiant ne voit pas le numéro",
);
await as(admin);
check(
  (await sql("select * from public.student_contacts")).length === 1,
  "L’administration active peut lire le numéro",
);
await rejects(
  () => call("authorize_student_password_reset", [admin, whatsappStudent]),
  /permission denied/i,
  "Garde privilégiée inaccessible au navigateur admin",
);
await as(null, "service_role");
await rejects(
  () => call("authorize_student_password_reset", [admin, whatsappStudent]),
  /ACCESS_DENIED/,
  "Réinitialisation interdite avant activation du compte",
);
await root();
await sql("update public.account_access set status='active' where user_id=$1", [
  whatsappStudent,
]);
await as(null, "service_role");
check(
  await call("authorize_student_password_reset", [admin, whatsappStudent]),
  "Serveur admin autorisé pour un étudiant actif",
);
await rejects(
  () => call("authorize_student_password_reset", [admin, whatsappStudent]),
  /RATE_LIMITED/,
  "Réinitialisations répétées limitées côté serveur",
);
await rejects(
  () => call("authorize_student_password_reset", [teacher, whatsappStudent]),
  /ACCESS_DENIED/,
  "Un professeur ne peut autoriser aucune réinitialisation",
);
// Manual Meet workflow: no Google connection or external worker required.
await root();
await db.exec(
  await readFile(
    new URL(
      "../supabase/migrations/0009_manual_meet_links.sql",
      import.meta.url,
    ),
    "utf8",
  ),
);
const manualTeacher = uid(9200),
  manualStudent = uid(9201),
  manualOtherTeacher = uid(9202),
  manualOutsider = uid(9203);
for (const id of [
  manualTeacher,
  manualStudent,
  manualOtherTeacher,
  manualOutsider,
]) {
  await sql(
    "insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())",
    [id, `manual-${id.slice(-4)}@example.test`],
  );
  await sql(
    "update public.account_access set status='active',role=$2 where user_id=$1",
    [
      id,
      [manualTeacher, manualOtherTeacher].includes(id) ? "teacher" : "student",
    ],
  );
}
await as(admin);
const manualYear = await call("save_reference", [
  "academic_years",
  {
    label: "Recette Meet manuel",
    starts_on: "2026-09-01",
    ends_on: "2027-08-01",
    is_current: false,
  },
]);
const manualLevel = await call("save_reference", [
  "levels",
  { code: "MANUAL", label: "Niveau de recette Meet", cycle: "college" },
]);
const manualSubject = await call("save_reference", [
  "subjects",
  { code: "MANUAL", label: "Matière de recette Meet" },
]);
const manualClass = await call("save_class", [
  {
    name: "Classe Meet manuel",
    academic_year_id: manualYear.id,
    level_id: manualLevel.id,
    capacity: 5,
    subject_ids: [manualSubject.id],
  },
]);
await root();
const manualCS = await one(
  "select * from public.class_subjects where class_id=$1",
  [manualClass.id],
);
await as(admin);
const manualSpace = await call("assign_teacher", [manualTeacher, manualCS.id]);
await root();
await sql(
  "insert into public.class_enrollments(id,student_id,class_id,academic_year_id) values($1,$2,$3,$4)",
  [uid(9210), manualStudent, manualClass.id, manualYear.id],
);
await sql(
  "insert into public.student_subject_access(enrollment_id,class_subject_id,class_id) values($1,$2,$3)",
  [uid(9210), manualCS.id, manualClass.id],
);
await as(manualTeacher);
const manualData = {
  teaching_space_id: manualSpace.id,
  title: "Séance avec lien fourni",
  body: "Une explication en direct",
  starts_at: new Date(Date.now() + 5 * 60000).toISOString(),
  ends_at: new Date(Date.now() + 65 * 60000).toISOString(),
  timezone: "Africa/Casablanca",
};
let manual = await call("save_manual_meeting", [manualData, false]);
check(
  manual.link_source === "manual" &&
    manual.status === "draft" &&
    !JSON.stringify(manual).includes("meet.google"),
  "Brouillon manuel sans lien : aucune URL dans la projection publique",
);
check(
  (await call("get_manual_meeting_link", [manual.id])) === null,
  "L’enseignant peut compléter le lien plus tard",
);
await as(manualStudent);
check(
  (await sql("select id from public.meetings where id=$1", [manual.id]))
    .length === 0,
  "Brouillon manuel invisible à l’étudiant",
);
await rejects(
  () => call("save_manual_meeting", [manualData, true]),
  /ACCESS_DENIED/,
  "L’étudiant ne peut publier aucune séance",
);
await as(manualTeacher);
await rejects(
  () =>
    call("save_manual_meeting", [
      manualData,
      true,
      manual.id,
      manual.row_version,
    ]),
  /MEET_URL_REQUIRED/,
  "Publication sans lien refusée atomiquement",
);
check(
  (
    await one("select row_version,status from public.meetings where id=$1", [
      manual.id,
    ])
  ).row_version === manual.row_version,
  "Publication refusée : version du brouillon inchangée",
);
for (const meet_url of [
  "http://meet.google.com/abc-defg-hij",
  "https://meet.google.com.evil.test/abc-defg-hij",
  "https://meet.google.com@evil.test/abc-defg-hij",
  "https://evil.test/?url=https://meet.google.com/abc-defg-hij",
  "javascript:alert(1)",
  "https://meet.google.com/lookup/abc",
  "https://meet.google.com/abc-defg-hij/extra",
]) {
  await rejects(
    () =>
      call("save_manual_meeting", [
        { ...manualData, meet_url },
        true,
        manual.id,
        manual.row_version,
      ]),
    /INVALID_MEET_URL/,
    `Lien manuel malformé ou externe refusé : ${meet_url}`,
  );
}
await as(manualOtherTeacher);
await rejects(
  () =>
    call("save_manual_meeting", [
      { ...manualData, meet_url: "https://meet.google.com/abc-defg-hij" },
      true,
      manual.id,
      manual.row_version,
    ]),
  /ACCESS_DENIED/,
  "Un autre enseignant ne peut modifier la séance",
);
await rejects(
  () => call("get_manual_meeting_link", [manual.id]),
  /ACCESS_DENIED/,
  "Un autre enseignant ne peut lire le lien privé",
);
await rejects(
  () => call("cancel_manual_meeting", [manual.id, manual.row_version]),
  /ACCESS_DENIED/,
  "Un autre enseignant ne peut annuler la séance",
);
await as(manualTeacher);
const oldManualVersion = manual.row_version;
manual = await call("save_manual_meeting", [
  {
    ...manualData,
    meet_url: "  https://meet.google.com/abc-defg-hij?authuser=0&hs=122  ",
  },
  true,
  manual.id,
  manual.row_version,
]);
check(
  manual.status === "scheduled" && manual.sync_status === "synced",
  "Publication manuelle immédiate sans connexion Google",
);
check(
  (await call("get_manual_meeting_link", [manual.id])) ===
    "https://meet.google.com/abc-defg-hij",
  "Les paramètres de compte sont retirés du lien privé",
);
await rejects(
  () =>
    call("save_manual_meeting", [
      { ...manualData, meet_url: "https://meet.google.com/xyz-abcd-efg" },
      true,
      manual.id,
      oldManualVersion,
    ]),
  /VERSION_CONFLICT/,
  "Un ancien onglet ne peut écraser le lien actuel",
);
await rejects(
  () =>
    call("queue_meeting_operation", [
      manual.id,
      "cancel",
      manual.row_version,
      "manual-legacy-cancel",
      {},
    ]),
  /MEETING_WORKFLOW_REQUIRED/,
  "Une ancienne commande Google ne peut créer de job pour une séance manuelle",
);
await root();
check(
  (
    await sql("select id from private.integration_jobs where meeting_id=$1", [
      manual.id,
    ])
  ).length === 0 &&
    (
      await sql(
        "select id from private.google_connections where teacher_id=$1",
        [manualTeacher],
      )
    ).length === 0,
  "Aucun job ni compte OAuth requis pour publier",
);
check(
  (
    await one(
      "select count(*)::int as n from public.notifications where recipient_id=$1 and target_id=$2 and type='meeting_created'",
      [manualStudent, manual.id],
    )
  ).n === 1,
  "Le groupe autorisé reçoit la notification de publication",
);
await as(manualStudent);
check(
  !JSON.stringify(
    await sql("select * from public.meetings where id=$1", [manual.id]),
  ).includes("meet.google"),
  "La liste étudiante ne divulgue pas le lien privé",
);
await rejects(
  () => sql("select * from private.manual_meeting_links"),
  /permission denied/,
  "Table des liens inaccessible directement au navigateur",
);
await rejects(
  () => call("get_manual_meeting_link", [manual.id]),
  /ACCESS_DENIED/,
  "L’étudiant ne peut contourner la fenêtre par le RPC d’édition",
);
check(
  (await call("get_meeting_join_url", [manual.id])) ===
    "https://meet.google.com/abc-defg-hij",
  "L’étudiant autorisé reçoit le lien dans la fenêtre de séance",
);
await as(manualOutsider);
await rejects(
  () => call("get_meeting_join_url", [manual.id]),
  /ACCESS_DENIED/,
  "Un étudiant sans matière ne reçoit jamais le lien manuel",
);
await as(null, "anon");
await rejects(
  () => call("get_manual_meeting_link", [manual.id]),
  /permission denied/,
  "Lecture du lien interdite sans authentification",
);
await as(manualTeacher);
manual = await call("save_manual_meeting", [
  {
    ...manualData,
    title: "Séance modifiée",
    meet_url: "https://meet.google.com/xyz-abcd-efg",
    starts_at: new Date(Date.now() + 120 * 60000).toISOString(),
    ends_at: new Date(Date.now() + 180 * 60000).toISOString(),
  },
  true,
  manual.id,
  manual.row_version,
]);
await as(manualStudent);
await rejects(
  () => call("get_meeting_join_url", [manual.id]),
  /MEETING_NOT_JOINABLE/,
  "Lien manuel retenu avant la fenêtre d’ouverture",
);
await root();
await sql(
  "update public.meetings set starts_at=now()-interval '2 hours',ends_at=now()-interval '1 hour' where id=$1",
  [manual.id],
);
await as(manualStudent);
await rejects(
  () => call("get_meeting_join_url", [manual.id]),
  /MEETING_NOT_JOINABLE/,
  "Lien manuel retenu après la fin",
);
await root();
await sql(
  "update public.meetings set starts_at=now(),ends_at=now()+interval '1 hour' where id=$1",
  [manual.id],
);
await sql(
  "update public.student_subject_access set status='revoked' where enrollment_id=$1",
  [uid(9210)],
);
await as(manualStudent);
await rejects(
  () => call("get_meeting_join_url", [manual.id]),
  /ACCESS_DENIED/,
  "Retrait d’une matière retire immédiatement l’accès au lien manuel",
);
await root();
await sql(
  "update public.student_subject_access set status='active' where enrollment_id=$1",
  [uid(9210)],
);
await sql(
  "update public.account_access set status='suspended' where user_id=$1",
  [manualTeacher],
);
await as(manualTeacher);
await rejects(
  () =>
    call("save_manual_meeting", [
      { ...manualData, meet_url: "https://meet.google.com/abc-defg-hij" },
      true,
      manual.id,
      manual.row_version,
    ]),
  /ACCESS_DENIED/,
  "Un enseignant suspendu ne peut modifier les séances",
);
await as(admin);
manual = await call("cancel_manual_meeting", [manual.id, manual.row_version]);
check(
  manual.status === "cancelled",
  "L’administration peut annuler une séance manuelle",
);
await as(manualStudent);
await rejects(
  () => call("get_meeting_join_url", [manual.id]),
  /MEETING_NOT_JOINABLE/,
  "Une séance annulée ne donne plus de lien",
);
await root();
check(
  (
    await sql(
      "select * from private.manual_meeting_links where meeting_id=$1",
      [manual.id],
    )
  ).length === 0,
  "L’annulation retire le lien privé sans appel à Google",
);
await db.close();
console.log(
  `\n${checks} vérifications PostgreSQL/RLS réussies. Aucun appel Google ou service Storage réel n’est simulé comme vérifié.`,
);
