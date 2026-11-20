import { test, expect, type Page } from "@playwright/test";

// Browser contract tests use an isolated HTTP fixture, never the linked project.
const adminId = "00000000-0000-4000-8000-000000000001";
const teacherId = "00000000-0000-4000-8000-000000000002";
const initialPassword = "Initial-password-42!";
const nextPassword = "Next-password-84!";
function authUser(id: string) {
  return {
    id,
    email: id === adminId ? "admin@example.test" : "nadia@example.test",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
  };
}
function session(id: string) {
  return {
    access_token: `e30.${Buffer.from(JSON.stringify({ sub: id, exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.fixture`,
    refresh_token: `refresh-${id}`,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: authUser(id),
  };
}
async function fixture(page: Page) {
  let created = false,
    password = initialPassword,
    createCalls = 0,
    passwordUpdates = 0;
  let requestPassword = "";
  await page.addInitScript((value) => {
    if (!localStorage.getItem("fixture-initialized")) {
      localStorage.setItem("sb-auth-auth-token", JSON.stringify(value));
      localStorage.setItem("fixture-initialized", "true");
    }
    (window as any).__copiedCredentials = "";
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text: string) => {
          (window as any).__copiedCredentials = text;
        },
      },
    });
  }, session(adminId));
  await page.route("https://auth.kon-fanan.test/**", async (route) => {
    const req = route.request(),
      url = new URL(req.url());
    const respond = (data: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        headers: { "x-supabase-api-version": "2024-01-01" },
        body: JSON.stringify(data),
      });
    // Decode only the synthetic fixture JWT to scope provider responses.
    const token = req.headers().authorization?.split(" ")[1];
    let identity = adminId;
    try {
      identity = JSON.parse(
        Buffer.from(token!.split(".")[1], "base64url").toString(),
      ).sub;
    } catch {}
    if (req.method() === "OPTIONS") return respond({});
    if (url.pathname === "/auth/v1/token") {
      const input = req.postDataJSON();
      if (
        input.email === "nadia@example.test" &&
        created &&
        input.password === password
      )
        return respond(session(teacherId));
      return respond(
        { error_code: "invalid_credentials", msg: "Invalid login credentials" },
        400,
      );
    }
    if (url.pathname === "/auth/v1/logout") return respond({});
    if (url.pathname === "/functions/v1/google-status")
      return respond({ data: { state: "disconnected" } });
    if (url.pathname === "/auth/v1/user") {
      if (req.method() === "PUT") {
        passwordUpdates++;
        const input = req.postDataJSON();
        if (input.current_password !== password)
          return respond(
            {
              code: "current_password_invalid",
              msg: "Current password invalid",
            },
            400,
          );
        password = input.password;
      }
      return respond(authUser(identity));
    }
    if (url.pathname === "/functions/v1/teacher-create") {
      createCalls++;
      const input = req.postDataJSON();
      requestPassword = input.password;
      if (created)
        return respond(
          {
            error: {
              message:
                "Cette adresse email est déjà utilisée. Aucun compte existant n’a été modifié.",
            },
          },
          409,
        );
      created = true;
      password = input.password;
      return respond({
        data: {
          profile: {
            id: teacherId,
            display_name: "Nadia Benali",
            first_name: "Nadia",
            last_name: "Benali",
            email: "nadia@example.test",
            preferred_language: "fr",
          },
          account: { user_id: teacherId, role: "teacher", status: "active" },
        },
      });
    }
    if (url.pathname === "/rest/v1/rpc/dashboard_counts") return respond({});
    if (url.pathname === "/rest/v1/rpc/admin_directory")
      return respond([
        { id: adminId, email: "admin@example.test" },
        ...(created ? [{ id: teacherId, email: "nadia@example.test" }] : []),
      ]);
    if (url.pathname === "/rest/v1/profiles") {
      const rows = [
        {
          id: adminId,
          display_name: "Administration",
          preferred_language: "fr",
        },
        ...(created
          ? [
              {
                id: teacherId,
                display_name: "Nadia Benali",
                preferred_language: "fr",
              },
            ]
          : []),
      ];
      return respond(
        req.headers().accept?.includes("vnd.pgrst.object")
          ? rows.find((p) => p.id === identity)
          : rows,
      );
    }
    if (url.pathname === "/rest/v1/account_access") {
      const rows = [
        { user_id: adminId, role: "admin", status: "active" },
        ...(created
          ? [{ user_id: teacherId, role: "teacher", status: "active" }]
          : []),
      ];
      return respond(
        req.headers().accept?.includes("vnd.pgrst.object")
          ? rows.find((a) => a.user_id === identity)
          : rows,
      );
    }
    if (url.pathname.startsWith("/rest/v1/")) return respond([]);
    throw Error(`Unexpected fixture route ${req.method()} ${url.pathname}`);
  });
  return { calls: () => ({ createCalls, passwordUpdates, requestPassword }) };
}

