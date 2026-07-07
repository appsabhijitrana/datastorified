# Decision OS

Decision OS is DataStorified’s category-neutral decision framework. It turns a user’s plain-language question into a structured workflow, asks only the questions that matter, scores the decision transparently, surfaces risks, suggests an action plan, and lets the user explore scenarios without changing the original answers.

The system is intentionally frontend-first and backend-ready:

- the core engines are deterministic TypeScript;
- workflows are config-driven and plugin-owned;
- local-first memory works without login;
- adapters isolate browser storage today and cloud services later;
- backend APIs can be introduced without rewriting the UI.

## Architecture overview

Decision OS is split into layers:

1. Intent engine

   Detects which workflow best matches the user’s text.

2. Question engine

   Decides which questions should be visible based on workflow config and prior answers.

3. Rule engine

   Evaluates configured conditions against answers and derived facts.

4. Weight engine

   Converts workflow weights into normalized factor weights.

5. Score engine

   Produces a 0–100 score and factor contributions.

6. Risk engine

   Converts matched risks into a user-readable risk list.

7. Recommendation engine

   Selects the best recommendation template for the score and context.

8. Scenario engine

   Recalculates the report when a user changes one or more scenario variables.

9. Report engine

   Packages the score, risks, recommendation, and action plan into a single report object.

10. Memory and adapters

    Store drafts, saved decisions, recent decisions, and profile data locally today; swap to cloud-backed adapters later.

## Core design rules

- Category-neutral: the core does not know finance, career, property, travel, shopping, automobile, education, or business specifics.
- Config-driven: workflows define questions, rules, weights, scenarios, risks, and recommendations.
- No hardcoded decision logic in the UI: the UI renders whatever the workflow config says.
- Adding a new decision should mean adding or updating workflow config, not changing engine code.

## Workflow model

Each workflow is a data object with these main parts:

- identity: `id`, `slug`, `pluginId`, `version`, `title`, `category`, `description`, `aliases`;
- intent hints: keywords, aliases, and examples for search and text detection;
- questions: ordered prompts with types, validation, defaults, visibility rules, and helper text;
- rules: condition groups that affect score, risk, and explanation;
- weights: factor-level importance values;
- recommendations: score bands and context-sensitive guidance;
- risks: reusable risk templates and mitigation text;
- action plan templates: next steps associated with score bands;
- scenario controls: variables that users can change in the simulator;
- assumptions and FAQs: plain-language caveats and answerable questions;
- related calculators and tools: supporting utilities in the wider product.

## Workflow schema

The current TypeScript schema lives in `packages/decision-os/src/types.ts`. At a high level:

```ts
type DecisionWorkflow = {
  id: string;
  slug: string;
  pluginId: string;
  version: string;
  title: string;
  category?: string;
  description: string;
  aliases?: string[];
  intent: {
    keywords: string[];
    aliases?: string[];
    examples?: string[];
  };
  questions: DecisionQuestion[];
  rules: DecisionRule[];
  weights: DecisionWeight[];
  recommendations: DecisionRecommendation[];
  riskFactors?: DecisionRisk[];
  actionPlanTemplates?: DecisionActionPlanTemplate[];
  relatedCalculators?: string[];
  relatedTools?: string[];
  assumptions?: string[];
  faqs?: DecisionFaq[];
  scenarios?: DecisionScenario[];
  scenarioVariables?: DecisionScenarioVariable[];
  scoreBands?: Array<{ min: number; max: number; label: string }>;
  deriveFacts?: (answers) => DecisionFacts;
};
```

Question types currently supported include:

- text
- number
- boolean
- currency
- percentage
- select
- slider
- duration
- single-select
- multi-select
- date

## Rule engine

Rules are deterministic conditions over answers or derived facts.

The engine:

- evaluates the workflow’s `deriveFacts()` output, if provided;
- merges raw answers and derived facts into a single fact set;
- checks each rule’s `when` conditions;
- marks rules as matched or unmatched;
- feeds matched rules into scoring, risk extraction, and recommendation selection.

Rules should remain:

- human-readable;
- testable in isolation;
- stable across UI changes;
- independent of any backend storage format.

## Scoring method

The score is intentionally explainable:

- each workflow defines weighted factors;
- each factor has a contribution based on answers and rule outcomes;
- the weight engine normalizes factor weights so the total stays comparable;
- the score engine aggregates factor contributions into a 0–100 value;
- score bands provide a label such as “Proceed”, “Consider carefully”, or “Pause”.

The score is not a prediction engine. It is a structured summary of how well the current answers satisfy the configured decision model.

## Risk engine

The risk engine converts matched rules and configured risk templates into a compact list of decision risks.

Each risk should ideally include:

- id
- title
- description
- severity
- source rule, if relevant
- mitigation suggestion

