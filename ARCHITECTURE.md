# DataStorified architecture

DataStorified is a pnpm workspace containing three independently deployed Next.js 15 applications and framework-agnostic shared packages.

## Boundaries

- `apps/website`: decision experience, company pages, and Legal & Trust.
- `apps/calculators`: discovery and rendering for 55 registry-driven calculators.
- `apps/tools`: discovery and rendering for 55 browser-side utilities.
- `packages/calculators-engine` and `packages/tools-engine`: typed business logic with no UI state.
- `packages/ui`: shared interaction and presentation components.
- `packages/storage`: defensive browser persistence. Invalid, unavailable, or quota-limited storage fails safely.
- `packages/seo`: metadata and structured-data builders.
- `packages/analytics`: provider-neutral typed product events, forwarded to configured GA4 and PostHog clients.

Server components own metadata, route generation, and JSON-LD. Client components own input state, browser storage, file APIs, analytics events, and animation. Calculations and transformations stay outside React so they remain deterministic and testable.

## Reliability and security

Every application includes route-level loading, error, offline, and not-found states. Sentry captures client navigation, server, edge, and request errors when a DSN is configured. Security headers deny framing, MIME sniffing, unnecessary device APIs, and untrusted content origins. User files and calculator values are processed locally in the browser.

Production is released only by merging `dev` into protected `main`; CI must pass lint, strict TypeScript, coverage, builds, and Playwright before deployment.
