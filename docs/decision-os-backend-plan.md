# Decision OS backend plan

This document describes the backend implementation path for Decision OS without implementing it yet. The goal is to preserve the current local-first product while making it easy to add cloud sync, user profiles, AI explanations, and admin workflow management later.

## Current state

Today Decision OS is:

- frontend-driven;
- deterministic;
- plugin-based;
- local-storage backed;
- anonymous by default;
- backend-ready through adapter interfaces.

The UI and core engines should continue to depend on contracts, not direct storage or network calls.

## Backend goals

The backend should eventually provide:

- durable saved decisions;
- cross-device history;
- optional authenticated profile sync;
- server-side report retrieval;
- AI-generated explanations that do not affect scores;
- workflow publishing and administration;
- analytics and audit logging.

## Backend route contract

Reserved routes:

- `POST /api/decision/start`
- `POST /api/decision/save`
- `GET /api/decision/history`
- `GET /api/decision/:id`
- `POST /api/decision/sync`
- `POST /api/decision/explain`
- `GET /api/profile`
- `PATCH /api/profile`

Route responsibilities:

### `POST /api/decision/start`

Creates a cloud-backed decision session.

Expected use:

- save a starting point for an authenticated or opt-in anonymous session;
- return a server-generated session or decision ID;
- preserve the original workflow version and inputs.

### `POST /api/decision/save`

Persists a result or draft to the server.

Expected use:

- save the full report snapshot;
- store answer state and metadata;
- keep the local client copy valid until the server confirms success.

### `GET /api/decision/history`

Returns the user’s saved decisions and/or decision timeline.

Should support:

- cursor pagination;
- filters by workflow, plugin, and date;
- summary fields for fast rendering;
- optional `include=report` or similar expansion for detail views.

### `GET /api/decision/:id`

Returns a single decision record.

Should include:

- answers;
- report;
- workflow metadata;
- scenario state;
- profile snapshot used for the analysis, if relevant.

### `POST /api/decision/sync`

Merges local and cloud state.

Should be idempotent and support:

- client IDs;
- updated timestamps;
- conflict detection;
- merge metadata;
- retry-safe uploads.

### `POST /api/decision/explain`

Generates a natural-language explanation for a deterministic result.

Rules:

- explanation must not change the score;
- explanation should cite the inputs, risks, and recommendation;
- output should be safe to cache with the report snapshot when appropriate.

### `GET /api/profile`

Returns the current profile and completeness metadata.

### `PATCH /api/profile`

Updates profile fields and returns the merged profile.

## Storage model

The backend should use PostgreSQL with immutable report snapshots and versioned workflow definitions.

Suggested entities:

- users
- profiles
- workflow_definitions
- workflow_versions
- decision_sessions
- decision_answers
- decision_reports
- decision_scenarios
- decision_history
- decision_sync_jobs
- decision_explanations
- decision_audit_events

## PostgreSQL schema plan

### `users`

Stores identity-provider subject, account state, and auth metadata.

Fields:

- `id`
- `auth_provider`
- `auth_subject`
- `email`
- `display_name`
- `status`
- `created_at`
- `updated_at`

### `profiles`

Stores the canonical profile data.

Fields:

- `id`
- `user_id`
- profile fields such as age range, location, dependents, occupation, employment type, income, expenses, assets, liabilities, loans, goals, risk profile, experience, currency, and language
- `completeness_score`
- `completeness_band`
- `updated_at`

### `workflow_definitions`

Stores plugin-level workflow metadata.

Fields:

- `id`
- `plugin_id`
- `slug`
- `title`
- `category`
- `description`
- `status`
- `created_at`
- `updated_at`

### `workflow_versions`

Stores versioned workflow config.

Fields:

- `id`
- `workflow_definition_id`
- `version`
- `checksum`
- `config_json`
- `published_at`
- `published_by`
- `created_at`

### `decision_sessions`

Stores the active or completed analysis session.

Fields:

- `id`
- `user_id` nullable for anonymous sync-backed flows
- `workflow_version_id`
- `plugin_id`
- `workflow_slug`
- `status`
- `created_at`
- `updated_at`

### `decision_answers`

Stores answer snapshots for a session.

Fields:

- `id`
- `session_id`
- `question_id`
- `value_json`
- `value_type`
- `created_at`
- `updated_at`

### `decision_reports`

Stores immutable computed outcomes.

Fields:

- `id`
- `session_id`
- `workflow_version_id`
- `score_json`
- `risk_json`
- `recommendation_json`
- `action_plan_json`
- `facts_json`
- `generated_at`

### `decision_scenarios`

Stores scenario overrides and scenario comparisons.

Fields:

- `id`
- `report_id`
- `scenario_id`
- `scenario_json`
- `before_score`
- `after_score`
- `delta_score`
- `created_at`

### `decision_history`

Stores user-facing history rows and lightweight summaries.

### `decision_sync_jobs`

Tracks sync operations, retry state, and conflicts.

### `decision_explanations`

Stores AI or static explanation text tied to a report.

### `decision_audit_events`

Stores publish, edit, sync, and access audit records.

## Auth plan

The backend should support staged authentication:

1. anonymous-first local usage;
2. optional sign-in for sync and cross-device history;
3. account linking for future cloud profile support;
4. role-based admin access for workflow editing.

Auth implementation should support:

- session cookies or token-based auth;
- CSRF protection if cookie-based;
- rate limits on explain and sync endpoints;
- privacy-aware logs and audit trails.

## Sync plan

Sync should bridge local storage and cloud records without breaking offline use.

Proposed flow:

1. User opts into sync.
2. Local decisions and drafts are uploaded with existing IDs.
3. Server responds with accepted records and conflicts.
4. UI updates local state only after server confirmation.
5. On conflicts, preserve both versions when automatic merge is unsafe.

Recommended sync fields:

- client record ID;
- workflow ID and version;
- device ID;
- updated timestamp;
- base revision or ancestor ID;
- conflict resolution status.

## AI integration plan

AI should remain a presentation layer on top of deterministic computation.

Backend responsibilities:

- accept a structured report and profile context;
- generate explanation text or follow-up help;
- enforce rate limits and redaction;
- record model, prompt version, and response metadata;
- provide a deterministic fallback when the model is unavailable.

Do not let AI:

- recalculate the score;
- alter recommendations directly;
- invent values that are not present in the report;
- override workflow configuration.

## Plugin loading on the backend

Backend plugin loading should mirror the frontend.

Recommended approach:

- workflow definitions are checked in as TypeScript or JSON config;
- a build step compiles them into a registry;
- the backend reads the same workflow schema used by the frontend;
- published versions are immutable and addressable by checksum.

## Admin editor plan

The admin editor should be a protected internal surface that can:

- create and edit plugins;
- create and edit workflows;
- simulate answers and scenario overrides;
- preview score, risks, recommendations, and action plans;
- validate schema and required fields;
- compare versions;
- publish or rollback workflows;
- audit every change.

Suggested admin roles:

- editor
- reviewer
- publisher
- auditor

## Suggested implementation order

1. Implement read-only history and profile endpoints.
2. Add save and start endpoints with deterministic report payloads.
3. Add sync with conflict handling.
4. Add AI explanation behind a feature flag.
5. Add admin workflow publishing and rollback.
6. Add analytics and audit exports last.

## Non-goals for the first backend release

- no change to the client-side deterministic scoring;
- no forced login for basic use;
- no AI dependency in scoring or routing;
- no migration away from local-first behavior.
