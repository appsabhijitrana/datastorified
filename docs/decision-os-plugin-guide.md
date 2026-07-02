# Decision OS plugin guide

This guide explains how to add a new Decision OS plugin and workflow set.

Plugins are the unit of domain expansion. Each plugin owns a group of related workflows, such as finance, property, automobile, career, education, shopping, travel, or business.

## What a plugin contains

A Decision OS plugin should export:

- plugin id
- plugin name
- categories
- workflows
- keywords
- related calculators
- related tools
- knowledge assumptions

The plugin registry uses this metadata to discover workflows from text queries and route users to the right decision flow.

## Folder structure

Use one folder per domain:

```txt
packages/decision-os/src/plugins/
  finance/
  property/
  automobile/
  career/
  education/
  shopping/
  travel/
  business/
```

Each plugin folder should have at least:

```txt
index.ts
workflows.ts
```

You may also add helpers when a domain has several workflows or shared formula utilities.

## Minimal plugin contract

The plugin object should look like this:

```ts
type DecisionPlugin = {
  id: string;
  name: string;
  version: string;
  description?: string;
  categories: string[];
  keywords: string[];
  relatedCalculators: string[];
  relatedTools: string[];
  knowledgeAssumptions: Array<{
    id: string;
    description: string;
  }>;
  workflows: DecisionWorkflow[];
  metadata?: Record<string, string>;
};
```

## Workflow contract

Each workflow should include:

- id
- slug
- title
- category
- description
- aliases
- questions
- rules
- weights
- risk factors
- recommendation templates
- action plan templates
- related calculators
- related tools
- assumptions
- FAQs

Scenario support is strongly recommended:

- `scenarios` for preset “what if” options;
- `scenarioVariables` for live slider/chip controls.

## Adding a new plugin

### 1. Create the folder

Example:

```txt
packages/decision-os/src/plugins/retirement/
```

### 2. Define workflows first

Focus on the workflow config before any UI work.

Recommended workflow contents:

- title and slug that match user language;
- questions that can be answered without jargon;
- rules that map directly to visible advice;
- weights that reflect the relative importance of each factor;
- recommendation templates for score bands;
- scenario variables for the most sensitive inputs;
- assumptions that explain what is and is not modelled.

### 3. Export the plugin object

```ts
export const retirementPlugin: DecisionPlugin = {
  id: "retirement",
  name: "Retirement",
  version: "1.0.0",
  categories: ["retirement"],
  keywords: ["retire", "retirement", "pension", "401k"],
  relatedCalculators: [],
  relatedTools: [],
  knowledgeAssumptions: [
    { id: "market-volatility", description: "Returns are scenarios, not guarantees." },
  ],
  workflows: [/* ... */],
};
```

### 4. Register it in the static registry

Import the plugin in the plugin index and add it to the registry bootstrap list.

The registry should remain static for now. That keeps builds predictable and avoids backend dependency during frontend development.

### 5. Add tests

At minimum, test:

- plugin registration;
- workflow slug lookup;
- workflow search by text;
- intent detection from user phrasing;
- scoring and recommendation generation for at least one complete workflow;
- scenario recalculation if the workflow includes scenarios.

## Writing good workflow metadata

Use user language, not internal finance jargon.

Good:

- “Should I buy a house?”
- “Should I switch jobs?”
- “Should I invest in SIP or FD?”

Less good:

- “Housing acquisition decision framework”
- “Employment mobility optimization”

Aim for keywords and aliases that cover how users actually ask the question.

## Question design rules

- Ask only what the workflow truly needs.
- Prefer a small set of high-signal questions.
- Use `currency`, `percentage`, `number`, `select`, `boolean`, `slider`, `duration`, and `text` types for clarity.
- Provide helper text for numbers that could be misunderstood.
- Use `visibleWhen` to hide follow-up questions until they matter.
- Keep validation explicit so invalid input is easy to test.

## Rule design rules

- Each rule should map to one understandable idea.
- Keep rule text explainable to a non-technical user.
- Use risk severity only when it helps the recommendation.
- Avoid duplicating the same logic in multiple rules unless the workflow genuinely needs it.

## Scenario design rules

Scenario controls should target the most sensitive variables.

Examples:

- buy-house: property price, down payment, interest rate, tenure, monthly income
- sip-vs-fd: monthly investment, expected return, inflation, time horizon
- ev-vs-petrol: monthly kilometers, fuel price, electricity cost, vehicle price difference
- job-switch: salary increase, commute time, job stability, emergency fund months

Scenario adjustments must never mutate the original answers. They should only create a preview report.

## Knowledge assumptions

Use knowledge assumptions for the static facts the workflow relies on.

Examples:

- returns are scenarios, not guarantees;
- lender rates can change;
- local taxes and fees vary;
- work offers can change before joining.

These assumptions should appear in the UI and be available to the backend knowledge adapter later.

## Review checklist before merging a plugin

- Workflow slug is unique.
- Intent keywords reflect user language.
- Questions are clear and minimal.
- Rules are deterministic and explainable.
- Score and recommendation are produced.
- Scenario controls update the preview live.
- FAQs answer the most likely objections.
- Related calculators and tools are populated.
- The workflow works on mobile without overflow.

## Example mapping for a finance plugin

One plugin can contain several workflows:

- `sip-vs-fd`
- `emergency-fund`
- `loan-prepayment`

The plugin itself should describe the overall domain and its shared assumptions. Each workflow should stay focused on one decision.

## When to extend the core

Extend the generic engine only when a new workflow genuinely needs a new capability, such as:

- a new question type;
- a new condition operator;
- a new scenario input mode;
- a new risk or recommendation structure.

If the need is only domain-specific wording or thresholds, keep it in plugin config.
