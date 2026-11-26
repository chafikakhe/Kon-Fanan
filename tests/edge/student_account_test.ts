import { endpoint } from "../../supabase/functions/_shared/http.ts";
import { resetStudentPassword } from "../../supabase/functions/_shared/student-account.ts";

function assert(value: unknown, message: string) {
  if (!value) throw Error(message);
}
Deno.test(
  "mot de passe étudiant : admin actif, garde SQL, aucune fuite ou email",
  async () => {
    const env = {
      SUPABASE_URL: "https://student-auth.test",
      SUPABASE_ANON_KEY: "public-fixture",
      SUPABASE_SERVICE_ROLE_KEY: "service-fixture",
    };
    const previous = Object.fromEntries(
      Object.keys(env).map((k) => [k, Deno.env.get(k)]),
    );
    for (const [key, value] of Object.entries(env)) Deno.env.set(key, value);
    const fetch = globalThis.fetch;
    const adminId = "00000000-0000-4000-8000-000000000001",
      studentId = "00000000-0000-4000-8000-000000000005";
    let role = "admin",
      status = "active",
      guard = false,
      providerFailure = false,
      updates = 0;
    let sent: Record<string, unknown> = {};
    globalThis.fetch = async (input, init) => {
      const req = new Request(input, init),
        url = new URL(req.url);
      if (url.pathname === "/auth/v1/user")
        return Response.json({ id: adminId, email: "admin@example.test" });
      if (url.pathname === "/rest/v1/account_access")
        return Response.json({ role, status });
      if (url.pathname === "/rest/v1/rpc/authorize_student_password_reset") {
        assert(
          req.headers.get("apikey") === env.SUPABASE_SERVICE_ROLE_KEY,
          "Garde appelée uniquement côté serveur",
        );
        if (guard)
          return Response.json({ message: "ACCESS_DENIED" }, { status: 403 });
        const args = await req.json();
        assert(
          args.p_admin_id === adminId && args.p_student_id === studentId,
          "Cible et administrateur vérifiés",
        );
        return Response.json(true);
      }
      if (
        url.pathname === `/auth/v1/admin/users/${studentId}` &&
        req.method === "PUT"
      ) {
        updates++;
        sent = await req.json();
        assert(
          req.headers.get("apikey") === env.SUPABASE_SERVICE_ROLE_KEY,
          "Mise à jour Auth avec clé serveur",
        );
        return providerFailure
          ? Response.json(
              {
                msg: "sensitive-provider-detail",
                error_code: "unexpected_failure",
              },
              { status: 500 },
            )
          : Response.json({ id: studentId, email: "student@example.test" });
      }
      throw Error(`Unexpected request ${req.method} ${url.pathname}`);
    };
    const handler = endpoint(resetStudentPassword),
      password = " New-Student-Password-42! ";
    const request = (body: unknown = { studentId, password }, auth = true) =>
      new Request("https://edge.test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(auth ? { Authorization: "Bearer fixture" } : {}),
        },
        body: JSON.stringify(body),
      });
    try {
      let response = await handler(request());
      const result = await response.text();
      assert(
        response.status === 200 && result.includes('"updated":true'),
        "Réinitialisation réussie",
      );
      assert(
        sent.password === password && sent.email_confirm === true,
        "Mot de passe exact et compte confirmé sans envoi d’email",
      );
      assert(
        !result.includes(password) && !result.includes("service-fixture"),
        "Aucun secret dans la réponse",
      );
      const count = updates;
      response = await handler(request(undefined, false));
      assert(response.status === 401, "Visiteur refusé");
      for (const other of ["teacher", "student"]) {
        role = other;
        response = await handler(request());
        assert(response.status === 403, "Rôle non admin refusé");
      }
      role = "admin";
      status = "suspended";
      response = await handler(request());
      assert(response.status === 403, "Admin suspendu refusé");
      status = "active";
      guard = true;
      response = await handler(request());
      assert(response.status === 403, "Cible non autorisée refusée avant Auth");
      assert(updates === count, "Aucune modification Auth après refus");
      guard = false;
      response = await handler(request({ studentId, password: "short" }));
      assert(response.status === 400, "Mot de passe trop court refusé");
      response = await handler(request({ studentId: "invalid", password }));
      assert(response.status === 400, "Identifiant invalide refusé");
      providerFailure = true;
      response = await handler(request());
      assert(
        response.status === 422 &&
          !(await response.text()).includes("sensitive-provider-detail"),
        "Erreur fournisseur masquée",
      );
    } finally {
      globalThis.fetch = fetch;
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) Deno.env.delete(key);
        else Deno.env.set(key, value);
      }
    }
  },
);
