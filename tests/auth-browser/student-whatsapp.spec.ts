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
  let signup: any, reset: any, order: any;
  const emailCalls: string[] = [];
  if (mode === "admin")
    await page.addInitScript((value) => {
      if (!localStorage.getItem("fixture-auth-initialized")) {
        localStorage.setItem("sb-auth-auth-token", JSON.stringify(value));
        localStorage.setItem("fixture-auth-initialized", "true");
      }
    }, session(adminId));
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
    if (url.pathname === "/rest/v1/rpc/discovery_catalog") {
      const args = request.postDataJSON();
      const classIds = data.classes
        .filter((c) => c.level_id === args.p_level_id)
        .map((c) => c.id);
      const subjectIds = data.class_subjects
        .filter((s) => classIds.includes(s.class_id))
        .map((s) => s.subject_id);
      return respond({
        levels: data.levels,
        subjects: data.subjects.filter((s) => subjectIds.includes(s.id)),
        packs: data.pack_offers,
        level_id: args.p_level_id,
        subject_id: null,
        courses: [],
        exercises: [],
        has_more: false,
      });
    }
    if (url.pathname === "/rest/v1/rpc/request_pack_order") {
      order = request.postDataJSON();
      const offer = data.pack_offers.find((p) => p.id === order.p_pack_id)!;
      const row = {
        id: demoID(990),
        student_id: studentId,
        pack_id: offer.id,
        pack_name: offer.name,
        subject_count: offer.subject_count,
        total_price: offer.total_price,
        currency: "MAD",
        level_id: order.p_level_id,
        subject_ids: order.p_subject_ids,
        status: "pending_review",
        created_at: new Date().toISOString(),
      };
      data.pack_orders.push(row as any);
      return respond(row);
    }
    if (url.pathname === "/rest/v1/rpc/review_pack_order") {
      const input = request.postDataJSON();
      const row = data.pack_orders.find(
        (order) => order.id === input.p_order_id,
      )!;
      row.status = input.p_decision;
      row.reviewed_at = new Date().toISOString();
      row.payment_reference = input.p_payment_reference;
      if (input.p_decision === "active")
        data.account_access.find(
          (account) => account.user_id === row.student_id,
        )!.status = "active";
      return respond(row);
    }
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
  return { data, values: () => ({ signup, reset, order, emailCalls }) };
}

test("inscription avec WhatsApp : compte en traitement sans email ni accès actif", async ({
  page,
}) => {
  const state = await fixture(page, "signup");
  await page.goto("/inscription");
  await expect(page.getByLabel("Nom complet")).toHaveCount(0);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Choisis ton pack", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Choisir Pack 2", exact: true })
    .click();
  await page
    .getByRole("group", { name: "Ton niveau scolaire" })
    .getByRole("button", { name: "3ème année collège", exact: true })
    .click();
  await page.getByLabel("Mathématiques", { exact: true }).check();
  await page.getByLabel("Physique-chimie", { exact: true }).check();
  await page
    .getByRole("button", { name: "Continuer vers l’inscription" })
    .click();
  await expect(page.getByLabel("Classe souhaitée")).toHaveCount(0);
  await page.getByLabel("Nom complet").fill("Adam Bennani");
  await page.getByLabel("Adresse email").fill("adam@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);
  await page.getByLabel("Confirmer le mot de passe").fill(password);
  await page.getByLabel("Numéro WhatsApp", { exact: true }).fill("0612345678");
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
  });
  expect(state.values().signup.data.password).toBeUndefined();
  expect(state.values().emailCalls).toEqual([]);
  expect(state.values().order.p_pack_id).toBe("pack-2");
  expect(state.values().order.p_level_id).toBe(demoID(32));
  expect(state.values().order.p_subject_ids).toEqual([demoID(40), demoID(41)]);
  await expect(
    page.getByText("Pack et matières sélectionnés", { exact: true }),
  ).toBeVisible();
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

