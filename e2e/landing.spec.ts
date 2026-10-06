import { expect, test, type Page } from "@playwright/test";

const SECTION_IDS = ["categories", "how-it-works", "offers", "savings", "zones", "plans", "faq"];

/** Collects console errors, warnings and uncaught exceptions for a page. */
function trackConsole(page: Page) {
  const problems: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") problems.push(`${m.type()}: ${m.text()}`);
  });
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  return problems;
}

for (const prefix of ["/pt", "/br", "/es", "/en"]) {
  test(`${prefix}: every section renders without console errors or hydration warnings`, async ({ page }) => {
    const problems = trackConsole(page);
    await page.goto(prefix, { waitUntil: "networkidle" });
    for (const id of SECTION_IDS) {
      await expect(page.locator(`section#${id}`)).toHaveCount(1);
      await expect(page.locator(`section#${id} h2`).first()).not.toBeEmpty();
    }
    await expect(page.locator("footer")).toBeVisible();
    expect(problems).toEqual([]);
  });
}

test("header navigation reaches each section", async ({ page, isMobile }) => {
  await page.goto("/en");
  for (const [label, id] of [
    ["Plans", "plans"],
    ["FAQ", "faq"],
    ["Categories", "categories"],
  ] as const) {
    if (isMobile) {
      await page.getByRole("button", { name: "Open menu" }).click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await dialog.getByRole("link", { name: label, exact: true }).click();
      await expect(dialog).toBeHidden();
    } else {
      await page.getByRole("banner").getByRole("link", { name: label, exact: true }).click();
    }
    await expect(page).toHaveURL(new RegExp(`/en#${id}$`));
    await expect(page.locator(`#${id}`)).toBeInViewport();
  }
});

test("mobile menu closes with Escape and restores page scroll", async ({ page, isMobile }) => {
  test.skip(!isMobile, "menu button only exists below xl");
  await page.goto("/pt");
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe("hidden");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).not.toBe("hidden");
});

test("savings calculator updates the estimate", async ({ page }) => {
  await page.goto("/en");
  const section = page.locator("#savings");
  const total = section.locator("[aria-live]");
  await expect(total).toHaveText("€264"); // 4 outings × €25 × 22%

  await section.getByLabel("Outings per month").fill("10");
  await expect(total).toHaveText("€660"); // 10 × 25 × 0.22 = 55/month

  await section.getByRole("button", { name: "Bars" }).click();
  await expect(section.getByRole("button", { name: "Bars" })).toHaveAttribute("aria-pressed", "true");
  await expect(section.getByRole("button", { name: "Restaurants" })).toHaveAttribute("aria-pressed", "false");
  await expect(total).toHaveText("€900"); // 10 × 25 × 0.30 = 75/month

  await section.getByLabel("Average spend per outing").fill("120");
  await expect(total).toHaveText("€4,320"); // 10 × 120 × 0.30 = 360/month
});

test("savings figures use each locale's money format", async ({ page }) => {
  await page.goto("/pt");
  await expect(page.locator("#savings [aria-live]")).toHaveText(/^264\s€$/);
  await page.goto("/es");
  await expect(page.locator("#savings [aria-live]")).toHaveText(/^264\s€$/);
});

test("zones: choosing a zone highlights it", async ({ page }) => {
  await page.goto("/en");
  const zones = page.locator("#zones");
  await expect(zones.getByRole("button", { name: /Ribeira and Baixa/ })).toHaveAttribute("aria-pressed", "true");
  await zones.getByRole("button", { name: /Vila Nova de Gaia/ }).click();
  await expect(zones.getByRole("button", { name: /Vila Nova de Gaia/ })).toHaveAttribute("aria-pressed", "true");
  await expect(zones.getByRole("button", { name: /Ribeira and Baixa/ })).toHaveAttribute("aria-pressed", "false");
  // Accessible name includes the offer count, not just the bare number.
  await expect(zones.getByRole("button", { name: /25 offers/ })).toBeVisible();
});

test("FAQ: first answer open, others toggle", async ({ page }) => {
  await page.goto("/en");
  const items = page.locator("#faq details");
  await expect(items).toHaveCount(4);
  await expect(items.nth(0)).toHaveAttribute("open", "");
  await expect(items.nth(1)).not.toHaveAttribute("open", "");
  await items.nth(1).locator("summary").click();
  await expect(items.nth(1)).toHaveAttribute("open", "");
  await expect(items.nth(1).locator("p")).toBeVisible();
});

test("plans show localized prices and the yearly saving", async ({ page }) => {
  await page.goto("/en");
  const plans = page.locator("#plans");
  await expect(plans.getByText("€1", { exact: false }).first()).toBeVisible();
  await expect(plans.getByText("Save 2 months")).toBeVisible();
  await expect(plans.getByRole("link", { name: "Start for €1" })).toHaveAttribute("href", "/en/join?plan=monthly");
  await expect(plans.getByRole("link", { name: /Go yearly/ })).toHaveAttribute("href", "/en/join?plan=yearly");
});

test("every internal link on the home page resolves (no 404s)", async ({ page, request }) => {
  await page.goto("/pt");
  const hrefs = await page.locator("a[href]").evaluateAll((as) =>
    [...new Set(as.map((a) => a.getAttribute("href")!))].filter((h) => h.startsWith("/") || h.startsWith("#")),
  );
  const ids = new Set(await page.locator("[id]").evaluateAll((els) => els.map((e) => e.id)));
  expect(hrefs.length).toBeGreaterThan(10);
  for (const href of hrefs) {
    const [path, hash] = href.split("#");
    if (path) {
      const res = await request.get(path);
      expect(res.status(), href).toBe(200);
    }
    // Anchors on (or pointing back to) the home page must exist on it.
    if (hash && (path === "" || path === "/pt")) expect(ids.has(hash), `missing #${hash} for ${href}`).toBe(true);
  }
});

test("placeholder pages render in every locale and are not indexed", async ({ page }) => {
  for (const [path, heading] of [
    ["/pt/join", "Ativar o passe"],
    ["/br/card", "Meu cartão"],
    ["/es/login", "Entrar"],
    ["/en/terms", "Terms and conditions"],
  ] as const) {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${path}$`));
  }
});

test("unknown paths return a localized 404", async ({ page }) => {
  const res = await page.goto("/es/no-existe");
  expect(res?.status()).toBe(404);
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.getByText("Esta página no existe.")).toBeVisible();
});

test("skip link appears on focus and targets main", async ({ page }) => {
  await page.goto("/en");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).not.toBeInViewport();
  await page.keyboard.press("Tab");
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await expect(skip).toHaveAttribute("href", "#main");
  await expect(page.locator("main#main")).toHaveCount(1);
});

/** True if the canvas has painted (centre pixel is not transparent). */
const canvasPainted = (page: Page) =>
  page.locator("#main canvas").evaluate((c: HTMLCanvasElement) => {
    const ctx = c.getContext("2d")!;
    return c.width > 0 && ctx.getImageData(c.width / 2, c.height / 2, 1, 1).data[3] > 0;
  });

test("hero film paints", async ({ page }) => {
  await page.goto("/en");
  await expect.poll(() => canvasPainted(page)).toBe(true);
});

test("hero film still paints a frame with reduced motion", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto("/en");
  await expect.poll(() => canvasPainted(page)).toBe(true);
  await ctx.close();
});
