# DataStorified — Phase 1 production candidate

DataStorified is a mobile-first decision-intelligence platform with three independently deployable Next.js applications, 55 working calculators, 55 working browser utilities, and shared typed engines.

[![CI and production deployment](https://github.com/appsabhijitrana/datastorified/actions/workflows/ci-deploy.yml/badge.svg)](https://github.com/appsabhijitrana/datastorified/actions/workflows/ci-deploy.yml)

## Release status

The Phase 1 production candidate is implemented on the development line and is ready for a reviewed `dev → main` release after the full quality gate passes in GitHub Actions. Production deployment remains restricted to `main`.

| Surface | Scope | Local port |
| --- | --- | ---: |
| Decision Engine | Decision input, preview, product, Legal & Trust | 3000 |
| Calculators | 55 searchable, validated calculators | 3001 |
| Tools | 55 text, developer, image, PDF, and general utilities | 3002 |

Current automated evidence:

- 337 unit and component tests passing;
- calculator engine: 100% line coverage;
- tools engine: 99.25% line coverage;
- storage: 100% line coverage;
- 17 functional browser regression scenarios, including every registered route and console-error checks;
- 7 visual regression baselines;
- ESLint and strict TypeScript quality gates;
- static production builds for all registered routes.

Detailed documentation:

- [Calculator formulas and test cases](docs/calculators.md)
- [Utility functions and limitations](docs/tools.md)
- [Testing architecture and commands](docs/testing.md)
- [Production quality checklist](docs/quality-checklist.md)
- [Deployment and release process](docs/deployment.md)
- [Project progress](docs/progress.md)

## Run locally

Requirements: Node.js 22 and pnpm 9.15.4.

```bash
pnpm install
pnpm exec playwright install chromium
pnpm dev
```

Open:

- `http://localhost:3000` — website;
- `http://localhost:3001` — calculators;
- `http://localhost:3002` — tools.

Run one app:

```bash
pnpm dev:website
pnpm dev:calculators
pnpm dev:tools
```

## Quality commands

```bash
pnpm lint           # ESLint, zero warnings
pnpm typecheck      # strict TypeScript across all apps
pnpm test           # unit tests
pnpm test:watch     # Vitest watch mode
pnpm test:coverage  # coverage and package thresholds
pnpm build          # all production builds
pnpm test:e2e       # functional and visual Playwright tests
pnpm run ci         # complete local release gate (`pnpm ci` is reserved by pnpm)
```

## Architecture

```text
apps/
  website/              Decision Engine, brand, Legal & Trust
  calculators/          Search and data-driven calculator pages
  tools/                Search and data-driven utility/file pages
packages/
  calculators-engine/   55 formulas, registries, Zod schemas, tests
  tools-engine/         55 transformations/file processors and tests
  ui/                   Shared mobile-first component system
  storage/              Failure-safe local persistence
  seo/                  Metadata, icons, social cards, structured data
  analytics/            Console-free browser event facade
  test-utils/            Shared Vitest/Testing Library setup
  utils/                Formatting and class utilities
e2e/                    Functional and visual Playwright regression tests
```

Calculator and utility pages render registry definitions and call engine functions; formulas and transformations do not live in UI components. Calculator schemas stay engine-side so Zod objects never cross the Next.js server/client serialization boundary.

## Working capabilities

The calculator catalog covers finance, investing, Indian tax, gold, property, vehicles, business, health, and general conversion/planning tasks. Every page includes validation, results, insights, formulas, assumptions, related calculators, FAQs, draft persistence, favorites, and recent history.

The utility catalog includes text cleanup/counting, JSON/CSV/YAML conversion, Base64/URL/JWT/regex/timestamp/cron tools, SHA-256, QR and UPI QR, secure passwords and UUIDs, canvas-based image operations, and `pdf-lib` merge/split/rotate/extract/images-to-PDF/metadata workflows. File operations run locally and provide downloadable outputs.

## Development and deployment workflow

- `dev` is the development/integration branch.
- `main` is protected and is the only production deployment branch.
- Feature work merges into `dev`; a reviewed release pull request merges `dev` into `main`.
- CI runs install, lint, typecheck, tests, coverage, builds, and Playwright.
- Vercel production deployments and smoke tests run only after a successful `main` push.

```text
feature/* → dev → release pull request → main → production
```

The applications are configured for `datastorified.com`, `calculators.datastorified.com`, and `tools.datastorified.com`. See [deployment documentation](docs/deployment.md) for Vercel variables, DNS, rollback, and release details.

## Known release limitations

- Currency conversion uses a user-entered static rate and does not claim live pricing.
- Image workflows depend on browser canvas codecs/memory and do not retain all metadata or animation frames.
- PDF workflows require unencrypted documents and available browser memory.
- The basic cropper and color picker use numeric coordinates in Phase 1.
- JWT decoding does not verify signatures; basic minifiers are not production compilers.
- Legal templates and regulated-domain disclaimers require qualified human review before broad public promotion.
