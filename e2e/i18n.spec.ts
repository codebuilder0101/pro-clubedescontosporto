import { expect, test } from "@playwright/test";

const cases = [
  { prefix: "/pt", lang: "pt-PT", heading: /O Porto inteiro com desconto/, cta: /Ativar meu passe de 1/ },
  { prefix: "/br", lang: "pt-BR", heading: /O Porto inteiro com desconto/, cta: /Ativar meu passe de/ },
  { prefix: "/es", lang: "es", heading: /Todo Oporto con descuento/, cta: /Activar mi pase de 1/ },
  { prefix: "/en", lang: "en", heading: /All of Porto at a discount/, cta: /Get my €1 pass/ },
];

for (const c of cases) {
  test(`home renders in ${c.lang}`, async ({ page }) => {
    await page.goto(c.prefix);
    await expect(page.locator("html")).toHaveAttribute("lang", c.lang);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(c.heading);
    // The hero CTA (the CTA band further down repeats it).
    await expect(page.locator("main > section").first().getByRole("link", { name: c.cta })).toBeVisible();

    // No horizontal scroll at any viewport.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test("hreflang alternates cover all locales plus x-default", async ({ page }) => {
  await page.goto("/pt");
  const hreflangs = await page
    .locator('link[rel="alternate"][hreflang]')
    .evaluateAll((els) => els.map((e) => e.getAttribute("hreflang")).sort());
  expect(hreflangs).toEqual(["en", "es", "pt-BR", "pt-PT", "x-default"]);
});

test.describe("locale detection on /", () => {
  test("defaults to pt-PT", async ({ browser }) => {
    const ctx = await browser.newContext({ locale: "de-DE" });
    const page = await ctx.newPage();
    await page.goto("/");
    await expect(page).toHaveURL(/\/pt$/);
    await ctx.close();
  });

  test("uses Accept-Language", async ({ browser }) => {
    const ctx = await browser.newContext({ locale: "es-ES" });
    const page = await ctx.newPage();
    await page.goto("/");
    await expect(page).toHaveURL(/\/es$/);
    await ctx.close();
  });

  test("cookie wins over Accept-Language", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ locale: "es-ES" });
    await ctx.addCookies([{ name: "NEXT_LOCALE", value: "pt-BR", url: baseURL! }]);
    const page = await ctx.newPage();
    await page.goto("/");
    await expect(page).toHaveURL(/\/br$/);
    await ctx.close();
  });
});

test("locale switcher keeps the user on the same page", async ({ page }) => {
  await page.goto("/pt");
  const switcher = page.getByRole("navigation", { name: "Idioma" }).first();
  if (!(await switcher.isVisible())) {
    await page.getByRole("button", { name: "Abrir menu" }).click();
  }
  await page.getByRole("link", { name: "English" }).filter({ visible: true }).first().click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});
