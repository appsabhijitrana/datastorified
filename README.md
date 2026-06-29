# DataStorified — Phase 1

DataStorified is a mobile-first decision intelligence platform with three independently deployable Next.js applications and a shared, typed product layer.

## Apps

- `apps/website` — decision engine landing experience on port `3000`
- `apps/calculators` — 20 visual calculators on port `3001`
- `apps/tools` — 25 private, client-first utilities on port `3002`

## Run locally

Requirements: Node.js 20+ and pnpm 9+.

```bash
pnpm install
pnpm dev
```

Run one surface only:

```bash
pnpm dev:website
pnpm dev:calculators
pnpm dev:tools
```

Production checks:

```bash
pnpm typecheck
pnpm build
```

## Workspace map

```text
apps/
  website/              Decision Engine and marketing experience
  calculators/          Search, discovery, and dynamic calculator pages
  tools/                Search, discovery, and dynamic utility pages
packages/
  ui/                   Shared mobile-first component system
  seo/                  Metadata, canonical URL, and FAQ schema helpers
  utils/                Formatting and class utilities
  calculators-engine/   Registry and calculation formulas
  tools-engine/         Registry and browser-side transformations
  storage/              Version-stable local persistence API
  analytics/            Development-safe tracking facade
```

## What is implemented

Calculator formulas are centralized in `packages/calculators-engine`. EMI, SIP, FD, CAGR, inflation, retirement, emergency fund, net worth, loan eligibility, home affordability, GST, basic income tax, HRA, age, percentage, discount, BMI, fuel cost, and unit conversion run locally. Currency conversion intentionally uses a user-visible demo rate rather than a live API.

Text and developer tools run through `packages/tools-engine`: counts, case conversion, line cleanup/sorting, slugs, JSON formatting/validation, Base64, URL encoding, UUIDs, Markdown preview, regex testing, passwords, and timestamps. Hashing, image, PDF, and QR workflows are clearly labeled Phase 1 demos and do not pretend to process or upload files.

Favorites, recent items, searches, preferences, and calculator drafts use the requested `ds.*` local-storage keys. There is no login wall or backend.

## Deployment

Create three Vercel projects from this repository and set each Root Directory to its corresponding app. Point `datastorified.com`, `calculators.datastorified.com`, and `tools.datastorified.com` to those projects through Cloudflare DNS. No server, database, queue, object storage, paid AI, or SMS provider is needed for Phase 1.

Possible later additions: Neon PostgreSQL for accounts and sync, Cloudflare R2 for user-owned files, and opt-in AI decision reports. Keep calculator and tool execution client-side where practical.
