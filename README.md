# Clube Descontos Porto

Mobile-first subscription platform for discounts in Greater Porto. Project rules and conventions: [CLAUDE.md](CLAUDE.md).

## Getting started

Requires Node 22+ and PostgreSQL 14+ (with the `pg_trgm` and `unaccent` extensions available).

```bash
cp .env.example .env.local   # set DATABASE_URL (and E2E_DATABASE_URL for e2e tests)
npm install                  # also generates the Prisma client
npm run db:migrate           # apply migrations to the dev database
npm run db:seed              # categories, zones, sample offers and demo accounts
npm run dev                  # http://localhost:3000 → redirects to /pt, /fr, /es or /en
```

Demo accounts (development only, password `Porto-2026!`): `member@example.com` (active),
`expired@example.com` (expired), `nosub@example.com` (signed up, never paid).

## Checks

```bash
npm run typecheck && npm run lint && npm run test && npm run i18n:check
npx playwright install chromium   # first time only
npm run test:e2e                  # builds into .next-e2e, serves on :3100, runs at 390px and 1440px
```

## Payments (Stripe)

```bash
npm run stripe:setup     # creates the product + 1 €/month and 10 €/year prices (lookup keys), idempotent
stripe listen --forward-to localhost:3000/api/stripe/webhook   # local webhooks; put the whsec_ in .env.local
```

Membership only becomes active when a verified webhook arrives. Free access is given in the
backoffice (Members) or with `npm run member:grant -- <email> <days> ["reason"]`.

## Backoffice

`/pt/admin` (or `/fr`, `/es`, `/en`). Make an account the admin with `npm run admin:set -- <email>`.

## Production deploy

```bash
npm ci
NODE_ENV=production npm run db:deploy     # migrations on the production database
NODE_ENV=production npm run db:seed       # reference data only (no sample offers in production)
npm run build
pm2 startOrReload ecosystem.config.cjs --update-env && pm2 save
```
