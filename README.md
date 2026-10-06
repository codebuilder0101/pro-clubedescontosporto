# Clube Descontos Porto

Mobile-first subscription platform for discounts in Greater Porto. Project rules and conventions: [CLAUDE.md](CLAUDE.md).

## Getting started

```bash
cp .env.example .env.local
npm install
npm run dev            # http://localhost:3000 → redirects to /pt, /br, /es or /en
```

## Checks

```bash
npm run typecheck && npm run lint && npm run test && npm run i18n:check
npx playwright install chromium   # first time only
npm run test:e2e                  # builds and serves on :3100, runs at 390px and 1440px
```
