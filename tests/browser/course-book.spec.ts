import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
test("vidéo visible et PDF sous forme de livre, navigation, zoom, mobile et accès étudiant", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("https://www.youtube-nocookie.com/**", (r) =>
    r.fulfill({
      contentType: "text/html",
      body: '<html lang="fr"><title>Lecteur vidéo de test</title><body>Vidéo de cours</body></html>',
    }),
  );
  await page.goto("/connexion");
  await page.evaluate(() => sessionStorage.setItem("kf-demo-role", "teacher"));
  await page.goto(`/prof/cours/${id(110)}`);
  const documents = page
    .locator("section")
    .filter({
      has: page.getByRole("heading", {
        name: "Documents de cours",
        exact: true,
      }),
    });
  await documents
    .locator("input[type=file]")
    .setInputFiles("tests/fixtures/course-book.pdf");
  await expect(
    page.getByText("course-book.pdf", { exact: true }),
  ).toBeVisible();
  await page.evaluate((courseId) => {
    const source = JSON.parse(sessionStorage.getItem("kf-demo-v1")!);
    const course = source.courses.find(
      (c: { id: string }) => c.id === courseId,
    );
    course.video_provider = "youtube";
    course.video_id = "abcdefghijk";
    sessionStorage.setItem("kf-demo-v1", JSON.stringify(source));
    sessionStorage.removeItem("kf-demo-role");
  }, id(110));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`/decouvrir/cours/${id(110)}`);
  const video = page.getByTitle("Vidéo : Résoudre une équation");
  await expect(page.locator(".course-video iframe")).toHaveAttribute(
    "src",
    /youtube-nocookie.com\/embed\/abcdefghijk/,
  );
  await expect(
    page.getByRole("button", { name: "Lire la vidéo du cours" }),
  ).toHaveCount(0);
  await expect(page.locator("canvas[data-rendered=true]")).toHaveCount(2);
  const positions = await page.evaluate(() => ({
    video: document.querySelector(".course-video")!.getBoundingClientRect()
      .bottom,
    book: document.querySelector(".course-book-panel")!.getBoundingClientRect()
      .top,
  }));
  expect(positions.book).toBeGreaterThan(positions.video);
  await expect(page.getByLabel("Aller à la page")).toHaveValue("1");
  await page.getByRole("button", { name: "Suivant", exact: true }).click();
  await expect(page.getByLabel("Aller à la page")).toHaveValue("3");
  await expect(
    page.locator('canvas[aria-label="Page 3 du PDF"][data-rendered=true]'),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Agrandir le zoom", exact: true })
    .click();
  await expect(page.locator(".book-zoom")).toHaveText("125 %");
  await page.getByLabel("Aller à la page").selectOption("4");
  await page
    .getByRole("button", { name: "Agrandir le livre", exact: true })
    .click();
  await expect(page.getByRole("dialog", { name: /Livre/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".book-spread")).toHaveClass(/one-page/);
  await expect(page.locator("canvas[data-rendered=true]")).toHaveCount(1);
  await expect(page.getByLabel("Aller à la page")).toHaveValue("4");
  await page.getByRole("button", { name: "Précédent", exact: true }).click();
  await expect(page.getByLabel("Aller à la page")).toHaveValue("3");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(391);
  await page.locator(".book-scroll").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByLabel("Aller à la page")).toHaveValue("2");
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(axe.violations).toEqual([]);
  await page.evaluate(() => sessionStorage.setItem("kf-demo-role", "student"));
  await page.goto(`/etudiant/cours/${id(110)}`);
  await expect(page.locator(".course-video iframe")).toBeVisible();
  await expect(page.locator("canvas[data-rendered=true]")).toHaveCount(1);
  expect(errors).toEqual([]);
});
