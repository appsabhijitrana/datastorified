# Decision Engine backend plan

Phase 2 runs entirely in the browser. Scores come from versioned TypeScript decision configurations, calculator outputs, rules, and weights. The interfaces in `packages/decision-engine/src/adapters` are the migration seam; frontend components must continue to depend on those contracts rather than transport details.

## Proposed services and endpoints

- `POST /api/decision/start`: create a cloud decision session after explicit sign-in or sync consent.
- `POST /api/decision/analyze`: execute a versioned decision configuration on trusted server inputs.
- `POST /api/decision/explain`: add an optional AI explanation to an already-computed deterministic result.
- `GET /api/decision/history`: list the current user's cloud decisions with cursor pagination.
- `POST /api/decision/sync`: idempotently merge local decisions using client IDs and update timestamps.
- `POST /api/decision/report`: render a durable PDF or share page from a stored result.

These endpoints are intentionally not implemented in Phase 2 Part 1.

## Data model

- `users`: identity-provider subject, status, locale, consent timestamps.
- `decision_definitions`: decision ID, schema version, published configuration, checksum, status.
- `decision_sessions`: public ID, user ID, decision ID/version, question text, state, created/updated timestamps.
- `decision_answers`: session ID, question ID, typed/encrypted value, answer timestamp. Sensitive values should be minimized or bucketed.
- `decision_results`: immutable metrics, factors, score, risk, recommendation, assumptions, engine version.
- `decision_scenarios`: result ID, changed inputs, comparison output, timestamps.
- `decision_reports`: result ID, storage key, format, expiry and access policy.
- `decision_events`: privacy-safe product events without raw financial inputs.
- `rule_audit_log`: definition version, actor, before/after diff, approval and publish timestamps.

Use row-level authorization, encryption in transit and at rest, retention controls, deletion workflows, and an explicit sensitive-data classification before production storage.

## Authentication and cloud sync

Authentication should remain optional. Add an API-backed `DecisionPersistenceAdapter` only after identity is available. On first opt-in, read local records through `LocalDecisionPersistenceAdapter`, upload them with their existing client IDs, and merge by `updatedAt`. Keep local data until the server confirms each ID. Conflicts should preserve both versions unless one is an exact ancestor.

## AI integration

AI remains downstream of deterministic analysis:

1. Run calculators, rules, weights, scoring, and risk first.
2. Send only the structured result and the minimum context required to `DecisionAIAdapter`.
3. Require the model to preserve numbers, cite the engine factors, and label uncertainty.
4. Never let generated prose modify the score or verdict.
5. Log model/provider/version and support a static explanation fallback.

Add redaction, prompt-injection defenses, cost controls, safety evaluation, and user disclosure before enabling external models.

## Knowledge data

An API-backed `DecisionKnowledgeAdapter` can later provide dated market data, interest-rate ranges, inflation data, and source metadata. Every value needs geography, effective date, source URL, refresh policy, and a stale-data fallback. User-entered assumptions must remain available when live data is unavailable.

## Admin rule editor

Build the editor around the existing `DecisionConfig` schema. It should support drafts, schema validation, simulator fixtures, two-person approval, immutable published versions, rollback, and an audit trail. A definition cannot publish unless unit fixtures and score-distribution checks pass.

## Analytics and privacy

Keep the current event names. Send decision IDs, question IDs, score bands, and input ranges only—never raw salaries, balances, free text, or report content. Add consent-aware routing, retention limits, deletion support, and monitoring for accidental sensitive payloads.

## Migration sequence

1. Keep local adapters as the default and add contract tests for future remote adapters.
2. Introduce optional authentication without changing anonymous behavior.
3. Add sync behind a feature flag and migrate copies, not destructive moves.
4. Add server-side deterministic analysis using the same package and version checksum.
5. Compare client/server results in shadow mode before trusting server output.
6. Add optional AI explanation and knowledge adapters after privacy and quality reviews.
7. Add report generation and admin publishing last, with audit and rollback controls.

This order preserves the offline, no-account product while allowing cloud capabilities to grow without rewriting the Part 1 UI.