test("création, copie unique, session admin préservée, doublon et sécurité professeur", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto("/admin/professeurs");
  const adminSession = await page.evaluate(() =>
    localStorage.getItem("sb-auth-auth-token"),
  );
  await page
    .getByRole("button", { name: "Ajouter un professeur", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nom", { exact: true }).fill("Benali");
  await dialog.getByLabel("Prénom", { exact: true }).fill("Nadia");
  await dialog
    .getByLabel("Adresse email professionnelle")
    .fill("nadia@example.test");
  await dialog
    .getByRole("button", { name: "Générer un mot de passe sécurisé" })
    .click();
  const input = dialog.getByLabel("Mot de passe initial", { exact: true });
  expect(await input.inputValue()).toHaveLength(20);
  await expect(input).toHaveAttribute("type", "password");
  await dialog
    .getByRole("button", { name: "Afficher : mot de passe initial" })
    .click();
  await expect(input).toHaveAttribute("type", "text");
  await input.fill(initialPassword);
  await dialog
    .getByRole("button", { name: "Créer le compte professeur" })
    .click();
  await expect(
    dialog.getByText(/Le compte est créé et utilisable immédiatement/),
  ).toBeVisible();
  await expect(
    page.getByRole("row").filter({ hasText: "Nadia Benali" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("sb-auth-auth-token")),
  ).toBe(adminSession);
  await dialog.getByRole("button", { name: "Copier les identifiants" }).click();
  expect(
    await page.evaluate(() => (window as any).__copiedCredentials),
  ).toContain(initialPassword);
  await dialog
    .getByRole("button", { name: "Fermer", exact: true })
    .last()
    .click();
  await page
    .getByRole("button", { name: "Ajouter un professeur", exact: true })
    .click();
  await expect(
    dialog.getByLabel("Mot de passe initial", { exact: true }),
  ).toHaveValue("");
  await dialog.getByLabel("Nom", { exact: true }).fill("Benali");
  await dialog.getByLabel("Prénom", { exact: true }).fill("Nadia");
  await dialog
    .getByLabel("Adresse email professionnelle")
    .fill("nadia@example.test");
  await dialog
    .getByLabel("Mot de passe initial", { exact: true })
    .fill("Duplicate-password-42!");
  await dialog
    .getByRole("button", { name: "Créer le compte professeur" })
    .click();
  await expect(dialog.getByRole("alert")).toContainText("déjà utilisée");
  expect(state.calls().createCalls).toBe(2);
  await dialog.getByRole("button", { name: "Annuler" }).click();
  await page.evaluate(() => {
    localStorage.removeItem("sb-auth-auth-token");
    sessionStorage.clear();
  });
  await page.goto("/connexion");
  await page
    .getByLabel("Adresse email", { exact: true })
    .fill("nadia@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill(initialPassword);
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(page).toHaveURL(/\/prof$/);
  await page.goto("/profil");
  await page.getByRole("tab", { name: "Sécurité" }).click();
  const fillPasswords = async (
    current: string,
    confirmation = nextPassword,
  ) => {
    await page.getByLabel("Mot de passe actuel", { exact: true }).fill(current);
    await page
      .getByLabel("Nouveau mot de passe", { exact: true })
      .fill(nextPassword);
    await page
      .getByLabel("Confirmer le nouveau mot de passe", { exact: true })
      .fill(confirmation);
    await page
      .getByRole("button", { name: "Modifier le mot de passe", exact: true })
      .click();
  };
  await fillPasswords(initialPassword, "Different-password-42!");
  await expect(page.getByRole("alert")).toContainText("ne correspondent pas");
  expect(state.calls().passwordUpdates).toBe(0);
  await fillPasswords("Wrong-password-42!");
  await expect(page.getByRole("alert")).toContainText("actuel est incorrect");
  await fillPasswords(initialPassword);
  await expect(
    page.getByText(/Votre mot de passe a été modifié/),
  ).toBeVisible();
  for (const label of [
    "Mot de passe actuel",
    "Nouveau mot de passe",
    "Confirmer le nouveau mot de passe",
  ])
    await expect(page.getByLabel(label, { exact: true })).toHaveValue("");
  const stored = await page.evaluate(() =>
    JSON.stringify({
      local: { ...localStorage },
      session: { ...sessionStorage },
    }),
  );
  expect(stored).not.toContain(initialPassword);
  expect(stored).not.toContain(nextPassword);
  await page
    .getByRole("button", { name: "Se déconnecter", exact: true })
    .last()
    .click();
  await page.goto("/connexion");
  await page
    .getByLabel("Adresse email", { exact: true })
    .fill("nadia@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill(initialPassword);
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByLabel("Mot de passe", { exact: true }).fill(nextPassword);
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(page).toHaveURL(/\/prof$/);
});
