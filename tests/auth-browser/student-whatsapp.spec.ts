import { test, expect, type Page } from "@playwright/test";
import { seedDemo, demoID } from "../../src/lib/demo";

const adminId = demoID(4),
  studentId = demoID(5);
const password = "Registration-password-42!";
function session(id: string) {
  return {
    access_token: `e30.${Buffer.from(JSON.stringify({ sub: id, exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.fixture`,
    refresh_token: `refresh-${id}`,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: {
      id,
      email: id === adminId ? "admin@example.test" : "adam@example.test",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    },
  };
}
async function fixture(page: Page, mode: "signup" | "admin") {
  const data = seedDemo();
  data.profiles.find((p) => p.id === studentId)!.email = "adam@example.test";
  data.student_contacts.find(
    (c) => c.student_id === studentId,
  )!.whatsapp_number = "+212612345678";
  let signup: any, reset: any;
  const emailCalls: string[] = [];
  if (mode === "admin")
    await page.addInitScript(
      (value) =>
        localStorage.setItem("sb-auth-auth-token", JSON.stringify(value)),
      session(adminId),
    );
  await page.addInitScript(() => {
    (window as any).__credentials = "";
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text: string) => {
          (window as any).__credentials = text;
        },
      },
    });
  });
  await page.route("https://auth.kon-fanan.test/**", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    const respond = (value: unknown) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(value),
      });
    if (request.method() === "OPTIONS") return respond({});
    if (/\/auth\/v1\/(recover|resend|otp)/.test(url.pathname)) {
      emailCalls.push(url.pathname);
      return respond({});
    }
    if (url.pathname === "/auth/v1/signup") {
      signup = request.postDataJSON();
      return respond(session(studentId));
    }
    if (url.pathname === "/auth/v1/user")
      return respond(session(mode === "admin" ? adminId : studentId).user);
    if (url.pathname === "/auth/v1/logout") return respond({});
    if (url.pathname === "/rest/v1/rpc/open_classes")
      return respond([
        { id: demoID(50), name: "3ème collège A", year_label: "2026–2027" },
      ]);
    if (url.pathname === "/rest/v1/rpc/dashboard_counts") return respond({});
    if (url.pathname === "/rest/v1/rpc/admin_directory")
      return respond(data.profiles.map(({ id, email }) => ({ id, email })));
    if (url.pathname === "/rest/v1/rpc/decide_admission") {
      const input = request.postDataJSON();
      const admission = data.admission_requests.find(
        (a) => a.id === input.p_request_id,
      )!;
      admission.status = "accepted";
      data.account_access.find((a) => a.user_id === studentId)!.status =
        "active";
      return respond(admission);
    }
    if (url.pathname === "/functions/v1/student-password-reset") {
      reset = request.postDataJSON();
      return respond({ data: { updated: true, student_id: studentId } });
    }
    if (
      url.pathname === "/rest/v1/profiles" ||
      url.pathname === "/rest/v1/account_access"
    ) {
      const rows = url.pathname.endsWith("/profiles")
        ? data.profiles
        : data.account_access;
      const identity = mode === "admin" ? adminId : studentId;
      return respond(
        request.headers().accept?.includes("vnd.pgrst.object")
          ? rows.find((r: any) => (r.id || r.user_id) === identity)
          : rows,
      );
    }
    if (url.pathname.startsWith("/rest/v1/"))
      return respond((data as any)[url.pathname.split("/").pop()!] || []);
    throw Error(
      `Unexpected fixture request ${request.method()} ${url.pathname}`,
    );
  });
  return { values: () => ({ signup, reset, emailCalls }) };
}

test("inscription avec WhatsApp : compte en traitement sans email ni accès actif", async ({
  page,
}) => {
  const state = await fixture(page, "signup");
  await page.goto("/inscription");
  await page.getByLabel("Nom complet").fill("Adam Bennani");
  await page.getByLabel("Adresse email").fill("adam@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);
  await page.getByLabel("Confirmer le mot de passe").fill(password);
  await page.getByLabel("Numéro WhatsApp", { exact: true }).fill("0612345678");
  await page.getByLabel("Classe souhaitée").selectOption(demoID(50));
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Ton compte est en cours de traitement.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Numéro WhatsApp : +212612345678", { exact: true }),
  ).toBeVisible();
  expect(state.values().signup.data).toEqual({
    display_name: "Adam Bennani",
    whatsapp_number: "+212612345678",
    requested_class_id: demoID(50),
  });
  expect(state.values().signup.data.password).toBeUndefined();
  expect(state.values().emailCalls).toEqual([]);
  await expect(page.getByText("Email confirmé", { exact: true })).toHaveCount(
    0,
  );
  await page.goto("/etudiant");
  await expect(page).toHaveURL(/\/admission$/);
});

test("admin : acceptation, WhatsApp, nouveau mot de passe à affichage unique", async ({
  page,
}) => {
  const state = await fixture(page, "admin");
  await page.goto(`/admin/admissions/${demoID(100)}`);
  await expect(page.getByLabel("Numéro WhatsApp de l’étudiant")).toHaveValue(
    "+212612345678",
  );
  await expect(
    page.getByRole("button", { name: "Générer un nouveau mot de passe" }),
  ).toHaveCount(0);
  await page.getByLabel("Mathématiques", { exact: true }).check();
  await page.getByRole("button", { name: "Accepter l’inscription" }).click();
  const message = page.getByRole("link", {
    name: "Préparer le message de validation WhatsApp",
  });
  await expect(message).toHaveAttribute(
    "href",
    /^https:\/\/wa\.me\/212612345678\?text=/,
  );
  const before = await page.evaluate(() =>
    localStorage.getItem("sb-auth-auth-token"),
  );
  await page
    .getByRole("button", { name: "Générer un nouveau mot de passe" })
    .click();
  const field = page.getByLabel("Nouveau mot de passe étudiant", {
    exact: true,
  });
  await expect(field).toBeVisible();
  const generated = await field.inputValue();
  expect(generated.length).toBeGreaterThanOrEqual(12);
  expect(state.values().reset).toEqual({ studentId, password: generated });
  await page.getByRole("button", { name: "Copier les identifiants" }).click();
  expect(await page.evaluate(() => (window as any).__credentials)).toContain(
    generated,
  );
  const chat = page.getByRole("link", {
    name: "Ouvrir la conversation WhatsApp",
  });
  await expect(chat).toHaveAttribute("href", "https://wa.me/212612345678");
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(
    generated,
  );
  expect(
    await page.evaluate(() => JSON.stringify(sessionStorage)),
  ).not.toContain(generated);
  expect(
    await page.evaluate(() => localStorage.getItem("sb-auth-auth-token")),
  ).toBe(before);
  await page
    .getByRole("button", { name: "Fermer et masquer les identifiants" })
    .click();
  await expect(field).toHaveCount(0);
  await page.reload();
  await expect(field).toHaveCount(0);
});
