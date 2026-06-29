# Testing and quality gates

## Test layers

- Vitest tests all calculator formulas, utility transformations, PDF operations, mocked browser-canvas image operations, and resilient local storage.
- Testing Library is configured through `packages/test-utils/setup.ts` for component tests as interactive shared components grow.
- Playwright exercises all three applications in Chromium at desktop and mobile viewports.
- Playwright screenshot baselines cover the website, calculator discovery, EMI, tool discovery, and JSON Formatter page types.
- Production `next build` statically renders every registered calculator and utility route, catching serialization and route-generation failures.

## Current automated coverage

| Area | Tests | Line coverage |
| --- | ---: | ---: |
| Calculator engine | 174 | 100% |
| Tools engine (text, developer, image, PDF, utility) | 156 | 99.25% |
| Storage | 5 | 100% |
| Shared UI components and SmartNumberInput | 30 | Not included in engine threshold |
| **Unit/component total** | **365** | **99.66% overall engine/storage** |

Thresholds enforced by `vitest.config.ts`:

- calculator engine: at least 90% lines/functions/statements;
- tools engine: at least 85% lines/functions/statements;
- overall: at least 80% lines/functions/statements and 75% branches.

## Browser regression coverage

Functional Playwright scenarios:

1. Website homepage loads.
2. Decision text produces the decision preview.
3. Calculators homepage and EMI search work.
4. EMI produces a known result.
5. Calculator favorite persists after reload.
6. Recent calculator persists after reload.
7. Tools homepage and JSON Formatter search work.
8. JSON Formatter handles valid and invalid input.
9. Password Generator produces a fresh password.
10. Mobile bottom navigation renders.
11. Mobile calculator and utility pages have no horizontal overflow.
12. Legal pages load.
13. Unknown routes return 404.
14. Every one of the 110 registered product routes responds successfully.
15. Representative website, calculator, utility, PDF, and legal pages emit no browser console errors.

Visual baselines:

- website homepage: desktop and mobile;
- calculators homepage: desktop and mobile;
- EMI calculator: mobile;
- tools homepage: mobile;
- JSON Formatter: mobile.

Animations are disabled through reduced-motion browser emulation and matching CSS so screenshots remain stable.

## Commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:watch
pnpm test:coverage
pnpm build
pnpm test:e2e
pnpm run ci
```

Use `pnpm run ci`, not `pnpm ci`: pnpm reserves the bare `ci` command as a currently unimplemented built-in, so the explicit `run` is required to invoke the repository script.

Install Chromium once on a new machine before E2E testing:

```bash
pnpm exec playwright install chromium
```

Update screenshot baselines only after intentionally reviewing a UI change:

```bash
pnpm exec playwright test e2e/visual.spec.ts --update-snapshots
```

## CI behavior

`.github/workflows/ci-deploy.yml` runs install, lint, typecheck, unit tests, coverage enforcement, production builds, and Playwright on pull requests and on `dev`/`main` pushes. Failed browser runs upload the Playwright HTML report. Production deployment jobs remain restricted to successful pushes on `main`.
