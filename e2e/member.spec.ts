import { expect, test } from "@playwright/test";
import { createUser, signInAs, uniqueEmail } from "./helpers";

test.beforeEach(async ({ context, baseURL }) => {
  const email = uniqueEmail("member");
  await createUser(email, { name: "Rita Fernandes", membership: "active" });
  await signInAs(context, email, baseURL!);
});

test("member home greets the member and lists categories and offers", async ({ page }) => {
  await page.goto("/pt/home");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/^(Bom dia|Boa tarde|Boa noite), Rita\.$/);
  const categories = page.locator("main").getByRole("navigation", { name: "Categorias" });
  await expect(categories.getByRole("link")).toHaveCount(5);
  await expect(page.getByText("Destaque da semana")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("search tolerates typos and accents", async ({ page }) => {
  await page.goto("/pt/explore?q=francesina");
  await expect(page.getByRole("link", { name: /Francesinha do Largo/ })).toBeVisible();

  await page.goto("/pt/explore?q=cafe%20bolhao");
  await expect(page.getByRole("link", { name: /Café Bolhão Novo/ })).toBeVisible();

  await page.goto("/pt/explore?q=zzzzzz");
  await expect(page.getByText("Ainda não há nada aqui.")).toBeVisible();
});

test("search form, category and area filters", async ({ page }) => {
  await page.goto("/en/home");
  await page.getByRole("search").getByLabel("Category").selectOption("bars");
  await page.getByRole("search").getByRole("button", { name: "Search" }).click();
  await expect(page).toHaveURL(/\/en\/explore\?q=&category=bars/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bars");
  await expect(page.locator("#results-title")).toHaveText("4 results");

  await page.getByRole("navigation", { name: "Filter by area" }).getByRole("link", { name: "Vila Nova de Gaia" }).click();
  await expect(page).toHaveURL(/category=bars&zone=gaia/);
  await expect(page.locator("#results-title")).toHaveText("2 results");
});

test("offer page shows conditions, map, directions and the card shortcut", async ({ page }) => {
  await page.goto("/es/offers/tasca-da-viela");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tasca da Viela");
  await expect(page.getByText("30 % en el total de la cuenta")).toBeVisible();
  await expect(page.getByText("Hasta 4 personas por tarjeta")).toBeVisible();
  await expect(page.getByText("Rua da Viela 23")).toBeVisible();
  await expect(page.getByRole("link", { name: "Cómo llegar" })).toHaveAttribute("href", /google\.com\/maps\/dir\/.*destination=41\.1411,-8\.6127/);
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await page.getByRole("link", { name: "Enseñar tarjeta del club" }).click();
  await expect(page).toHaveURL(/\/es\/card$/);
});

test("offers are written in French on /fr", async ({ page }) => {
  await page.goto("/fr/offers/tasca-da-viela");
  await expect(page.getByText("30\u00a0% sur toute l'addition")).toBeVisible();
  await expect(page.getByRole("link", { name: "Itinéraire" })).toBeVisible();
  await page.goto("/fr/explore?q=morue");
  await expect(page.getByRole("link", { name: /Casa do Bacalhau Velho/ })).toBeVisible();
});

test("unknown offers are 404", async ({ page }) => {
  const res = await page.goto("/en/offers/does-not-exist");
  expect(res?.status()).toBe(404);
});

test("the card shows the member and a running clock", async ({ page }) => {
  await page.goto("/pt/card");
  await expect(page.getByText("Rita Fernandes")).toBeVisible();
  await expect(page.getByText(/^CP \d{4} \d{4}$/)).toBeVisible();
  const clock = page.locator(".clock time");
  await expect(clock).toHaveText(/^\d{2}:\d{2}:\d{2}$/);
  const first = await clock.textContent();
  await expect.poll(() => clock.textContent(), { timeout: 4000 }).not.toBe(first);
});

test("member pages work in every locale and are not indexed", async ({ page }) => {
  for (const [path, nav] of [
    ["/pt/home", "Explorar"],
    ["/fr/explore", "Explorer"],
    ["/es/card", "Tarjeta"],
    ["/en/account", "Explore"],
  ] as const) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.getByRole("link", { name: nav }).first()).toBeAttached();
  }
});

test("account page shows the subscription", async ({ page }) => {
  await page.goto("/fr/account");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bonjour, Rita.");
  await expect(page.getByText("Formule mensuelle")).toBeVisible();
  await expect(page.getByText("Actif", { exact: true })).toBeVisible();
});
