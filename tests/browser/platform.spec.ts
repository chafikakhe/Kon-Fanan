import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
async function login(page: Page, role: "student" | "teacher" | "admin") {
  await page.goto("/connexion");
  await page.evaluate((r) => sessionStorage.setItem("kf-demo-role", r), role);
  await page.goto(
    role === "student" ? "/etudiant" : role === "teacher" ? "/prof" : "/admin",
  );
  await expect(page.locator("main h1")).toBeVisible();
}
const routes = {
  student: [
    "/etudiant",
    "/etudiant/matieres",
    `/etudiant/matieres/${id(60)}`,
    `/etudiant/cours/${id(110)}`,
    `/etudiant/exercices/${id(120)}`,
    "/etudiant/mes-travaux",
    `/etudiant/mes-travaux/${id(130)}`,
    "/etudiant/competitions",
    `/etudiant/competitions/${id(160)}`,
    "/etudiant/annonces",
    "/etudiant/seances",
    "/notifications",
    "/profil",
  ],
  teacher: [
    "/prof",
    "/prof/groupes",
    `/prof/groupes/${id(70)}`,
    "/prof/cours",
    "/prof/cours/nouveau",
    `/prof/cours/${id(110)}`,
    `/prof/cours/${id(110)}/exercices/nouveau`,
    "/prof/copies",
    `/prof/copies/${id(131)}`,
    "/prof/competitions",
    "/prof/competitions/nouvelle",
    `/prof/competitions/${id(160)}`,
    "/prof/annonces",
    "/prof/annonces/nouvelle",
    "/prof/seances",
    "/prof/seances/nouvelle",
    `/prof/seances/${id(180)}`,
    "/prof/integrations/google",
  ],
  admin: [
    "/admin",
    "/admin/admissions",
    `/admin/admissions/${id(100)}`,
    "/admin/classes",
    "/admin/classes/nouvelle",
    `/admin/classes/${id(50)}`,
    `/admin/classes/${id(50)}/modifier`,
    "/admin/etudiants",
    `/admin/etudiants/${id(1)}`,
    "/admin/professeurs",
    `/admin/professeurs/${id(2)}`,
    "/admin/referentiels",
    "/admin/contenus",
    "/admin/integrations",
    "/admin/audit",
  ],
};
test("toutes les pages restent accessibles sans débordement aux 5 largeurs demandées", async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width + 1);
    const headline = await page.locator(".hero-content h1").evaluate((el) => {
      const r = document.createRange();
      r.selectNodeContents(el);
      const b = r.getBoundingClientRect();
      return { left: b.left, right: b.right };
    });
    expect(headline.left).toBeGreaterThanOrEqual(-1);
    expect(headline.right).toBeLessThanOrEqual(width + 1);
    for (const role of ["student", "teacher", "admin"] as const) {
      await login(page, role);
      for (const route of routes[role]) {
        await page.goto(route);
        await expect(page.locator("main h1")).toBeVisible();
        await expect(
          page.getByText("Une erreur est survenue.", { exact: true }),
        ).toHaveCount(0);
        const dimensions = await page.evaluate(() => ({
          w: innerWidth,
          scroll: document.documentElement.scrollWidth,
        }));
        expect(dimensions.scroll, `${width}px ${route}`).toBeLessThanOrEqual(
          dimensions.w + 1,
        );
      }
    }
  }
  expect(errors).toEqual([]);
});
test("admission avec matière explicite, puis révocation", async ({ page }) => {
  await login(page, "admin");
  await page.goto(`/admin/admissions/${id(100)}`);
  const accept = page.getByRole("button", { name: "Accepter l’inscription" });
  await expect(accept).toBeDisabled();
  await page.getByLabel("Mathématiques", { exact: true }).check();
  await accept.click();
  await expect(page.getByText("Cette demande a été acceptée.")).toBeVisible();
  await page.goto(`/admin/etudiants/${id(5)}`);
  await expect(
    page.getByRole("heading", { name: "Adam Bennani", exact: true, level: 1 }),
  ).toBeVisible();
  await page.getByRole("checkbox", { name: /Mathématiques/ }).uncheck();
  await page.getByRole("button", { name: "Enregistrer les accès" }).click();
  await page
    .getByRole("button", { name: "Enregistrer ces modifications" })
    .click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Les accès aux matières ont été mis à jour." }),
  ).toBeVisible();
});
test("remise mobile puis correction privée et publiée", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, "student");
  await page.goto(`/etudiant/exercices/${id(120)}`);
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6XkAAAAASUVORK5CYII=",
    "base64",
  );
  await page.locator("input[type=file]").first().setInputFiles({
    name: "mon-travail.png",
    mimeType: "image/png",
    buffer: png,
  });
  await expect(
    page.getByText("mon-travail.png", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Un commentaire pour ton professeur (facultatif)")
    .fill("Voici mon raisonnement.");
  await page
    .getByRole("button", { name: "Envoyer mon travail", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Ton travail est entre de bonnes mains.",
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Voir ma copie" }).click();
  const submittedURL = page.url();
  await expect(
    page.getByRole("heading", { name: "Le retour arrive bientôt" }),
  ).not.toBeVisible();
  await page.getByRole("tab", { name: "Correction", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Le retour arrive bientôt" }),
  ).toBeVisible();
  await login(page, "teacher");
  await page.goto("/prof/copies");
  await page
    .getByRole("row")
    .filter({ hasText: "Salma El Idrissi" })
    .getByRole("link", { name: "Corriger" })
    .click();
  await page.getByRole("tab", { name: "Correction", exact: true }).click();
  await page.getByLabel("Note facultative / 20").fill("17");
  await page
    .getByLabel("Commentaire pédagogique")
    .fill("Bon raisonnement. Pense à vérifier la dernière égalité.");
  await page
    .getByRole("button", { name: "Enregistrer le brouillon", exact: true })
    .click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Le brouillon de correction a été enregistré." }),
  ).toBeVisible();
  await login(page, "student");
  await page.goto(submittedURL);
  await page.getByRole("tab", { name: "Correction", exact: true }).click();
  await expect(
    page.getByText("Bon raisonnement. Pense à vérifier la dernière égalité."),
  ).toHaveCount(0);
  await login(page, "teacher");
  await page.goto(
    submittedURL.replace("/etudiant/mes-travaux/", "/prof/copies/"),
  );
  await page.getByRole("tab", { name: "Correction", exact: true }).click();
  await page
    .getByRole("button", { name: "Publier la correction", exact: true })
    .click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "La correction a été publiée." }),
  ).toBeVisible();
  await login(page, "student");
  await page.goto(submittedURL);
  await page.getByRole("tab", { name: "Correction", exact: true }).click();
  await expect(
    page.getByText("Bon raisonnement. Pense à vérifier la dernière égalité.", {
      exact: true,
    }),
  ).toBeVisible();
});
test("isolation des routes et menu mobile", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await login(page, "student");
  await page.goto("/admin/classes");
  await expect(page).toHaveURL(/\/403$/);
  await page
    .getByRole("button", { name: "Ouvrir le menu", exact: true })
    .click();
  await expect(page.locator(".sidebar")).toHaveClass(/is-open/);
  await page
    .locator(".sidebar")
    .getByRole("link", { name: "Mes matières", exact: true })
    .click();
  await expect(page).toHaveURL(/\/etudiant\/matieres$/);
  await expect(
    page.getByRole("heading", { name: "Mathématiques", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Philosophie", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".sidebar")).not.toHaveClass(/is-open/);
});
test("contrôles accessibilité des écrans principaux", async ({ page }) => {
  test.setTimeout(90000);
  for (const path of ["/", "/connexion"]) {
    await page.goto(path);
    await page.locator("h1").waitFor();
    const report = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(
      report.violations.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => n.target),
      })),
      path,
    ).toEqual([]);
  }
  await login(page, "student");
  const report = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(
    report.violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
});
test("création de classe et publication complète cours/exercice", async ({
  page,
}) => {
  await login(page, "admin");
  await page.goto("/admin/classes/nouvelle");
  await page
    .getByLabel("Nom de la classe", { exact: true })
    .fill("Classe de recette");
  await page.getByLabel("Capacité maximale").fill("10");
  await page
    .getByRole("checkbox", { name: "Mathématiques", exact: true })
    .check();
  await page
    .getByRole("button", { name: "Créer la classe", exact: true })
    .click();
  await expect(page.locator("main h1")).toHaveText("Classe de recette");
  await login(page, "teacher");
  await page.goto("/prof/cours/nouveau");
  await page
    .getByLabel("Titre du cours", { exact: true })
    .fill("Cours de recette — équations");
  await page
    .getByLabel("Résumé", { exact: true })
    .fill("Un exemple de cours pour tester la publication.");
  await page
    .getByLabel("Contenu du cours", { exact: true })
    .fill(
      "## Une idée essentielle\n\nRésoudre une équation permet de trouver une inconnue.",
    );
  await page
    .getByLabel("Lien vidéo YouTube ou Vimeo")
    .fill("https://youtu.be/abcdefghijk");
  await page
    .getByRole("button", { name: "Enregistrer le cours", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Ajouter un exercice", exact: true })
    .click();
  await page.getByLabel("Titre", { exact: true }).fill("Exercice de recette");
  await page
    .getByLabel("Consigne", { exact: true })
    .fill("Résoudre x + 2 = 4. Justifier la réponse.");
  await page
    .getByRole("button", { name: "Enregistrer l’exercice", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publier le cours", exact: true })
    .click();
  await expect(page).toHaveURL(/\/prof\/cours$/);
  await login(page, "student");
  await page.goto(`/etudiant/matieres/${id(60)}`);
  await expect(
    page.getByRole("heading", {
      name: "Cours de recette — équations",
      exact: true,
    }),
  ).toBeVisible();
});
test("envoi interrompu : fichiers validés conservés, retrait et reprise possibles", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (
      value: unknown,
      key?: IDBValidKey,
    ) {
      if (value instanceof File && value.name === "interrompu.png")
        throw new Error("Stockage interrompu pendant le test.");
      return original.call(this, value, key!);
    };
  });
  await login(page, "student");
  await page.goto(`/etudiant/exercices/${id(120)}`);
  const buffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6XkAAAAASUVORK5CYII=",
    "base64",
  );
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles([
      { name: "valide.png", mimeType: "image/png", buffer },
      { name: "interrompu.png", mimeType: "image/png", buffer },
    ]);
  await page
    .getByRole("button", { name: "Envoyer mon travail", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Stockage interrompu");
  await expect(
    page.getByText("Ton travail est entre de bonnes mains."),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Retirer valide.png", exact: true })
    .click();
  await expect(page.getByText("valide.png", { exact: true })).toHaveCount(0);
  await page
    .getByRole("button", { name: "Retirer interrompu.png", exact: true })
    .click();
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({
      name: "nouvelle-copie.png",
      mimeType: "image/png",
      buffer,
    });
  await page
    .getByRole("button", { name: "Envoyer mon travail", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Ton travail est entre de bonnes mains.",
    }),
  ).toBeVisible();
});
