import { createHash, randomBytes } from "node:crypto";
import { expect, test } from "@playwright/test";
import { FEATURES } from "../src/lib/features";
import { createSession, createUser, db, DEMO_PASSWORD, signInAs, uniqueEmail } from "./helpers";

test.describe("join flow", () => {
  test("creating an account signs in and moves to the plan step", async ({ page }) => {
    const email = uniqueEmail("join");
    await page.goto("/pt/join?plan=yearly");
    await page.getByLabel("Nome completo").fill("Rita Teste");
    await page.getByLabel("Email").fill(email.toUpperCase());
    await page.locator("#join-password").fill("uma-palavra-passe");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Continuar para o pagamento" }).click();

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Escolhe como queres pagar.");
    await expect(page.getByText(`Sessão iniciada como ${email}.`)).toBeVisible();
    // ?plan=yearly is carried through sign-up.
    await expect(page.getByRole("radio", { name: /Anual/ })).toBeChecked();

    // No Stripe key in e2e: the member gets a clear message, not an error page.
    await page.getByRole("button", { name: "Pagar e receber o meu cartão" }).click();
    await expect(page.locator(".form-alert")).toContainText("Os pagamentos estão a ser configurados");

    // Still no access until a webhook says so.
    await page.goto("/pt/home");
    await expect(page).toHaveURL(/\/pt\/join$/);
  });

  test("shows localized validation errors and keeps the typed values", async ({ page }) => {
    await page.goto("/en/join");
    await page.getByLabel("Full name").fill("R");
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByRole("button", { name: "Continue to payment" }).click();
    await expect(page.getByText("Enter your name (at least 2 characters).")).toBeVisible();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
    await expect(page.getByText("Use at least 8 characters.")).toBeVisible();
    await expect(page.getByText("Accept the terms to continue.")).toBeVisible();
    await expect(page.getByLabel("Email")).toHaveValue("not-an-email");
    await expect(page.getByLabel("Full name")).toBeFocused();
  });

  test("an email can only be registered once", async ({ page }) => {
    const email = uniqueEmail("taken");
    await createUser(email);
    await page.goto("/es/join");
    await page.getByLabel("Nombre completo").fill("Ana");
    await page.getByLabel("Correo electrónico").fill(email);
    await page.locator("#join-password").fill("contrasena-larga");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Continuar al pago" }).click();
    await expect(page.getByText("Ya existe una cuenta con este correo.")).toBeVisible();
  });
});

test("password reset pages are hidden while the feature is paused", async ({ page }) => {
  test.skip(FEATURES.passwordReset, "password reset is on");
  await page.goto("/pt/login");
  await expect(page.getByRole("link", { name: "Esqueceste-te da palavra-passe?" })).toHaveCount(0);
  expect((await page.goto("/pt/forgot-password"))?.status()).toBe(404);
  expect((await page.goto(`/pt/reset-password?token=${"A".repeat(43)}`))?.status()).toBe(404);
});

test.describe("sign in and out", () => {
  test("wrong password shows a generic error; the right one returns to the requested page", async ({ page }) => {
    const email = uniqueEmail("login");
    await createUser(email, { membership: "active" });

    await page.goto("/pt/offers/terraco-seis");
    await expect(page).toHaveURL(/\/pt\/login\?next=%2Foffers%2Fterraco-seis/);

    await page.getByLabel("Email").fill(email);
    await page.locator("#login-password").fill("wrong-password");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page.locator(".form-alert")).toHaveText("O email ou a palavra-passe não estão corretos.");

    await page.locator("#login-password").fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(/\/pt\/offers\/terraco-seis$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Terraço Seis");
  });

  test("an unknown email gets the same error as a wrong password", async ({ page }) => {
    await page.goto("/en/login");
    await page.getByLabel("Email").fill(uniqueEmail("nobody"));
    await page.locator("#login-password").fill("whatever123");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.locator(".form-alert")).toHaveText("The email or password is incorrect.");
  });

  test("an open redirect in ?next= is ignored", async ({ page }) => {
    const email = uniqueEmail("redirect");
    await createUser(email, { membership: "active" });
    await page.goto("/en/login?next=//evil.example/steal");
    await page.getByLabel("Email").fill(email);
    await page.locator("#login-password").fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/localhost:\d+\/en\/home$/);
  });

  test("signing out ends the session on the server", async ({ page, context, baseURL }) => {
    const email = uniqueEmail("logout");
    await createUser(email, { membership: "active" });
    const token = await signInAs(context, email, baseURL!);
    await page.goto("/en/account");
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/en$/);

    const hash = createHash("sha256").update(token).digest("hex");
    const { rowCount } = await db().query(`SELECT 1 FROM "Session" WHERE id = $1`, [hash]);
    expect(rowCount).toBe(0);
    await page.goto("/en/home");
    await expect(page).toHaveURL(/\/en\/login/);
  });

  test("signed-in members skip the login form", async ({ page, context, baseURL }) => {
    const email = uniqueEmail("skip");
    await createUser(email, { membership: "active" });
    await signInAs(context, email, baseURL!);
    await page.goto("/br/login");
    await expect(page).toHaveURL(/\/br\/home$/);
  });
});

test.describe("password reset", () => {
  test.skip(!FEATURES.passwordReset, "password reset is paused (src/lib/features.ts)");

  test("asking for a link never reveals whether the account exists", async ({ page }) => {
    await page.goto("/en/forgot-password");
    const email = uniqueEmail("ghost");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Send link" }).click();
    await expect(page.locator(".form-alert")).toContainText(`If there's an account for ${email}`);
  });

  test("a valid link sets a new password, signs out other devices and signs in", async ({ page, context, baseURL }) => {
    const email = uniqueEmail("reset");
    const userId = await createUser(email, { membership: "active" });
    const otherDevice = await createSession(email);

    const token = randomBytes(32).toString("base64url");
    await db().query(`INSERT INTO "PasswordResetToken" (id, "userId", "expiresAt") VALUES ($1, $2, now() + interval '1 hour')`, [
      createHash("sha256").update(token).digest("hex"),
      userId,
    ]);

    await page.goto(`/pt/reset-password?token=${token}`);
    await page.getByLabel("Nova palavra-passe").fill("nova-palavra-passe-1");
    await page.getByRole("button", { name: "Guardar e entrar" }).click();
    await expect(page).toHaveURL(/\/pt\/home$/);

    const old = await db().query(`SELECT 1 FROM "Session" WHERE id = $1`, [createHash("sha256").update(otherDevice).digest("hex")]);
    expect(old.rowCount).toBe(0);
    const used = await db().query(`SELECT 1 FROM "PasswordResetToken" WHERE "userId" = $1`, [userId]);
    expect(used.rowCount).toBe(0);

    // The link only works once.
    await context.clearCookies();
    await page.goto(`/pt/reset-password?token=${token}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Este link não é válido.");
    void baseURL;
  });

  test("an expired link is refused", async ({ page }) => {
    const email = uniqueEmail("expiredlink");
    const userId = await createUser(email);
    const token = randomBytes(32).toString("base64url");
    await db().query(`INSERT INTO "PasswordResetToken" (id, "userId", "expiresAt") VALUES ($1, $2, now() - interval '1 minute')`, [
      createHash("sha256").update(token).digest("hex"),
      userId,
    ]);
    await page.goto(`/es/reset-password?token=${token}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Este enlace no es válido.");
  });
});
