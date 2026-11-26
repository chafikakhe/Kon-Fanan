import { test, expect } from "@playwright/test";

test("le hero lit uniquement la vidéo optimisée, sans déplacer le contenu", async ({
  page,
}) => {
  const videos: string[] = [];
  page.on("request", (request) => {
    if (/\.mp4(?:\?|$)/.test(request.url()))
      videos.push(new URL(request.url()).pathname);
  });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    await page.goto("/");
    const video = page.locator(".hero-media video");
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.readyState))
      .toBeGreaterThanOrEqual(2);
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused))
      .toBe(false);
    await page.evaluate(() => document.fonts.ready);
    const dimensions = () =>
      page.locator(".landing-hero").evaluate((element: HTMLElement) => ({
        width: element.offsetWidth,
        height: element.offsetHeight,
        top: element.offsetTop,
      }));
    const before = await dimensions();
    const media = await video.evaluate((v: HTMLVideoElement) => ({
      muted: v.muted,
      autoplay: v.autoplay,
      loop: v.loop,
      inline: v.playsInline,
      fit: getComputedStyle(v).objectFit,
      width: v.videoWidth,
      height: v.videoHeight,
    }));
    expect(media).toEqual({
      muted: true,
      autoplay: true,
      loop: true,
      inline: true,
      fit: "cover",
      width: 1280,
      height: 720,
    });
    await expect(
      page.getByRole("button", { name: /vidéo d’accueil/ }),
    ).toHaveCount(0);
    // Seeking through the reveal must not move or resize the hero content.
    for (const time of [4.25, 5.5, 7.5]) {
      await video.evaluate(async (v: HTMLVideoElement, t) => {
        const seeked = new Promise<void>((resolve) =>
          v.addEventListener("seeked", () => resolve(), { once: true }),
        );
        v.currentTime = t;
        await seeked;
      }, time);
      expect(await dimensions()).toEqual(before);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    // Playback must wrap from the end back to the start automatically.
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime))
      .toBeLessThan(1);
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused))
      .toBe(false);
    const background = page.locator(".hero-media");
    const frame = await background.boundingBox();
    expect(frame).toEqual({ x: 0, y: 0, width, height: 950 });
    expect(
      await page.locator(".landing-hero").evaluate((e) => e.clientHeight),
    ).toBeGreaterThanOrEqual(950);
    await page.evaluate(() => window.scrollTo(0, 1100));
    expect(await background.boundingBox()).toEqual(frame);
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused))
      .toBe(false);
    expect(
      await page
        .locator(".hero-shade")
        .evaluate((e) => getComputedStyle(e).backgroundColor),
    ).toBe("rgba(255, 255, 255, 0.65)");
    await page.evaluate(() => window.scrollTo(0, 0));
    await page
      .getByRole("navigation", { name: "Choisis ton niveau" })
      .getByRole("link", { name: "3ème année collège" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Choisis ta matière" }),
    ).toBeVisible();
  }
  expect(videos.length).toBeGreaterThan(0);
  expect([...new Set(videos)]).toEqual(["/branding/hero-graduation.mp4"]);
});

for (const preference of [
  "reduced-motion",
  "save-data",
  "reduced-data",
] as const) {
  test(`aucun téléchargement vidéo avec ${preference}`, async ({ page }) => {
    if (preference === "reduced-motion")
      await page.emulateMedia({ reducedMotion: "reduce" });
    if (preference === "save-data") {
      await page.addInitScript(() => {
        const connection = new EventTarget();
        Object.assign(connection, { saveData: true });
        Object.defineProperty(navigator, "connection", {
          value: connection,
          configurable: true,
        });
      });
    }
    if (preference === "reduced-data") {
      await page.addInitScript(() => {
        const match = window.matchMedia.bind(window);
        window.matchMedia = (query) => {
          const result = match(query);
          if (query === "(prefers-reduced-data: reduce)")
            Object.defineProperty(result, "matches", { value: true });
          return result;
        };
      });
    }
    const videos: string[] = [];
    page.on("request", (request) => {
      if (/\.mp4(?:\?|$)/.test(request.url())) videos.push(request.url());
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".hero-media img")).toBeVisible();
    expect(
      await page
        .locator(".hero-media img")
        .evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
    ).toBe(true);
    await expect(page.locator(".hero-media video")).toHaveCount(0);
    expect(videos).toEqual([]);
    await expect(
      page
        .getByRole("navigation", { name: "Choisis ton niveau" })
        .getByRole("link"),
    ).toHaveCount(6);
  });
}
