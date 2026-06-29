# Phase 1 production quality checklist

## Product inventory

- [x] 55 calculator routes exist and call `packages/calculators-engine`.
- [x] 55 utility routes exist and call `packages/tools-engine`.
- [x] No catalog item is marked or implemented as a fake mock.
- [x] Advanced browser limitations are visible on the relevant page.
- [x] Currency conversion is clearly identified as a static/manual-rate estimate.

## Contracts and validation

- [x] Calculator UI contains no formula implementation.
- [x] Utility UI contains no transformation implementation.
- [x] Every calculator has an engine-only Zod schema.
- [x] Calculator results include primary/secondary results, chart data, insight, warnings, formula, and assumptions.
- [x] Utility results include output, stats, warnings, and metadata.
- [x] Empty, non-finite, negative/out-of-range, decimal, and known examples are tested.
- [x] No unjustified TypeScript `any` is present.

## User experience

- [x] Calculator pages include input, result, insight, formula, assumptions, related calculators, and FAQ sections.
- [x] Utility pages include text/file input, output, copy/download, errors/warnings, related tools, and FAQs.
- [x] Mobile navigation is present.
- [x] Representative calculator and utility pages have no horizontal overflow at 390 px.
- [x] Reduced-motion mode stabilizes tests and respects accessibility preferences.
- [x] Brand mark, favicons, manifests, and social cards are present on each app.
- [x] No dark theme is included, per product direction.

## Persistence and privacy

- [x] Favorites persist for calculators and tools.
- [x] Recent calculators and tools persist.
- [x] Calculator and text-tool drafts persist.
- [x] Search history persists.
- [x] Storage reads malformed values safely.
- [x] Storage reads/writes fail gracefully when browser storage is unavailable.
- [x] Image and PDF files are processed locally without upload.

## Automated quality

- [x] ESLint runs with zero warnings and forbids console calls.
- [x] TypeScript strict checks pass for all applications.
- [x] 337 unit and component tests pass.
- [x] Calculator engine line coverage is 100% (threshold 90%).
- [x] Tools engine line coverage is 99.25% (threshold 85%).
- [x] Overall line coverage is 99.66% (threshold 80%).
- [x] Functional Playwright regression tests cover all requested page types.
- [x] Seven visual regression baselines exist.
- [x] All registered routes pass production builds.

## Release and operations

- [x] CI runs lint, typecheck, tests, coverage, build, and E2E.
- [x] Production deploys only from successful `main` pushes.
- [x] `dev` remains the integration branch.
- [ ] Qualified counsel reviews legal policy templates.
- [ ] Financial, tax, and health disclaimers receive domain review.
- [ ] Cross-browser manual QA covers Safari, Firefox, Edge, iOS Safari, and Android Chrome.
- [ ] Lighthouse accessibility/performance audits are recorded against final custom domains.
- [ ] Custom-domain smoke tests are repeated after this release reaches `main`.