Risks are surfaced independently from the score so the user can see both “what went wrong” and “what to do next”.

## Recommendation engine

Recommendations are chosen from workflow templates using the score and any contextual rule matches.

The recommendation should answer:

- what the current result means;
- whether the decision is generally favorable;
- what the next practical step is.

The recommendation engine must never rewrite the score. It only interprets the deterministic output.

## Profile and personalization

Decision OS supports progressive profile enrichment:

- anonymous users: Basic Analysis;
- local profile users: Better Analysis;
- future logged-in users with cloud history: Advanced Analysis.

The profile model includes fields such as age range, city, state, country, dependents, occupation, employment type, income, expenses, emergency fund, assets, liabilities, loans, goals, risk profile, experience, currency, and language.

The profile layer should:

- estimate completeness;
- suggest the next best field to collect;
- improve recommendations without blocking the user;
- keep the experience anonymous by default.

## Local-first storage

Decision OS memory is local-first and anonymous:

- recent decisions;
- saved decisions;
- drafts;
- answers;
- result reports;
- last opened workflow.

Key browser storage buckets:

- `ds.decision.recent`
- `ds.decision.saved`
- `ds.decision.drafts`
- `ds.decision.history`
- `ds.decision.profile.local`

Storage must degrade gracefully if `localStorage` is unavailable.

## Future backend API routes

These routes are reserved for the cloud-ready backend:

- `POST /api/decision/start`
- `POST /api/decision/save`
- `GET /api/decision/history`
- `GET /api/decision/:id`
- `POST /api/decision/sync`
- `POST /api/decision/explain`
- `GET /api/profile`
- `PATCH /api/profile`

These routes should consume and return the same workflow, answer, report, and profile structures used by the frontend adapters.

## PostgreSQL schema plan

Suggested tables:

- `users`
- `decision_profiles`
- `decision_workflows`
- `decision_sessions`
- `decision_answers`
- `decision_reports`
- `decision_scenarios`
- `decision_saves`
- `decision_history`
- `decision_sync_states`
- `decision_ai_explanations`
- `decision_events`
- `decision_audit_log`

Important columns and constraints:

- use UUID primary keys;
- store workflow and plugin identifiers explicitly;
- keep immutable report snapshots;
- record `created_at`, `updated_at`, and `deleted_at` where applicable;
- version workflow definitions;
- keep sync metadata such as client ID, revision, and conflict status;
- store PII carefully and only when the product has explicit consent and a real need.

## Auth plan

Authentication is intentionally optional at first.

Planned progression:

1. Anonymous by default.
2. Optional account creation for syncing history and profile.
3. Session/user identity only when the user opts in.
4. Future cloud history merged with local storage by timestamp and client ID.

Auth should not be required for:

- starting a decision;
- saving locally;
- resuming drafts;
- reviewing a result on the current device.

## Sync plan

Sync should be additive and non-destructive:

- local state remains the source of truth until upload succeeds;
- server-side copies use the same decision IDs and timestamps;
- conflicts should preserve both versions if automatic resolution is unsafe;
- sync must support retries and idempotency.

Recommended sync behavior:

- local draft changes are saved immediately;
- saved decisions can later be uploaded;
- server can return a merged state or a conflict payload;
- UI should always remain usable offline.

## AI integration plan

AI must stay downstream of deterministic computation:

1. Build the report deterministically.
2. Send only the minimum structured context to the AI layer.
3. Generate explanation text, not numeric outcomes.
4. Keep AI outputs clearly labeled as generated assistance.
5. Fall back to a static explanation if AI is unavailable.

AI should be used for:

- plain-language explanation of a result;
- follow-up questions;
- action-plan refinement;
- optional summary generation.

AI should not be used for:

- scoring;
- rule evaluation;
- workflow routing;
- replacing deterministic recommendation logic.

## Admin editor plan

The admin editor should let internal editors manage workflows safely.

Must-haves:

- draft and published states;
- schema validation;
- workflow simulation;
- score preview;
- rule and weight editing;
- FAQ and assumption editing;
- version history;
- rollback;
- audit trail;
- approval workflow for publication.

The editor should work from the same workflow schema used by the runtime so there is one source of truth.

## Adding a new workflow

To add a new decision:

1. Create a plugin folder under `packages/decision-os/src/plugins/<domain>/`.
2. Export the plugin metadata and workflows from that plugin’s `index.ts`.
3. Define workflows with questions, rules, weights, recommendations, scenarios, assumptions, and FAQs.
4. Register the plugin in the static plugin registry.
5. Add tests for intent detection, scoring, recommendation selection, and scenario recalculation.
6. Verify the workflow in the UI with search, question flow, result page, and scenario simulator.

If a workflow needs a new question type or engine behavior, prefer extending the generic schema and engine once rather than adding domain-specific branches.
