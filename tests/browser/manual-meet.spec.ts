import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [1440, 390]) {
  test(`un professeur partage un lien Meet sans OAuth à ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const oauthRequests: string[] = [];
    page.on("request", (request) => {
      if (
        /google-(?:status|oauth-start)|accounts\.google\.com/.test(
          request.url(),
        )
      )
        oauthRequests.push(request.url());
    });
    await page.goto("/connexion");
    await page.evaluate(() =>
      sessionStorage.setItem("kf-demo-role", "teacher"),
    );
    await page.goto("/prof");
    await expect(
      page.getByRole("link", { name: "Connexion Google", exact: true }),
    ).toHaveCount(0);
    await page.goto("/prof/seances/nouvelle");
    await page
      .getByLabel("Titre", { exact: true })
      .fill("Révision Meet manuel");
    for (const [label, minutes] of [
      ["Début · Africa/Casablanca", 5],
      ["Fin · Africa/Casablanca", 55],
    ] as const) {
      await page.getByLabel(label, { exact: true }).fill(
        await page.evaluate(
          (minutes) =>
            new Intl.DateTimeFormat("sv-SE", {
              timeZone: "Africa/Casablanca",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hourCycle: "h23",
            })
              .format(new Date(Date.now() + minutes * 60000))
              .replace(" ", "T"),
          minutes,
        ),
      );
    }
    await page
      .getByRole("button", { name: "Publier la séance", exact: true })
      .click();
    await expect(
      page.getByText(
        "Ajoutez le lien Google Meet avant de publier la séance.",
        { exact: true },
      ),
    ).toBeVisible();
    await page
      .getByLabel("Lien Google Meet")
      .fill("https://meet.google.com.evil.test/abc-defg-hij");
    await page
      .getByRole("button", { name: "Publier la séance", exact: true })
      .click();
    await expect(
      page.getByText(
        "Collez un lien Google Meet valide, au format https://meet.google.com/abc-defg-hij.",
        { exact: true },
      ),
    ).toBeVisible();
    await page.getByLabel("Lien Google Meet").fill("");
    await page
      .getByRole("button", { name: "Enregistrer le brouillon", exact: true })
      .click();
    await page.waitForURL(/\/prof\/seances\/[a-f0-9-]+$/);
    const meetingId = page.url().split("/").at(-1)!;
    await page
      .getByRole("link", {
        name: "Compléter et publier la séance",
        exact: false,
      })
      .click();
    await expect(page.getByLabel("Lien Google Meet")).toBeEnabled();
    await page
      .getByLabel("Lien Google Meet")
      .fill("https://meet.google.com/abc-defg-hij?authuser=0");
    await page.screenshot({
      path: `/tmp/motafawiq-manual-meet-editor-${width}.png`,
      fullPage: true,
    });
    const accessibility = await new AxeBuilder({ page })
      .include("main")
      .analyze();
    expect(
      accessibility.violations.filter((v) =>
        ["critical", "serious"].includes(v.impact || ""),
      ),
    ).toEqual([]);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width + 1);
    await page
      .getByRole("button", { name: "Publier la séance", exact: true })
      .click();
    await page.waitForURL(`/prof/seances/${meetingId}`);
    await expect(
      page.getByRole("button", { name: "Ouvrir Google Meet", exact: false }),
    ).toBeEnabled();
    await page.getByRole("link", { name: "Modifier", exact: true }).click();
    await expect(page.getByLabel("Lien Google Meet")).toHaveValue(
      "https://meet.google.com/abc-defg-hij",
    );
    await page
      .getByLabel("Lien Google Meet")
      .fill("https://meet.google.com/xyz-abcd-efg");
    await page
      .getByRole("button", {
        name: "Enregistrer les modifications",
        exact: true,
      })
      .click();
    await page.waitForURL(`/prof/seances/${meetingId}`);

    await page.evaluate(() =>
      sessionStorage.setItem("kf-demo-role", "student"),
    );
    await page.goto(`/etudiant/seances/${meetingId}`);
    await expect(
      page.getByRole("heading", { name: "Révision Meet manuel", exact: true }),
    ).toBeVisible();
    await expect(page.locator('a[href*="meet.google.com"]')).toHaveCount(0);
    await page.evaluate(() => {
      window.open = ((url: string) => {
        (window as any).__joinedMeet = url;
        return null;
      }) as any;
    });
    await page
      .getByRole("button", { name: "Ouvrir Google Meet", exact: false })
      .click();
    await expect(
      page.getByRole("link", {
        name: "Ouvrir le lien si l’onglet est bloqué",
        exact: false,
      }),
    ).toHaveAttribute("href", "https://meet.google.com/xyz-abcd-efg");
    expect(await page.evaluate(() => (window as any).__joinedMeet)).toBe(
      "https://meet.google.com/xyz-abcd-efg",
    );
    await page.screenshot({
      path: `/tmp/motafawiq-manual-meet-student-${width}.png`,
      fullPage: true,
    });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width + 1);
    await page.evaluate(() =>
      sessionStorage.setItem("kf-demo-role", "teacher"),
    );
    await page.goto(`/prof/seances/${meetingId}`);
    await page
      .getByRole("button", { name: "Annuler la séance", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Confirmer l’annulation", exact: true })
      .click();
    await expect(
      page.getByText("Cette séance a été annulée.", { exact: true }),
    ).toBeVisible();
    await page.evaluate(() =>
      sessionStorage.setItem("kf-demo-role", "student"),
    );
    await page.goto(`/etudiant/seances/${meetingId}`);
    await expect(
      page.getByRole("button", { name: "Ouvrir Google Meet", exact: false }),
    ).toBeDisabled();
    await expect(page.locator('a[href*="meet.google.com"]')).toHaveCount(0);
    expect(oauthRequests).toEqual([]);
  });
}
