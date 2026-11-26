import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const level = "00000000-0000-4000-8000-000000000032";

test("Commencer et Connexion ouvrent le parcours pack, matières, compte", async ({
  page,
}) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.getByRole("link", { name: "Commencer", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Choisis ton pack", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("group", { name: "Ton niveau scolaire" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Choisir Pack 2", exact: true }),
    ).toBeEnabled();
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Navigation principale" })
      .getByRole("link", { name: "Connexion" })
      .click();
    await expect(page).toHaveURL(/\/inscription$/);
    await expect(
      page.getByRole("link", { name: "Se connecter", exact: true }),
    ).toHaveAttribute("href", "/connexion");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Choisis ton pack", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Choisir Pack 2", exact: true })
      .click();
    const levelButton = page
      .getByRole("group", { name: "Ton niveau scolaire" })
      .getByRole("button", { name: "3ème année collège", exact: true });
    await levelButton.click();
    await expect(levelButton).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("combobox", { name: "Ton niveau scolaire" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Ton récapitulatif", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Modes de paiement", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Moyens de paiement acceptés").getByRole("listitem"),
    ).toHaveText(["Cash Plus", "Wafacash", "Virement bancaire"]);
    await expect(
      page.getByText(/après réception et validation du paiement/),
    ).toBeVisible();
    await expect(page.getByText(/demander une séance d’essai/)).toBeVisible();
    await page.getByLabel("Mathématiques", { exact: true }).check();
    await expect(
      page.getByRole("button", { name: "Continuer vers l’inscription" }),
    ).toBeDisabled();
    await page.getByLabel("Physique-chimie", { exact: true }).check();
    await page
      .getByRole("button", { name: "Continuer vers l’inscription" })
      .click();
    await expect(page.getByLabel("Nom complet")).toBeVisible();
    await expect(
      page.getByLabel("Numéro WhatsApp", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Ton choix de pack et de matières"),
    ).toContainText("Pack 2");
    await expect(
      page.getByLabel("Ton choix de pack et de matières"),
    ).toContainText("Mathématiques · Physique-chimie");
    await page.reload();
    await expect(page.getByLabel("Nom complet")).toBeVisible();
    const stored = await page.evaluate(() =>
      localStorage.getItem("kf-checkout-return"),
    );
    expect(stored).toContain("pack=pack-2");
    expect(stored).toContain("subjects=");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page
      .getByRole("navigation", { name: "Étapes d’inscription" })
      .getByRole("link", { name: /Matières/ })
      .click();
    await expect(
      page.getByLabel("Mathématiques", { exact: true }),
    ).toBeChecked();
    await expect(
      page.getByLabel("Physique-chimie", { exact: true }),
    ).toBeChecked();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(result.violations).toEqual([]);
  }
});

test("le lancement respecte la préférence de réduction des animations", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/inscription");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Choisis ton pack", exact: true }),
  ).toBeVisible();
  expect(
    await page
      .locator(".enrollment-stage")
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
});
