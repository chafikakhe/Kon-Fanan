import { test, expect, type Page } from "@playwright/test";
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
async function teacher(page: Page) {
  await page.goto("/connexion");
  await page.evaluate(() => sessionStorage.setItem("kf-demo-role", "teacher"));
  await page.goto(`/prof/cours/${id(110)}/exercices/nouveau`);
}
test("PDF choisi dès la création, consigne PDF seule, pièce jointe protégée et ouverte par l’étudiant autorisé", async ({
  page,
}) => {
  await teacher(page);
  await page
    .getByLabel("Titre", { exact: true })
    .fill("Exercice PDF de recette");
  await page
    .getByLabel("PDF de l’exercice", { exact: true })
    .setInputFiles("tests/fixtures/course-book.pdf");
  await expect(
    page.getByRole("button", { name: "Retirer le PDF" }),
  ).toBeVisible();
  await page.getByLabel("Publier avec le cours").check();
  await page
    .getByRole("button", { name: "Enregistrer l’exercice", exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`/prof/cours/${id(110)}$`));
  const record = await page.evaluate(() => {
    const d = JSON.parse(sessionStorage.getItem("kf-demo-v1")!);
    const exercise = d.exercises.find(
      (e: { title: string }) => e.title === "Exercice PDF de recette",
    );
    return {
      exercise,
      files: d.files.filter(
        (f: { target_type: string; target_id: string }) =>
          f.target_type === "exercise" && f.target_id === exercise.id,
      ),
    };
  });
  expect(record.exercise.status).toBe("published");
  expect(record.exercise.instructions).toContain("PDF joint");
  expect(record.files).toHaveLength(1);
  expect(record.files[0].mime_type).toBe("application/pdf");
  await page.evaluate(() => sessionStorage.setItem("kf-demo-role", "student"));
  await page.goto(`/etudiant/exercices/${record.exercise.id}`);
  await expect(
    page.getByRole("button", { name: /course-book.pdf/ }),
  ).toBeVisible();
  await page.evaluate(() => {
    const original = window.open.bind(window);
    window.open = (url, target, features) => {
      (window as Window & { openedPDF?: string }).openedPDF = String(url);
      return original(url, target, features);
    };
  });
  const popup = page.waitForEvent("popup");
  await page.getByRole("button", { name: /course-book.pdf/ }).click();
  const pdf = await popup;
  const opened = await page.evaluate(async () => {
    const url = (window as Window & { openedPDF?: string }).openedPDF || "";
    const response = await fetch(url);
    return {
      url,
      prefix: new TextDecoder().decode(
        new Uint8Array(await response.arrayBuffer()).slice(0, 5),
      ),
    };
  });
  expect(opened.url).toMatch(/^blob:/);
  expect(opened.prefix).toBe("%PDF-");
  await pdf.close();
  await page.evaluate(() => sessionStorage.removeItem("kf-demo-role"));
  await page.goto(`/decouvrir/exercices/${record.exercise.id}`);
  await expect(page).toHaveURL(/\/packs\?/);
});
test("envoi interrompu : brouillon conservé et nouvel essai sans exercice ni fichier en double", async ({
  page,
}) => {
  await teacher(page);
  await page.getByLabel("Titre", { exact: true }).fill("PDF avec reprise");
  await page
    .getByLabel("PDF de l’exercice", { exact: true })
    .setInputFiles("tests/fixtures/course-book.pdf");
  await page.getByLabel("Publier avec le cours").check();
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    let first = true;
    IDBObjectStore.prototype.put = function (
      ...args: Parameters<IDBObjectStore["put"]>
    ) {
      if (this.name === "files" && first) {
        first = false;
        throw new DOMException(
          "Envoi PDF interrompu pour la recette",
          "NetworkError",
        );
      }
      return put.apply(this, args);
    };
  });
  await page
    .getByRole("button", { name: "Enregistrer l’exercice", exact: true })
    .click();
  await expect(
    page.getByText("Envoi PDF interrompu pour la recette", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Le brouillon est conservé. Tu peux réessayer l’envoi sans créer un autre exercice.",
      { exact: true },
    ),
  ).toBeVisible();
  const pending = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("kf-demo-v1")!).exercises.filter(
      (e: { title: string }) => e.title === "PDF avec reprise",
    ),
  );
  expect(pending).toHaveLength(1);
  expect(pending[0].status).toBe("draft");
  await page
    .getByRole("button", { name: "Enregistrer l’exercice", exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`/prof/cours/${id(110)}$`));
  const result = await page.evaluate(() => {
    const d = JSON.parse(sessionStorage.getItem("kf-demo-v1")!);
    const rows = d.exercises.filter(
      (e: { title: string }) => e.title === "PDF avec reprise",
    );
    return {
      rows,
      files: d.files.filter(
        (f: { target_type: string; target_id: string }) =>
          f.target_type === "exercise" && f.target_id === rows[0].id,
      ),
    };
  });
  expect(result.rows).toHaveLength(1);
  expect(result.rows[0].id).toBe(pending[0].id);
  expect(result.rows[0].status).toBe("published");
  expect(result.files).toHaveLength(1);
});
test("formats invalides refusés, retrait du choix et formulaire mobile", async ({
  page,
}) => {
  await teacher(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByLabel("PDF de l’exercice", { exact: true })
    .setInputFiles("tests/fixtures/photo.jpg");
  await expect(
    page.getByText("Choisis un PDF non vide de 20 Mo maximum.", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByLabel("PDF de l’exercice", { exact: true })
    .setInputFiles("tests/fixtures/course-book.pdf");
  await page.getByRole("button", { name: "Retirer le PDF" }).click();
  await expect(page.getByLabel("Consigne", { exact: true })).toHaveAttribute(
    "required",
    "",
  );
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(391);
});
