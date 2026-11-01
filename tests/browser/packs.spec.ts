import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
test("découverte publique, choix exact, connexion et demande sans faux paiement", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("link", { name: "Commencer", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Quel est ton niveau ?" }),
  ).toBeVisible();
  await page.getByRole("link", { name: /3ème année collège/ }).click();
  await page.getByRole("link", { name: /Mathématiques/ }).click();
  await page.getByRole("link", { name: "Ouvrir le cours" }).first().click();
  await expect(page.locator(".lesson-body")).toContainText(/.+/);
  const exercise = page.locator(".exercise-list a").first();
  const destination = await exercise.getAttribute("href");
  await exercise.click();
  await expect(page).toHaveURL(/\/packs\?/);
  expect(
    await page.evaluate(() => sessionStorage.getItem("kf-demo-role")),
  ).toBeNull();
  await page
    .getByRole("button", { name: "Choisir Pack 2", exact: true })
    .click();
  await expect(page.getByLabel("Mathématiques", { exact: true })).toBeChecked();
  await expect(
    page.getByText("1/2 matières sélectionnées", { exact: true }),
  ).toBeVisible();
  const proceed = page.getByRole("button", {
    name: "Continuer vers l’achat",
    exact: true,
  });
  await expect(proceed).toBeDisabled();
  await page.getByLabel("Physique-chimie", { exact: true }).check();
  await expect(page.getByLabel("Français", { exact: true })).toBeDisabled();
  await expect(
    page.getByRole("heading", {
      name: "Pack 2 · 180 DH au total",
      exact: true,
    }),
  ).toBeVisible();
  await expect(proceed).toBeEnabled();
  const before = new URL(page.url());
  await proceed.click();
  await expect(page).toHaveURL(/\/connexion$/);
  await page.getByRole("link", { name: "S’inscrire", exact: true }).click();
  await expect(page.getByLabel("Classe souhaitée")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Créer mon compte" }),
  ).toBeEnabled();
  await page.getByRole("link", { name: "Se connecter", exact: true }).click();
  await page
    .locator(".demo-login")
    .getByRole("button", { name: "Étudiant" })
    .click();
  await expect(page).toHaveURL(/\/packs\?/);
  const after = new URL(page.url());
  for (const k of [
    "level",
    "subject",
    "course",
    "exercise",
    "pack",
    "subjects",
  ])
    expect(after.searchParams.get(k)).toBe(before.searchParams.get(k));
  await expect(
    page.getByLabel("Physique-chimie", { exact: true }),
  ).toBeChecked();
  await page
    .getByRole("button", { name: "Envoyer ma demande d’achat" })
    .click();
  await expect(
    page.getByText("Règlement à vérifier", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Aucun droit n’est encore activé/)).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Reprendre mon exercice" }),
  ).toHaveCount(0);
  const stored = await page.evaluate(
    () => JSON.parse(sessionStorage.getItem("kf-demo-v1")!).pack_orders,
  );
  expect(stored).toHaveLength(1);
  expect(stored[0].status).toBe("pending_review");
  expect(stored[0].total_price).toBe(180);
  expect(stored[0].subject_ids.sort()).toEqual([id(40), id(41)].sort());
  expect(destination).toContain(stored[0].exercise_id);
  await page.reload();
  await expect(
    page.getByText("Règlement à vérifier", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Actualiser le statut" }).click();
  expect(
    (
      await page.evaluate(
        () => JSON.parse(sessionStorage.getItem("kf-demo-v1")!).pack_orders,
      )
    ).length,
  ).toBe(1);
  expect(errors).toEqual([]);
});
test("packs impossibles, changement de niveau et accès direct anonyme", async ({
  page,
}) => {
  await page.goto(`/etudiant/exercices/${id(120)}`);
  await expect(page).toHaveURL(/\/packs\?/);
  await page
    .getByRole("button", { name: "Choisir Pack 1", exact: true })
    .click();
  await page.getByLabel("Mathématiques", { exact: true }).uncheck();
  await expect(
    page.getByRole("button", { name: "Continuer vers l’achat" }),
  ).toBeDisabled();
  await page.getByLabel("Français", { exact: true }).check();
  await expect(
    page.getByText(/Ce pack ne débloquera pas cet exercice/),
  ).toBeVisible();
  await page.getByLabel("Ton niveau scolaire").selectOption(id(31));
  await expect(
    page.getByRole("button", { name: "Choisir Pack 2", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Choisir Pack 3", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText("Ce niveau propose 1 matière ; ce pack en nécessite 2.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(new URL(page.url()).searchParams.has("exercise")).toBe(false);
  await page.goto(`/etudiant/seances/${id(180)}`);
  await expect(page).toHaveURL(/\/connexion$/);
});
test("catalogue et packs responsive et accessibles", async ({ page }) => {
  const routes = [
    "/decouvrir",
    `/decouvrir?level=${id(32)}`,
    `/decouvrir?level=${id(32)}&subject=${id(40)}`,
    `/decouvrir/cours/${id(110)}`,
    `/packs?level=${id(32)}&pack=pack-3&subjects=${id(40)},${id(41)},${id(42)}`,
  ];
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of routes) {
      await page.goto(path);
      await expect(page.locator("main h1")).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
        `${path} à ${width}px`,
      ).toBeLessThanOrEqual(width + 1);
    }
  }
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

test("accès historiques conservés et contrôle des achats dans l’administration", async ({
  page,
}) => {
  await page.goto("/connexion");
  await page.evaluate(() => sessionStorage.setItem("kf-demo-role", "student"));
  await page.goto(`/etudiant/exercices/${id(120)}`);
  await expect(
    page.getByRole("heading", { name: "L’énoncé", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".statement-text")).toContainText("3x + 5 = 20");
  await page.goto(`/packs?level=${id(32)}&pack=pack-1&subjects=${id(41)}`);
  await page
    .getByRole("button", { name: "Envoyer ma demande d’achat" })
    .click();
  await expect(
    page.getByText("Règlement à vérifier", { exact: true }),
  ).toBeVisible();
  await page.evaluate(() => sessionStorage.setItem("kf-demo-role", "admin"));
  await page.goto("/admin/packs");
  await expect(
    page.getByRole("heading", { name: "Packs et achats", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Physique-chimie", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Référence du règlement vérifié")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Valider le règlement et activer" }),
  ).toBeDisabled();
  await expect(
    page.getByText(
      "Validation indisponible en démonstration. Aucun achat réussi n’est simulé.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(391);
});
