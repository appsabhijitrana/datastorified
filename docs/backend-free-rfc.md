# DataStorified backend RFC: free-tier-first architecture

## Goal

Prepare a backend for DataStorified using only free services.

The backend should support:

- anonymous users by default;
- local-first usage on first load;
- optional Google sign-in;
- saved history and profile sync for logged-in users;
- deterministic decision/session records;
- future-safe API and database design;
- no paid dependencies.

## Hard constraints

Allowed:

- Vercel Hobby
- Neon Free PostgreSQL
- Prisma
- Better Auth
- Google OAuth
- GA4 free
- LocalStorage
- Next.js Route Handlers

Not allowed:

- SMS OTP
- paid AI APIs
- Redis
- paid email
- paid file storage
- queues
- VPS
- paid analytics

## Non-goals

This RFC does not include:

- custom mobile apps;
- background jobs;
- real-time collaboration;
- paid observability tools;
- multi-region active-active architecture;
- offline sync with conflict resolution beyond simple merge rules.

## Proposed architecture

Use a single Next.js app deployed on Vercel Hobby with:

- Route Handlers for API endpoints;
- Prisma as the database access layer;
- Neon Free PostgreSQL as the managed database;
- Better Auth for Google OAuth-based login;
- GA4 for lightweight product analytics;
- browser LocalStorage for anonymous local-first memory.

### Request path

1. User arrives anonymously.
2. App uses local storage for drafts, recent decisions, and saved copies.
3. If the user signs in with Google, the app enables server persistence.
4. Local data is synced to the server through API routes.
5. The UI keeps working if the server is unavailable.

### Core principle

Local-first always comes first. The backend is an enhancement layer, not a requirement for basic product use.

## Package structure

Keep the backend implementation inside the existing monorepo with clear separation:

```txt
apps/website/
  app/api/
    auth/
    decision/
    profile/
  lib/
    auth/
    db/
    decision/
    sync/

packages/
  decision-os/
  profile/
  storage/
  backend/
    src/
      auth/
      db/
      decision/
      profile/
      sync/
      analytics/
      utils/
```

Suggested package responsibilities:

- `packages/decision-os`: deterministic engines, plugins, workflows, adapters.
- `packages/profile`: profile schema, completeness, local profile utilities.
- `packages/storage`: shared local-first storage helpers.
- `packages/backend`: shared backend business logic and DB repository functions.
- `apps/website/app/api/*`: thin route handlers that call backend package functions.

### Why this split works

- the UI stays thin;
- business logic is not duplicated in route handlers;
- Prisma queries are centralized;
- auth and sync rules are testable without Next.js internals;
- future backend extraction is easier.

## API routes

### Auth

- `GET /api/auth/*`
- Better Auth handles the auth route surface.

### Decision routes

- `POST /api/decision/start`
- `POST /api/decision/save`
- `GET /api/decision/history`
- `GET /api/decision/:id`
- `POST /api/decision/sync`
- `POST /api/decision/explain`

### Profile routes

- `GET /api/profile`
- `PATCH /api/profile`

### Notes on route behavior

- `POST /api/decision/start`
  - creates a server session or decision record;
  - accepts anonymous or authenticated context;
  - stores workflow ID, workflow version, plugin ID, and initial answers.

- `POST /api/decision/save`
  - stores a report snapshot plus answers and metadata;
  - works for authenticated users and optionally for anonymous local-to-cloud sync later.

- `GET /api/decision/history`
  - returns a paginated summary list;
  - keeps payloads small;
  - can expand to detailed report fetch if needed.

- `GET /api/decision/:id`
  - returns a complete saved decision by ID.

- `POST /api/decision/sync`
  - merges local records with server records;
  - should be idempotent;
  - should return accepted IDs and conflict IDs.

- `POST /api/decision/explain`
  - produces a text explanation for an already computed report;
  - must not change score or recommendation.

- `GET /api/profile`
  - returns the current user profile and completeness metadata.

- `PATCH /api/profile`
  - updates profile fields partially.

## Database schema

Use Prisma with PostgreSQL.

### Recommended tables

