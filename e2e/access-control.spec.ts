import { expect, test } from "@playwright/test";
import { cookieHeader, createSession, createUser, uniqueEmail } from "./helpers";

// CLAUDE.md rule 1: member-only data never leaves the server for visitors
// without an active subscription — not in the HTML, not in the RSC payload.

const MEMBER_ONLY = [
  "Rua da Viela 23", // venue address
  "4050-253", // postal code
  "Petiscos do norte numa viela", // description
  "Casa do Bacalhau Velho", // venue that is not on the public landing page
  "Reserva recomendada à sexta", // condition
];

const PAGES = ["/pt/offers/tasca-da-viela", "/pt/explore", "/pt/explore?q=viela", "/pt/home", "/pt/card", "/pt/favorites"];

function expectNoMemberData(body: string, label: string) {
  for (const secret of MEMBER_ONLY) expect(body, `${label} leaks "${secret}"`).not.toContain(secret);
}

async function fetchAll(request: import("@playwright/test").APIRequestContext, headers: Record<string, string> = {}) {
  const results: { path: string; status: number; location: string | undefined; body: string }[] = [];
  for (const path of PAGES) {
    for (const extra of [{}, { RSC: "1" }] as Record<string, string>[]) {
      const res = await request.get(path, { headers: { ...headers, ...extra }, maxRedirects: 0 });
      results.push({ path: `${path} ${JSON.stringify(extra)}`, status: res.status(), location: res.headers().location, body: await res.text() });
    }
  }
  return results;
}

test.describe("member content is protected on the server", () => {
  test("logged-out visitors are redirected to login and get no member data", async ({ request }) => {
    for (const r of await fetchAll(request)) {
      expectNoMemberData(r.body, r.path);
      if (!r.path.includes("RSC")) {
        expect(r.status, r.path).toBe(307);
        expect(r.location, r.path).toMatch(/\/pt\/login\?next=/);
      }
    }
  });

  test("signed-in users without a pass are sent to the plan step, with no member data", async ({ request }) => {
    const email = uniqueEmail("nopass");
    await createUser(email);
    const token = await createSession(email);
    for (const r of await fetchAll(request, cookieHeader(token))) {
      expectNoMemberData(r.body, r.path);
      if (!r.path.includes("RSC")) expect(r.location, r.path).toMatch(/\/pt\/join$/);
    }
  });

  test("expired members get no member data", async ({ request }) => {
    const email = uniqueEmail("expired");
    await createUser(email, { membership: "expired" });
    const token = await createSession(email);
    for (const r of await fetchAll(request, cookieHeader(token))) {
      expectNoMemberData(r.body, r.path);
      if (!r.path.includes("RSC")) expect(r.location, r.path).toMatch(/\/pt\/join$/);
    }
  });

  test("a forged session cookie gets nothing", async ({ request }) => {
    for (const r of await fetchAll(request, cookieHeader("forged-token-value"))) {
      expectNoMemberData(r.body, r.path);
    }
  });

  test("active members see the offer details", async ({ request }) => {
    const email = uniqueEmail("active");
    await createUser(email, { membership: "active" });
    const token = await createSession(email);
    const res = await request.get("/pt/offers/tasca-da-viela", { headers: cookieHeader(token), maxRedirects: 0 });
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("Rua da Viela 23");
    expect(body).toContain("Petiscos do norte numa viela");
  });

  test("the public landing page shows counts only", async ({ request }) => {
    const body = await (await request.get("/pt")).text();
    expectNoMemberData(body, "/pt");
  });
});
