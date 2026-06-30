# Testing strategy

The release gate is `pnpm run ci`: zero-warning ESLint, strict TypeScript, Vitest coverage, three production builds, and Playwright.

Vitest covers all formula and utility contracts, file workflows, property-based invariants, shared inputs, resilient storage, fuzzy search, and SEO serialization. Playwright covers the website, decision flow, calculator/tool execution, persistence, typo search, metadata, sitemap/robots/PWA routes, security headers, legal pages, 404s, all registered routes, console errors, and horizontal overflow from 320px through 1920px.

Visual baselines cover desktop, tablet, and mobile. Update them only after reviewing the rendered difference:

```bash
pnpm exec playwright test e2e/visual.spec.ts --update-snapshots
```

See [docs/testing.md](docs/testing.md) for current counts and commands.
