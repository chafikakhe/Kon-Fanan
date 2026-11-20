import { endpoint } from "../../supabase/functions/_shared/http.ts";
import { createTeacher } from "../../supabase/functions/_shared/teacher-account.ts";

function assert(condition: unknown, message: string) {
  if (!condition) throw Error(message);
}

Deno.test(
  "création professeur : contrôle serveur, Auth Admin, doublon et absence de fuite",
  async () => {
    const env = {
      SUPABASE_URL: "https://auth.konfanan.test",
      SUPABASE_ANON_KEY: "public-fixture",
      SUPABASE_SERVICE_ROLE_KEY: "server-fixture",
    };
    const previous = Object.fromEntries(
      Object.keys(env).map((key) => [key, Deno.env.get(key)]),
    );
    for (const [key, value] of Object.entries(env)) Deno.env.set(key, value);
    const original = globalThis.fetch;
    const requests: Request[] = [];
    const adminId = "00000000-0000-4000-8000-000000000001";
    const teacherId = "00000000-0000-4000-8000-000000000002";
    let role = "admin",
      status = "active",
      failure = "";
    let submitted: Record<string, unknown> | undefined;
    globalThis.fetch = async (input, init) => {
      const req = new Request(input, init);
      requests.push(req);
      const url = new URL(req.url);
      if (url.pathname === "/auth/v1/user")
        return Response.json({ id: adminId, email: "admin@example.test" });
      if (url.pathname === "/rest/v1/account_access")
        return Response.json({ role, status });
      if (url.pathname === "/rest/v1/rpc/authorize_teacher_creation") {
        assert(
          req.headers.get("apikey") === env.SUPABASE_SERVICE_ROLE_KEY,
          "Garde de migration appelée côté serveur",
        );
        return failure === "migration"
          ? Response.json({ message: "missing RPC" }, { status: 404 })
          : Response.json(true);
      }
      if (url.pathname === "/auth/v1/admin/users" && req.method === "POST") {
        assert(
          req.headers.get("apikey") === env.SUPABASE_SERVICE_ROLE_KEY,
          "Clé privilégiée serveur",
        );
        submitted = await req.json();
        if (failure)
          return Response.json(
            { error_code: failure, msg: "sensitive-provider-detail" },
            { status: failure === "unexpected_failure" ? 500 : 422 },
          );
        return Response.json({ id: teacherId, email: "nadia@example.test" });
      }
      throw Error(`Unexpected Auth request: ${req.method} ${url.pathname}`);
    };
    const password = " Initial-Password-42! ";
    const input = {
      firstName: "Nadia",
      lastName: "Benali",
      email: " NADIA@example.test ",
      password,
    };
    const handler = endpoint(createTeacher);
    const request = (payload: unknown = input, authorization = true) =>
      new Request("https://edge.konfanan.test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authorization ? { Authorization: "Bearer session-fixture" } : {}),
        },
        body: JSON.stringify(payload),
      });
    try {
      const response = await handler(request());
      const payload = await response.json();
      assert(
        response.status === 200 &&
          payload.data.account.role === "teacher" &&
          payload.data.account.status === "active",
        "Succès avec profil professeur actif",
      );
      assert(
        submitted?.password === password &&
          submitted?.email_confirm === true &&
          submitted?.email === "nadia@example.test",
        "Mot de passe conservé exactement, email confirmé sans invitation",
      );
      assert(
        (
          submitted?.app_metadata as {
            kon_fanan_teacher: { created_by: string };
          }
        ).kon_fanan_teacher.created_by === adminId,
        "Créateur issu de la session vérifiée",
      );
      assert(
        !JSON.stringify(submitted?.user_metadata).includes(password),
        "Aucun mot de passe dans les métadonnées",
      );
      assert(
        !JSON.stringify(payload).includes(password) &&
          !JSON.stringify(payload).includes("server-fixture"),
        "Aucun secret dans la réponse",
      );
      assert(
        !requests.some((r) => /invite|token|recover/.test(r.url)),
        "Aucune invitation, connexion ou récupération envoyée",
      );

      for (const access of [
        { role: "teacher", status: "active" },
        { role: "student", status: "active" },
        { role: "admin", status: "suspended" },
      ]) {
        role = access.role;
        status = access.status;
        requests.length = 0;
        const rejected = await handler(request());
        assert(
          rejected.status === 403,
          "Création refusée sans accès administrateur actif",
        );
        await rejected.json();
        assert(
          !requests.some((r) => r.url.includes("/admin/")),
          "Auth Admin jamais appelé pour un compte interdit",
        );
      }
      role = "admin";
      status = "active";
      requests.length = 0;
      const anonymous = await handler(request(input, false));
      assert(
        anonymous.status === 401 && requests.length === 0,
        "Visiteur refusé avant tout appel fournisseur",
      );
      await anonymous.json();
      for (const invalid of [
        { ...input, password: "short" },
        { ...input, email: "invalid" },
        { ...input, firstName: "" },
        { ...input, password: "a".repeat(129) },
      ]) {
        requests.length = 0;
        const rejected = await handler(request(invalid));
        assert(
          rejected.status === 400 &&
            !requests.some((r) => r.url.includes("/admin/")),
          "Saisie invalide refusée avant la création Auth",
        );
        await rejected.json();
      }
      for (const code of [
        "email_exists",
        "user_already_exists",
        "weak_password",
        "unexpected_failure",
        "migration",
      ]) {
        failure = code;
        requests.length = 0;
        const rejected = await handler(request());
        const error = await rejected.json();
        assert(
          rejected.status === (code.includes("exists") ? 409 : 422),
          "Erreur fournisseur normalisée",
        );
        assert(
          !JSON.stringify(error).includes("sensitive-provider-detail"),
          "Détails fournisseur masqués",
        );
        assert(
          !requests.some((r) => ["PUT", "PATCH", "DELETE"].includes(r.method)),
          "Aucun compte existant modifié ou supprimé",
        );
        if (code === "migration")
          assert(
            !requests.some((r) => r.url.includes("/admin/")),
            "Migration absente : création Auth bloquée",
          );
      }
    } finally {
      globalThis.fetch = original;
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) Deno.env.delete(key);
        else Deno.env.set(key, value);
      }
    }
  },
);
