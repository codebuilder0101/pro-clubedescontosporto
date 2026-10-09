import { expect, test } from "@playwright/test";
import { cookieHeader, createSession, createUser, db, DEMO_PASSWORD, signInAs, testPhoto, uniqueEmail, waitForHydration } from "./helpers";

test.describe("backoffice access", () => {
  test("visitors go to login, members get a 404, admins get in", async ({ request }) => {
    const anon = await request.get("/pt/admin", { maxRedirects: 0 });
    expect(anon.status()).toBe(307);
    expect(anon.headers().location).toMatch(/\/pt\/login\?next=%2Fadmin/);

    const memberEmail = uniqueEmail("notadmin");
    await createUser(memberEmail, { membership: "active" });
    const member = await request.get("/pt/admin/offers", { headers: cookieHeader(await createSession(memberEmail)), maxRedirects: 0 });
    expect(member.status()).toBe(404);
    // Only the generic 404, none of the backoffice texts.
    expect(await member.text()).not.toContain("Resumo do clube");

    const adminEmail = uniqueEmail("admin");
    await createUser(adminEmail, { role: "ADMIN" });
    const admin = await request.get("/pt/admin", { headers: cookieHeader(await createSession(adminEmail)) });
    expect(admin.status()).toBe(200);
    expect(await admin.text()).toContain("Resumo do clube");
  });
});

test("the admin lands in the backoffice after signing in, never on the plan step", async ({ page }) => {
  const email = uniqueEmail("adminlogin");
  await createUser(email, { role: "ADMIN" });
  await page.goto("/pt/login");
  await waitForHydration(page, "#login-email");
  await page.getByLabel("Email").fill(email);
  await page.locator("#login-password").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/pt\/admin$/);
  await page.goto("/pt/join");
  await expect(page).toHaveURL(/\/pt\/admin$/);
});

test("admin creates a partner and an offer with a photo; members see it, drafts stay hidden", async ({ page, context, baseURL, request }) => {
  test.setTimeout(90_000);
  const adminEmail = uniqueEmail("admin");
  await createUser(adminEmail, { role: "ADMIN" });
  await signInAs(context, adminEmail, baseURL!);
  const venueName = `Parceiro E2E ${Date.now().toString(36)}`;

  await page.goto("/pt/admin/venues/new");
  await waitForHydration(page, "#v-name");
  await page.getByLabel("Nome", { exact: true }).fill(venueName);
  await page.getByLabel("Rua e número").fill("Rua das Flores 10");
  await page.getByLabel("Código postal").fill("4050-262");
  await page.getByLabel("Bairro").fill("Baixa");
  await page.getByLabel("Zona").selectOption({ label: "Ribeira e Baixa" });
  await page.getByLabel("Latitude").fill("41.1438");
  await page.getByLabel("Longitude").fill("-8.6132");
  await page.getByRole("button", { name: "Criar parceiro" }).click();
  await expect(page).toHaveURL(/\/pt\/admin\/venues\/[a-z0-9]+\?saved=1/);

  await page.getByRole("link", { name: "Adicionar oferta" }).click();
  await waitForHydration(page, "#o-status");
  // Validation: pt-PT texts are required.
  await page.getByRole("button", { name: "Criar oferta" }).click();
  await expect(page.getByText("Há campos a corrigir.")).toBeVisible();
  await expect(page.getByText("Obrigatório em português de Portugal.").first()).toBeVisible();

  await page.getByLabel("Categoria").selectOption({ label: "Restaurantes" });
  await page.getByLabel("Percentagem", { exact: true }).fill("40");
  await page.locator("#pt-PT-title").fill("40% em teste automático");
  await page.locator("#pt-PT-summary").fill("Só para testes");
  await page.locator("#pt-PT-desc").fill("Oferta criada pelos testes e2e.");
  await page.getByRole("button", { name: "Criar oferta" }).click();
  await expect(page).toHaveURL(/\/pt\/admin\/offers\/[a-z0-9]+\?saved=1/);
  await waitForHydration(page, "#img-upload");
  const slug = await page.locator("#o-slug").inputValue();

  await page.locator("#img-upload").setInputFiles({ name: "foto.jpg", mimeType: "image/jpeg", buffer: await testPhoto() });
  await page.getByRole("button", { name: "Carregar" }).click();
  await expect(page.getByText("Fotografias adicionadas.")).toBeVisible();

  // Still a draft: a member gets a 404, the admin can preview it.
  const memberEmail = uniqueEmail("member");
  await createUser(memberEmail, { membership: "active" });
  const memberToken = await createSession(memberEmail);
  expect((await request.get(`/pt/offers/${slug}`, { headers: cookieHeader(memberToken) })).status()).toBe(404);
  expect((await page.goto(`/pt/offers/${slug}`))?.status()).toBe(200);

  // Publish.
  await page.goto("/pt/admin/offers");
  await page.getByRole("link", { name: new RegExp(venueName) }).click();
  await waitForHydration(page, "#o-status");
  await page.getByLabel("Estado").selectOption("PUBLISHED");
  await page.getByRole("button", { name: "Guardar alterações" }).click();
  await expect(page.getByText("Guardado.")).toBeVisible();

  const res = await request.get(`/pt/offers/${slug}`, { headers: cookieHeader(memberToken) });
  expect(res.status()).toBe(200);
  const html = await res.text();
  expect(html).toContain(venueName);
  const photo = html.match(/\/api\/media\/offers\/[a-z0-9-]+\.webp/)?.[0];
  expect(photo).toBeTruthy();

  // Photos are member content too.
  expect((await request.get(photo!, { headers: cookieHeader(memberToken) })).status()).toBe(200);
  expect((await request.get(photo!, { headers: { cookie: "" } })).status()).toBe(404);
  const expiredEmail = uniqueEmail("expired");
  await createUser(expiredEmail, { membership: "expired" });
  expect((await request.get(photo!, { headers: cookieHeader(await createSession(expiredEmail)) })).status()).toBe(404);

  const audit = await db().query(`SELECT action FROM "AuditLog" WHERE summary LIKE $1 ORDER BY "createdAt"`, [`%${venueName}%`]);
  expect(audit.rows.map((r) => r.action)).toEqual(expect.arrayContaining(["venue.create", "offer.create", "offer.update"]));
});

