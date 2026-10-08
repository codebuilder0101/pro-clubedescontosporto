@AGENTS.md

# Clube Descontos Porto

Mobile-first subscription web platform. Members pay 1€/month (or 10€/year) for exclusive discounts, experiences and events in Greater Porto (restaurants, bars, events, culture, leisure). At the venue, the member shows a virtual club card on their phone. No partner-side validation in the MVP.

- Full product spec: `docs/spec.md` (**not in the repo yet**, ask for it)
- Visual reference (clickable prototype, open in a browser): `reference/clube-porto-site/index.html`
- Screen captures of the prototype: `reference/clube-porto-design/*.png`

## Non-negotiable rules

1. **Access control lives on the server.** Offer details (name, address, conditions, map, how to use) must never leave the database for a visitor without an active subscription. Never hide paid content only with CSS, client state or a client redirect. Every server component, route handler and server action that returns member content calls `requireActiveMember()` first.
2. **Four languages, always.** Every user-facing string exists in `messages/pt-PT.json`, `messages/pt-BR.json`, `messages/es.json` and `messages/en.json`. Never hard-code UI text in components. A missing key fails CI (`npm run i18n:check`).
3. **Stripe is the source of truth for billing.** Subscription status in our DB is updated only from verified Stripe webhooks, never from the client redirect after checkout.
4. **Mobile first.** Build and test every screen at 390px width first, then tablet (768px) and desktop (1440px).
5. **No secrets in the repo.** Use `.env.local` (git-ignored) and keep `.env.example` up to date.
6. **Small, reviewable steps.** After each task: run typecheck, lint and tests, then summarise what changed, what to test manually and any open decisions.

## Stack

- Next.js 16 (App Router, RSC, Server Actions), TypeScript strict. Middleware is called **Proxy** in v16: `src/proxy.ts`.
- Tailwind CSS v4; design tokens are CSS variables on `:root` in `src/app/globals.css`, exposed to Tailwind via `@theme inline` (`bg-cobalt`, `text-deep`, …)
- i18n: next-intl (`src/i18n/*`)
- Database: PostgreSQL + Prisma (pg_trgm and unaccent for search)
- Auth: own database sessions (`src/lib/auth/*`), email + password (argon2id). Not Auth.js: its Credentials provider only supports JWT sessions. Google/Apple login is Phase 3.
- Payments: Stripe Billing (Checkout, Customer Portal, webhooks). Card and SEPA Direct Debit. Monthly 1€ and yearly 10€.
- Maps: MapLibre GL or Leaflet with OpenStreetMap tiles. Coordinates stored on the venue.
- Images: S3-compatible storage (Cloudflare R2) via next/image
- PWA: Serwist (installable, card page works offline)
- Validation: Zod on every server action and route handler input
- Tests: Vitest (unit, `src/**/*.test.ts`), Playwright (e2e in `e2e/`, projects `mobile-390` and `desktop-1440`)
- Email: Resend (or Postmark) with React Email templates, localised

## Locales

| Locale | URL prefix | Switcher | Notes |
|---|---|---|---|
| pt-PT | /pt | PT | Default and fallback for content |
| pt-BR | /br | BR | Brazilian vocabulary (celular, tela, cadastro, senha, assinatura, você) |
| es | /es | ES | Spanish (Spain), tú form |
| en | /en | EN | British-neutral English, "you" form |

- `localePrefix: 'always'` with custom prefixes. Detection: `NEXT_LOCALE` cookie → Accept-Language → pt-PT.
- Save `preferredLocale` on the user. Emails and Stripe Checkout use it.
- Money: `formatMoney(locale, amount)` from `src/lib/format.ts` (Intl, EUR). Dates: `formatDateTime` (Intl, Europe/Lisbon). `en` is formatted as `en-GB`.
- hreflang alternates for all 4 locales plus x-default: `localeAlternates()` in `src/lib/seo.ts`, used from `generateMetadata`.
- Database content is translated in `*Translation` tables. Fallback: requested locale → pt-PT → first available. Admin forms show one tab per locale with a completeness badge.
- PT-PT and PT-BR are different locales. Never copy one into the other without adapting vocabulary (see `docs/spec.md`, "Tone per locale").
- Keep a no-break space where a line break would split a unit (`40 %` in es).

