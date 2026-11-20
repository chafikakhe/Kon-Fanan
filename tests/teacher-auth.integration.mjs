// Real Auth + Edge integration. Run against a disposable LOCAL Supabase stack.
// No passwords/tokens are printed or written to disk.
import { createClient } from "@supabase/supabase-js";
import { changeAccountPassword } from "../src/lib/passwords.ts";
import { randomBytes, randomUUID } from "node:crypto";
import assert from "node:assert/strict";

const url = process.env.KF_AUTH_TEST_URL || "http://127.0.0.1:54321";
const anonKey = process.env.KF_AUTH_TEST_ANON_KEY;
const serviceKey = process.env.KF_AUTH_TEST_SERVICE_ROLE_KEY;
if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname))
  throw Error("Cette recette nécessite un Supabase local jetable.");
if (!anonKey || !serviceKey)
  throw Error(
    "Renseignez KF_AUTH_TEST_ANON_KEY et KF_AUTH_TEST_SERVICE_ROLE_KEY pour le Supabase local démarré avec la migration 0007 et ses fonctions.",
  );
const client = (key = anonKey) =>
  createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
const service = client(serviceKey);
const createdIds = [];
const nonce = randomUUID();
const email = (name) => `${name}-${nonce}@example.test`;
const initial = `${randomBytes(24).toString("base64url")}Aa7!`;
const next = `${randomBytes(24).toString("base64url")}Bb8!`;
const pass = (label) => console.log(`✓ ${label}`);
async function seed(role) {
  const { data, error } = await service.auth.admin.createUser({
    email: email(role),
    password: initial,
    email_confirm: true,
    user_metadata: { display_name: `Recette ${role}` },
  });
  assert(!error && data.user, "Création de l’identité de recette");
  createdIds.push(data.user.id);
  const updated = await service
    .from("account_access")
    .update({ role, status: "active" })
    .eq("user_id", data.user.id);
  assert(!updated.error, "Activation du rôle de recette");
  const auth = client();
  const login = await auth.auth.signInWithPassword({
    email: email(role),
    password: initial,
  });
  assert(!login.error && login.data.session, "Connexion de recette");
  return { auth, session: login.data.session };
}
async function create(session, input) {
  const response = await fetch(`${url}/functions/v1/teacher-create`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify(input),
  });
  return { status: response.status, payload: await response.json() };
}
try {
  const admin = await seed("admin");
  const student = await seed("student");
  const input = {
    firstName: "Nadia",
    lastName: "Recette",
    email: email("teacher"),
    password: initial,
  };
  const added = await create(admin.session, input);
  assert.equal(added.status, 200, "Création réelle via Edge");
  const teacherId = added.payload.data.profile.id;
  createdIds.push(teacherId);
  assert.equal(
    (await admin.auth.auth.getSession()).data.session.access_token,
    admin.session.access_token,
  );
  assert(!JSON.stringify(added.payload).includes(initial));
  pass(
    "Création réelle sans changement de session admin ni mot de passe dans la réponse",
  );
  const user = await service.auth.admin.getUserById(teacherId);
  assert(user.data.user.email_confirmed_at);
  const teacher = client();
  const login = await teacher.auth.signInWithPassword({
    email: input.email,
    password: initial,
  });
  assert(!login.error && login.data.session);
  const access = await teacher
    .from("account_access")
    .select("role,status")
    .eq("user_id", teacherId)
    .single();
  assert.deepEqual(access.data, { role: "teacher", status: "active" });
  pass("Connexion immédiate du professeur sans lien d’activation");
  const duplicate = await create(admin.session, {
    ...input,
    firstName: "Ne pas modifier",
    password: next,
  });
  assert.equal(duplicate.status, 409);
  const unchanged = await admin.auth
    .from("profiles")
    .select("display_name")
    .eq("id", teacherId)
    .single();
  assert.equal(unchanged.data.display_name, "Nadia Recette");
  assert(
    !(
      await client().auth.signInWithPassword({
        email: input.email,
        password: initial,
      })
    ).error,
  );
  pass(
    "Doublon refusé sans modification du profil ni du mot de passe existants",
  );
  for (const session of [null, student.session, login.data.session]) {
    const forbidden = await create(session, {
      ...input,
      email: email(`forbidden-${randomUUID()}`),
    });
    assert([401, 403].includes(forbidden.status));
  }
  pass("Création refusée aux visiteurs, étudiants et professeurs");
  await assert.rejects(() =>
    changeAccountPassword(
      teacher.auth,
      `${initial}-wrong`,
      next,
      next,
      client().auth,
    ),
  );
  assert(
    !(
      await client().auth.signInWithPassword({
        email: input.email,
        password: initial,
      })
    ).error,
  );
  await changeAccountPassword(teacher.auth, initial, next, next, client().auth);
  assert(
    (
      await client().auth.signInWithPassword({
        email: input.email,
        password: initial,
      })
    ).error,
  );
  assert(
    !(
      await client().auth.signInWithPassword({
        email: input.email,
        password: next,
      })
    ).error,
  );
  pass(
    "Mot de passe actuel vérifié, nouveau accepté et ancien refusé par Auth réel",
  );
  const profiles = await admin.auth
    .from("profiles")
    .select("*")
    .eq("id", teacherId);
  assert(
    !JSON.stringify(profiles.data).includes(next) &&
      !JSON.stringify(profiles.data).includes(initial),
  );
  pass("Aucun mot de passe dans les données administratives");
} finally {
  for (const id of createdIds.reverse()) {
    const access = await service
      .from("account_access")
      .delete()
      .eq("user_id", id);
    const profile = await service.from("profiles").delete().eq("id", id);
    const identity = await service.auth.admin.deleteUser(id);
    assert(
      !access.error && !profile.error && !identity.error,
      "Nettoyage des identités de recette",
    );
  }
}