- `User`
- `Account`
- `Session`
- `Profile`
- `DecisionWorkflow`
- `DecisionWorkflowVersion`
- `DecisionSession`
- `DecisionAnswer`
- `DecisionReport`
- `DecisionScenario`
- `DecisionHistory`
- `DecisionSyncState`
- `DecisionExplanation`
- `AuditEvent`

### Table purposes

#### `User`

Stores auth identity and basic account data.

Fields:

- `id`
- `name`
- `email`
- `image`
- `createdAt`
- `updatedAt`

#### `Account`

Stores Better Auth provider linkage.

Fields:

- `id`
- `userId`
- `provider`
- `providerAccountId`
- `accessToken` if needed for Google OAuth session linkage
- `createdAt`
- `updatedAt`

#### `Session`

Stores the user session state.

#### `Profile`

Stores canonical profile fields:

- age range
- city
- state
- country
- dependents
- occupation
- employment type
- monthly income
- monthly expenses
- emergency fund
- assets
- liabilities
- active loans
- monthly EMIs
- goals
- risk profile
- investment experience
- preferred currency
- preferred language

Also store:

- completeness score;
- completeness band;
- next best field hint;
- updated timestamps.

#### `DecisionWorkflow`

Stores the stable workflow identifier and plugin metadata.

Fields:

- `id`
- `pluginId`
- `slug`
- `title`
- `category`
- `version`
- `checksum`
- `status`

#### `DecisionWorkflowVersion`

Stores immutable workflow config versions.

Fields:

- `id`
- `workflowId`
- `version`
- `configJson`
- `publishedAt`
- `publishedBy`

#### `DecisionSession`

Represents one analysis instance.

Fields:

- `id`
- `userId` nullable for anonymous sessions
- `workflowVersionId`
- `pluginId`
- `workflowSlug`
- `source` (`local`, `server`, `synced`)
- `status`
- `createdAt`
- `updatedAt`

#### `DecisionAnswer`

Stores answer snapshots by question.

Fields:

- `id`
- `decisionSessionId`
- `questionId`
- `valueJson`
- `valueType`
- `createdAt`
- `updatedAt`

#### `DecisionReport`

Stores immutable report output.

Fields:

- `id`
- `decisionSessionId`
- `scoreJson`
- `riskJson`
- `recommendationJson`
- `actionPlanJson`
- `factsJson`
- `generatedAt`

#### `DecisionScenario`

Stores scenario overrides and before/after comparisons.

#### `DecisionHistory`

Stores lightweight rows for history listing.

Fields:

- `id`
- `userId`
- `decisionSessionId`
- `workflowSlug`
- `title`
- `summary`
- `score`
- `updatedAt`

#### `DecisionSyncState`

Tracks sync progress and conflict markers.

Fields:

- `id`
- `userId`
- `deviceId`
- `clientRecordId`
- `serverRecordId`
- `status`
- `updatedAt`

#### `DecisionExplanation`

Stores generated explanation text and metadata.

#### `AuditEvent`

Stores internal edits and publish events for traceability.

### Prisma modeling notes

- keep reports immutable;
- version workflow definitions;
- use JSON columns for report and workflow payloads;
- index `userId`, `workflowSlug`, `updatedAt`, and `status`;
- store client IDs for sync idempotency;
- prefer explicit foreign keys for the main record chain.

## Auth flow

Use Better Auth with Google OAuth only.

### Anonymous flow

1. User opens the app.
2. LocalStorage holds drafts, recent decisions, and saved local copies.
3. No server account is required.
4. User can still use Decision OS completely.

### Logged-in flow

1. User clicks sign in.
2. Better Auth redirects to Google OAuth.
3. On return, the app gets a session.
4. The app enables server-backed history and profile sync.
5. Local records are merged or uploaded through the sync route.

### Important auth constraints

- no SMS OTP;
- no password database;
- no paid email dependency;
- no forced login wall for the core product;
- no blocking of anonymous use.

## Local-first sync

The sync strategy should be simple and durable for free infra.

### Local state buckets

- recent decisions
- saved decisions
- drafts
- answers
- result reports
- last opened workflow
- local profile

### Sync strategy

