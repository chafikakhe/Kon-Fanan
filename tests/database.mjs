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
create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
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
await db.close();
console.log(
  `\n${checks} vérifications PostgreSQL/RLS réussies. Aucun appel Google ou service Storage réel n’est simulé comme vérifié.`,
);