test("un admin peut continuer l’inscription étudiante sans perdre la sélection", async ({
  page,
}) => {
  const state = await fixture(page, "admin");
  const logoutScopes: (string | null)[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname === "/auth/v1/logout")
      logoutScopes.push(url.searchParams.get("scope"));
  });
  await page.goto(
    `/packs?level=${demoID(32)}&pack=pack-1&subjects=${demoID(40)}`,
  );
  const action = page.getByRole("button", {
    name: "Continuer vers l’inscription",
    exact: true,
  });
  await expect(action).toBeEnabled();
  const before = await page.evaluate(() =>
    localStorage.getItem("sb-auth-auth-token"),
  );
  await action.click();
  await expect(
    page.getByRole("dialog", { name: "Continuer avec un compte étudiant" }),
  ).toBeVisible();
  expect(logoutScopes).toEqual([]);
  expect(
    await page.evaluate(() => localStorage.getItem("sb-auth-auth-token")),
  ).toBe(before);
  await page
    .getByRole("button", { name: "Créer un compte étudiant", exact: true })
    .click();
  await expect(page).toHaveURL(/\/inscription\?etape=compte$/);
  await expect(page.getByLabel("Nom complet")).toBeVisible();
  await expect(
    page.getByLabel("Numéro WhatsApp", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Ton choix de pack et de matières"),
  ).toContainText("Mathématiques");
  expect(logoutScopes).toEqual(["local"]);
  expect(
    await page.evaluate(() => localStorage.getItem("sb-auth-auth-token")),
  ).toBeNull();
  expect(state.values().order).toBeUndefined();
  expect(state.values().signup).toBeUndefined();
  await page.reload();
  await expect(page.getByLabel("Nom complet")).toBeVisible();
});

test("une inscription par pack apparaît dans Admissions sans demande de classe", async ({
  page,
}) => {
  const state = await fixture(page, "admin");
  const data = state.data;
  await page.emulateMedia({ reducedMotion: "reduce" });
  data.admission_requests = [];
  data.profiles.find((profile) => profile.id === studentId)!.display_name =
    "smail";
  const packOrder = {
    id: demoID(995),
    student_id: studentId,
    pack_id: "pack-1",
    pack_name: "Pack 1",
    subject_count: 1,
    total_price: 100,
    currency: "MAD",
    level_id: demoID(32),
    subject_ids: [demoID(40)],
    status: "pending_review",
    course_id: null,
    exercise_id: null,
    idempotency_key: "admission-fixture",
    reviewed_at: null,
    reviewed_by: null,
    payment_reference: null,
    created_at: new Date().toISOString(),
  } as any;
  data.pack_orders.push(packOrder);
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Vue d’ensemble", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Admissions/ }).locator(".nav-count"),
  ).toHaveText("2");
  await expect(
    page.locator(".panel").filter({
      has: page.getByRole("heading", {
        name: "Demandes récentes",
        exact: true,
      }),
    }),
  ).toContainText("smail");
  await page.goto("/admin/admissions");
  await page.getByPlaceholder("Rechercher un étudiant…").fill("smail");
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const row = page.getByRole("row").filter({ hasText: "smail" });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText("Pack 1 · 100 DH");
    await expect(
      row.getByRole("link", { name: "Vérifier le règlement", exact: true }),
    ).toHaveAttribute("href", `/admin/packs?order=${packOrder.id}`);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width + 1);
    await page.screenshot({
      path: `/tmp/motafawiq-admission-packs-${width}.png`,
      fullPage: true,
    });
  }
  expect(data.admission_requests).toHaveLength(0);
  expect(
    data.account_access.find((account) => account.user_id === studentId)!
      .status,
  ).toBe("pending");
  await page
    .getByRole("link", { name: "Vérifier le règlement", exact: true })
    .click();
  await expect(page).toHaveURL(
    new RegExp(`/admin/packs\\?order=${packOrder.id}$`),
  );
  await expect(page.getByRole("heading", { name: /smail/ })).toBeVisible();
  await expect(page.getByText("Mathématiques", { exact: true })).toBeVisible();
  await page
    .getByRole("link", {
      name: "Voir le dossier et le contact WhatsApp",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "smail", exact: true, level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Numéro WhatsApp de l’étudiant", { exact: true }),
  ).toHaveValue("+212612345678");
  await page
    .getByRole("link", { name: "Vérifier le règlement", exact: true })
    .click();
  await page.getByLabel("Référence du règlement vérifié").fill("RECU-TEST-100");
  await page
    .getByRole("checkbox", { name: /J’ai vérifié le règlement de 100 DH/ })
    .check();
  await page
    .getByRole("button", {
      name: "Valider le règlement et activer",
      exact: true,
    })
    .click();
  await expect(page.locator(".badge.active")).toBeVisible();
  expect(
    data.account_access.find((account) => account.user_id === studentId)!
      .status,
  ).toBe("active");
  await page.goto("/admin/admissions");
  await page.getByPlaceholder("Rechercher un étudiant…").fill("smail");
  await expect(page.getByRole("row").filter({ hasText: "smail" })).toHaveCount(
    0,
  );
  await page.getByRole("tab", { name: "Acceptées", exact: true }).click();
  await expect(
    page.getByRole("row").filter({ hasText: "smail" }),
  ).toContainText("Pack 1");
  expect(data.admission_requests).toHaveLength(0);
});
