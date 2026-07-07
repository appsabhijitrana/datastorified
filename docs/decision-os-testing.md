# Decision OS testing

This document explains how to test Decision OS today and how to keep it safe as the backend arrives later.

## Test layers

Decision OS should be covered at four levels:

1. Unit tests for the deterministic engines and adapters.
2. Integration tests for workflow plugins and storage helpers.
3. Playwright tests for user flows in the website.
4. Snapshot tests for layout stability on desktop and mobile.

## Unit test coverage

Core engine coverage should include:

- intent engine
- plugin registry
- question engine
- rule engine
- weight engine
- score engine
- risk engine
- recommendation engine
- scenario engine
- profile completeness
- local storage adapters

Why these matter:

- intent determines whether the right workflow opens;
- question visibility prevents dead-end forms;
- rules and weights make the score explainable;
- score and risk drive the report;
- recommendation selection determines the final guidance;
- scenario recalculation preserves the original answer set;
- storage adapters protect local-first memory and future backend seams;
- profile completeness drives personalization without forcing login.

## Recommended unit test cases

### Intent engine

- exact match for a workflow title;
- alias match;
- typo-tolerant match if supported by the current engine;
- no match for unrelated text;
- best-match ranking when multiple workflows are similar.

### Plugin registry

- register a plugin;
- reject duplicate plugin IDs;
- reject duplicate workflow IDs;
- reject duplicate workflow slugs;
- lookup by slug;
- search workflows by query;
- detect workflow from natural language.

### Question engine

- visible questions on an empty answer set;
- hidden follow-up questions until their conditions are met;
- default values;
- required/optional behavior;
- question ordering stays stable.

### Rule engine

- condition groups with `all`;
- condition groups with `any`;
- numeric comparisons;
- boolean comparisons;
- rule evaluation with derived facts.

### Weight engine

- weights normalize correctly;
- zero-weight or missing-weight cases behave safely;
- factor contribution stays explainable.

### Score engine

- score returns a value between 0 and 100;
- factor contributions sum as expected;
- score band labels are correct;
- changing answers changes the score deterministically.

### Risk engine

- matched rules become risks;
- severity maps correctly;
- mitigation text is preserved;
- duplicate risks are not surfaced twice.

### Recommendation engine

- score band selects the right recommendation;
- contextual rules can refine the choice;
- fallback recommendation exists when no template matches.

### Scenario engine

- scenario overrides merge with original answers;
- original answers remain unchanged;
- scenario report recalculates score and recommendation;
- reset returns to the base report.

### Profile completeness

- empty profile yields low completeness;
- partial profile detects missing fields;
- next-best field suggestion is meaningful;
- completeness improves as fields are added.

### Local storage adapters

- save/load decision;
- save/load draft;
- save/load profile;
- graceful fallback when `localStorage` is unavailable;
- limits for recent, saved, and draft collections;
- delete behavior.

## Playwright coverage

The browser suite should verify:

1. Homepage loads.
2. User searches “buy house”.
3. Buy-house workflow opens.
4. User answers questions.
5. Score appears.
6. Recommendation appears.
7. Scenario simulator changes score.
8. User saves locally.
9. Reload preserves saved decision.
10. Saved decision page loads.

Additional coverage should include:

- SIP vs FD workflow;
- EV vs Petrol workflow;
- Job Switch workflow;
- mobile viewport rendering;
- no horizontal overflow;
- empty states;
- invalid input states.

## Visual regression coverage

Use screenshot baselines for:

- website homepage;
- calculators homepage;
- tools homepage;
- other key public surfaces when layout changes are likely.

Always review screenshot changes before updating baselines. If the change is intentional, update snapshots in the same PR so the visual history stays trustworthy.

## Useful commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

For targeted Decision OS checks:

```bash
pnpm test packages/decision-os
pnpm exec playwright test e2e/decision-os.spec.ts
pnpm exec playwright test e2e/visual.spec.ts --update-snapshots
```

## Backend-era test additions

When backend routes are introduced, add tests for:

- API route contracts;
- authentication gating;
- profile patching;
- sync conflict handling;
- report fetch by ID;
- AI explanation fallback;
- admin workflow publish/rollback;
- audit log creation.

## What good looks like

A healthy Decision OS test suite should prove that:

- workflows are discoverable from real user text;
- the same answers always produce the same report;
- scenario previews don’t mutate base answers;
- local storage survives reloads;
- mobile users can finish the flow comfortably;
- invalid input is rejected clearly;
- new plugins can be added without core engine changes.