test("admin can't delete a partner that still has offers", async ({ page, context, baseURL }) => {
  const adminEmail = uniqueEmail("admin");
  await createUser(adminEmail, { role: "ADMIN" });
  await signInAs(context, adminEmail, baseURL!);
  await page.goto("/pt/admin/venues?q=Tasca%20da%20Viela");
  await page.getByRole("link", { name: /Tasca da Viela/ }).click();
  await waitForHydration(page, "#v-name");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Eliminar" }).click();
  await expect(page.getByText("Este parceiro ainda tem ofertas.")).toBeVisible();
});

test("admin grants free access and suspends a member", async ({ page, context, baseURL, browser }) => {
  const adminEmail = uniqueEmail("admin");
  await createUser(adminEmail, { role: "ADMIN" });
  await signInAs(context, adminEmail, baseURL!);
  const email = uniqueEmail("grantee");
  const userId = await createUser(email, { name: "Pessoa Teste" });

  await page.goto(`/pt/admin/members/${userId}`);
  await waitForHydration(page, "#g-days");
  await page.getByLabel("Dias").fill("10");
  await page.getByLabel("Motivo").fill("Equipa");
  await page.getByRole("button", { name: "Dar acesso" }).click();
  await expect(page.getByText("Acesso gratuito atribuído.")).toBeVisible();

  const member = await browser.newContext();
  const token = await signInAs(member, email, baseURL!);
  const mp = await member.newPage();
  expect((await mp.goto("/pt/home"))?.url()).toMatch(/\/pt\/home$/);

  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Suspender conta" }).click();
  await expect(page.getByText("Suspenso", { exact: true }).first()).toBeVisible();
  const sessions = await db().query(`SELECT 1 FROM "Session" WHERE "userId" = $1`, [userId]);
  expect(sessions.rowCount).toBe(0);
  await mp.goto("/pt/home");
  await expect(mp).toHaveURL(/\/pt\/login/);
  void token;
  await member.close();
});