1. Save locally first.
2. Queue a best-effort sync attempt in memory or on user action, not in a background queue.
3. Upload only when the user is signed in or explicitly opts in.
4. Merge by record ID and `updatedAt`.
5. Return conflicts when the server cannot safely auto-merge.

### Conflict policy

Use a simple policy:

- newer timestamp wins for clearly equivalent edits;
- preserve both versions when records diverge materially;
- let the UI surface conflict resolution instead of auto-deleting data.

### What sync should not do

- no Redis-backed job orchestration;
- no background queue processing;
- no cross-device auto-merge that silently drops user changes.

## Anonymous user flow

Anonymous users should have the full product experience:

- search a decision;
- answer questions;
- see score, risk, recommendation, and action plan;
- use scenario simulator;
- save locally;
- reopen saved decisions;
- resume drafts after reload.

Anonymous data lives in LocalStorage and optionally in browser-managed state.

If the user later signs in:

- local data can be uploaded;
- the server can create a remote copy;
- history can be preserved.

## Logged-in user flow

Logged-in users get a superset of anonymous behavior:

- server-backed history;
- profile sync;
- cross-device saves;
- future advanced personalization;
- optional AI explanations.

Recommended UX:

1. User signs in with Google.
2. App asks whether to sync existing local decisions.
3. App uploads local decisions and profile.
4. App continues using local storage as the offline cache.
5. Server becomes the durable source for account-linked records.

## Deployment environment variables

### Vercel

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_GA4_ID`
- `NEXTAUTH_URL` or the Better Auth equivalent callback base
- `AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `DATABASE_URL`
- `DIRECT_URL` if needed by Prisma

### Prisma / Neon

- `DATABASE_URL`
- optional direct connection string for migrations

### Analytics

- `NEXT_PUBLIC_GA4_ID`

### General

- `NODE_ENV`
- `NEXT_PUBLIC_ENVIRONMENT`
- feature flags for sync and explain endpoints

## Limitations of free infra

Free infra is enough for a strong MVP, but we should be honest about its limits.

### Vercel Hobby

- limited build and execution budgets;
- not ideal for heavy background processing;
- not ideal for large file or report generation workloads;
- should host thin route handlers, not long-running jobs.

### Neon Free PostgreSQL

- resource limits;
- sleep or throughput constraints may apply;
- not ideal for high-volume reporting or complex analytics.

### Better Auth + Google OAuth

- supports sign-in well;
- does not replace enterprise identity or multi-provider complexity;
- login is only for account-linked functionality.

### GA4 free

- suitable for broad product analytics;
- not suitable for sensitive event logging;
- must avoid sending personal or decision-specific raw data.

### No paid storage, queue, or email services

Because of the hard constraints, the backend should not depend on:

- async job queues;
- durable object/file storage;
- background report workers;
- transactional email workflows;
- SMS or OTP-based auth recovery.

## Implementation sequence

Recommended rollout:

1. Add Prisma schema and database connection.
2. Implement Better Auth with Google OAuth.
3. Add read-only profile and decision history APIs.
4. Add save, get, and sync decision endpoints.
5. Add local-first merge logic in the UI.
6. Add explanation route using static or optional AI integration.
7. Add GA4 events for coarse-grained product analytics.

## Suggested development principles

- Keep anonymous use first-class.
- Never make login mandatory for core decision workflows.
- Keep report generation deterministic.
- Keep sync additive and reversible.
- Keep backend routes thin.
- Keep workflow config versioned.
- Keep analytics privacy-safe.

## Open questions

These should be answered before implementation:

- Should anonymous local decisions be upgradable to cloud records one-by-one or in bulk?
- Should synced profiles overwrite local profiles immediately or merge field-by-field?
- Should decision history include private drafts or only saved results?
- Should explanations be generated on demand or cached after first request?
- Should admin workflow publishing happen in the website app or in a separate internal surface?

## Summary

This RFC outlines a backend that fits the product’s current shape and its cost constraints:

- one Next.js app;
- one free PostgreSQL database;
- one OAuth provider;
- deterministic Decision OS logic shared with the frontend;
- local-first memory as the default;
- cloud features only when the user opts in.

That gives DataStorified a realistic backend path without introducing paid services or operational complexity too early.
