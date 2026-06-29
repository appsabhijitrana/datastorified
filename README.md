# DataStorified — Phase 1

DataStorified is a mobile-first decision intelligence platform with three independently deployable Next.js applications and a shared, typed product layer.

[![CI and production deployment](https://github.com/appsabhijitrana/datastorified/actions/workflows/ci-deploy.yml/badge.svg)](https://github.com/appsabhijitrana/datastorified/actions/workflows/ci-deploy.yml)

## Project status

**Phase 1 feature scope: 100% complete · Public-launch readiness: 94%**

All requested Phase 1 product surfaces are implemented, all three applications are live on Vercel, and the production pipeline is operational. Custom-domain DNS and final cross-browser, accessibility, and Lighthouse QA remain before the public-domain launch.

| Application | Production preview | Status |
| --- | --- | --- |
| Decision Engine | [datastorified-website.vercel.app](https://datastorified-website.vercel.app) | Live |
| Calculators | [datastorified-calculators.vercel.app](https://datastorified-calculators.vercel.app) | Live — 20 calculators |
| Tools | [datastorified-tools.vercel.app](https://datastorified-tools.vercel.app) | Live — 25 tools |

See the [detailed progress report](docs/progress.md) for the weighted score, completed capabilities, production status, and remaining launch work.

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

## Development workflow

- `main` is the protected production branch. Direct pushes are blocked.
- `dev` is the shared development and integration branch.
- Create feature branches from `dev` and open pull requests back into `dev`.
- When a release is ready, open a pull request from `dev` into `main`.
- CI runs for pushes and pull requests involving either branch. Production deployment runs only after the release PR is merged into `main`.

```text
feature/* → dev → pull request → main → production
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

Three Vercel projects are deployed from this repository with each Root Directory mapped to its corresponding app. The custom domains `datastorified.com`, `calculators.datastorified.com`, and `tools.datastorified.com` are attached in Vercel and awaiting GoDaddy DNS changes. No server, database, queue, object storage, paid AI, or SMS provider is needed for Phase 1.

The repository includes a GitHub Actions quality and production-deployment pipeline. See [`docs/deployment.md`](docs/deployment.md) for the branching model, project configuration, repository variables, secrets, DNS records, release behavior, and rollback instructions.

Possible later additions: Neon PostgreSQL for accounts and sync, Cloudflare R2 for user-owned files, and opt-in AI decision reports. Keep calculator and tool execution client-side where practical.