## Code map

- `src/app/[locale]/(site)/`: public site (header + footer via `SiteShell`). Home = `page.tsx`.
- `src/app/[locale]/(auth)/`: login, join (account → plan → Stripe Checkout → welcome), forgot/reset password. Slim `AuthShell`.
- `src/app/[locale]/(member)/`: home, explore (search), offers/[slug], card, account. `MemberShell` (header nav + phone dock). Each page calls `requireActiveMember()` (account: `requireUser()`); the data layer `src/lib/offers.ts` calls it again.
- Server actions: `src/lib/actions/auth.ts`, `src/lib/actions/billing.ts`. Errors are codes translated from `Auth.errors.*`.
- Stripe: `src/lib/stripe.ts` (Checkout), `src/app/api/stripe/webhook/route.ts` + `src/lib/stripe-webhook.ts` (the only writer of STRIPE subscriptions; idempotent, ignores stale events).
- Placeholder pages (`terms`, `privacy`, `cookies`) use `placeholderRoute()` and are `noindex`. Replace them as the real features land.
- Every page sets its own canonical/hreflang with `pageMetadata(locale, href)` (the layout does not).
- Every layout/page using next-intl calls `setRequestLocale(locale)`, or the route stops being statically rendered.
- Landing figures (partner/category/zone counts) come from `getLandingStats()` (`src/lib/landing-stats.ts`), revalidated hourly. Only counts may be public.
- Database: `prisma/schema.prisma`, client generated to `src/generated/prisma` (git-ignored). DB sessions run in UTC (timestamps are stored without time zone). Sample offers live in `prisma/seed-data.ts` and are never seeded in production.
- `OfferArt` (`src/components/art`) draws placeholder offer illustrations.

## Design

Tokens (`src/app/globals.css`): `--linen #F2F4F8` page, `--paper #FBFAF6` cards, `--tile #DCE5F6`, `--cobalt #1747A6` primary, `--deep #0F2D6B` headings/dark surfaces, `--sun #FFC531` CTAs, `--roof #D9653B` illustrations only, `--ink #14213D` text, `--mute #5A6884`, `--ok/--warn/--bad`.

- Fonts (next/font/google): Bricolage Grotesque (display 700/800, `font-display`), Figtree (body, `font-sans`), JetBrains Mono (card number, clock, `font-mono`).
- Big circular glossy icons (`.ci` + `.ci-sun|roof|leaf|violet|sky`, size via `[--s:56px]`), menu height 96px desktop, menu labels 18–19px/800.
- Varied card shapes: arches (categories), notched tickets (offers), polaroids, round pebbles, leather member card (`.mcard.tex-leather`).
- Textures: linen (body), paper grain (`.tex-paper`), leather (`.tex-leather`).
- No black backgrounds. The darkest surface is `--deep`.
- Motion: subtle, and respects `prefers-reduced-motion` (global rule in globals.css).

## Commands

```
npm run dev | build | start
npm run lint | typecheck | test | test:e2e
npm run i18n:check     # fails if any key is missing, empty or has different ICU args in any locale
npm run db:migrate | db:deploy | db:seed
npm run stripe:setup                               # product + prices in Stripe (idempotent)
npm run member:grant -- <email> <days> | --revoke  # manual access until the backoffice exists
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Definition of done (every task)

- `npm run typecheck && npm run lint && npm run test && npm run i18n:check` pass
- The screen works at 390px and 1440px, in all 4 locales (switch and check)
- Member-only data is not present in the HTML, RSC payload or API response for a logged-out user or an expired member (an e2e test proves it)
- New env vars are added to `.env.example` with a comment
- Short summary written for the developer: what changed, how to test, open questions
