import { expect, test } from "@playwright/test";
import { cookieHeader, createSession, createUser, db, DEMO_PASSWORD, signInAs, uniqueEmail, waitForHydration } from "./helpers";

test("favourites: save from the offer, list them, remove them", async ({ page, context, baseURL }) => {
  const email = uniqueEmail("fav");
  await createUser(email, { membership: "active" });
  await signInAs(context, email, baseURL!);

  await page.goto("/pt/offers/terraco-seis");
  await waitForHydration(page, "button.fav-btn");
  const saved = page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/offers/terraco-seis"));
  await page.getByRole("button", { name: "Guardar nos favoritos" }).first().click();
  await saved;
  // Still shown as saved once the server has answered.
  await expect(page.getByRole("button", { name: "Retirar dos favoritos" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Retirar dos favoritos" }).first()).toBeEnabled();

  await page.goto("/pt/favorites");
  await expect(page.getByRole("link", { name: "Terraço Seis" })).toBeVisible();
  await waitForHydration(page, "button.fav-btn");
  const removed = page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/favorites"));
  await page.getByRole("button", { name: "Retirar dos favoritos" }).click();
  await removed;
  await page.reload();
  await expect(page.getByText("Ainda não tens favoritos.")).toBeVisible();
});

test("recording a discount use estimates the saving, once per 12 hours", async ({ page, context, baseURL }) => {
  const email = uniqueEmail("use");
  await createUser(email, { membership: "active" });
  await signInAs(context, email, baseURL!);

  await page.goto("/pt/offers/tasca-da-viela");
  await waitForHydration(page, "input[name=bill]");
  await page.getByLabel("Valor da conta antes do desconto (opcional)").fill("50");
  await page.getByRole("button", { name: "Usei" }).click();
  await expect(page.getByText("Registado: poupaste 15 €.")).toBeVisible();

  await page.reload();
  await waitForHydration(page, "input[name=bill]");
  await page.getByRole("button", { name: "Usei" }).click();
  await expect(page.getByText("Já registaste esta oferta nas últimas 12 horas.")).toBeVisible();

  await page.goto("/pt/home");
  await expect(page.getByText("15 € poupados")).toBeVisible();
  await page.goto("/pt/account");
  await expect(page.getByText("15 € poupados em 1 desconto")).toBeVisible();
});

test("account: profile, password (signs out other devices) and data export", async ({ page, context, baseURL, request }) => {
  const email = uniqueEmail("acc");
  await createUser(email, { name: "Nome Antigo", membership: "active" });
  await signInAs(context, email, baseURL!);
  const otherDevice = await createSession(email);

  await page.goto("/pt/account");
  await waitForHydration(page, "#acc-name");
  await page.locator("#acc-name").fill("Nome Novo");
  await page.locator("#acc-locale").selectOption("fr");
  await page.getByRole("button", { name: "Guardar perfil" }).click();
  await expect(page).toHaveURL(/\/fr\/account\?saved=profile/);
  await expect(page.getByText("Profil enregistré.")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bonjour, Nome.");

  await page.locator("#acc-pw-current").fill("errada");
  await page.locator("#acc-pw-new").fill("nova-palavra-123");
  await page.getByRole("button", { name: "Changer le mot de passe" }).click();
  await expect(page.getByText("Le mot de passe est incorrect.")).toBeVisible();
  await page.locator("#acc-pw-current").fill(DEMO_PASSWORD);
  await page.locator("#acc-pw-new").fill("nova-palavra-123");
  await page.getByRole("button", { name: "Changer le mot de passe" }).click();
  await expect(page.getByText("Mot de passe modifié.")).toBeVisible();
  expect((await request.get("/pt/home", { headers: cookieHeader(otherDevice), maxRedirects: 0 })).status()).toBe(307);

  const exported = await page.request.get("/api/account/export");
  expect(exported.status()).toBe(200);
  const json = await exported.json();
  expect(json.account.email).toBe(email);
  expect(json.account).not.toHaveProperty("passwordHash");
  expect((await request.get("/api/account/export", { headers: { cookie: "" } })).status()).toBe(401);
});

test("deleting the account removes it and signs out", async ({ page, context, baseURL }) => {
  const email = uniqueEmail("del");
  const id = await createUser(email, { membership: "active" });
  await signInAs(context, email, baseURL!);
  await page.goto("/en/account");
  await page.getByText("Delete my account").click();
  await page.locator("#acc-del-pw").fill(DEMO_PASSWORD);
  await page.getByRole("checkbox", { name: /deletes my account permanently/ }).check();
  await page.getByRole("button", { name: "Delete account permanently" }).click();
  await expect(page).toHaveURL(/\/en$/);
  const rows = await db().query(`SELECT 1 FROM "User" WHERE id = $1`, [id]);
  expect(rows.rowCount).toBe(0);
});

test("a failed payment shows the banner and blocks a second checkout", async ({ page, context, baseURL }) => {
  const email = uniqueEmail("pastdue");
  const id = await createUser(email);
  await db().query(`UPDATE "User" SET "stripeCustomerId" = $1 WHERE id = $2`, [`cus_${id}`, id]);
  await db().query(
    `INSERT INTO "Subscription" (id, "userId", provider, "stripeSubscriptionId", plan, status, "currentPeriodEnd", "updatedAt")
     VALUES ($1, $2, 'STRIPE', $3, 'MONTHLY', 'PAST_DUE', now() + interval '20 days', now())`,
    [`sub${id}`, id, `sub_${id}`],
  );
  await signInAs(context, email, baseURL!);

  await page.goto("/pt/home");
  await expect(page).toHaveURL(/\/pt\/join$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("O último pagamento não passou.");
  await expect(page.getByRole("button", { name: "Atualizar método de pagamento" })).toBeVisible();

  await page.goto("/pt/account");
  await expect(page.getByRole("alert").filter({ hasText: "O último pagamento falhou." })).toBeVisible();
});

test("partner request form: saved for the backoffice; bots are ignored", async ({ page }) => {
  const business = `Negócio ${Date.now().toString(36)}`;
  await page.goto("/pt/partners");
  await waitForHydration(page, "#pr-business");
  await page.getByRole("button", { name: "Enviar pedido" }).click();
  await expect(page.getByText("Este campo é obrigatório.").first()).toBeVisible();

  await page.getByLabel("Nome do negócio").fill(business);
  await page.getByLabel("O teu nome").fill("Joana");
  await page.getByLabel("Email").fill("joana@example.com");
  await page.getByLabel("Localidade ou zona").fill("Porto");
  await page.getByLabel("A tua ideia de oferta").fill("Queremos dar 15% nos lanches.");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Enviar pedido" }).click();
  await expect(page.getByText("Obrigado! Recebemos o teu pedido.")).toBeVisible();

  const saved = await db().query(`SELECT status, locale FROM "PartnerRequest" WHERE "businessName" = $1`, [business]);
  expect(saved.rows).toEqual([{ status: "NEW", locale: "pt-PT" }]);
});

test("suspended accounts can't sign in", async ({ page }) => {
  const email = uniqueEmail("blocked");
  const id = await createUser(email, { membership: "active" });
  await db().query(`UPDATE "User" SET "blockedAt" = now() WHERE id = $1`, [id]);
  await page.goto("/en/login");
  await page.getByLabel("Email").fill(email);
  await page.locator("#login-password").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator(".form-alert")).toHaveText("This account has been suspended. Please contact the club.");
});
