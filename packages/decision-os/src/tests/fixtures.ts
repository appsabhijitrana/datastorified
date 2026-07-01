import type { DecisionWorkflow } from "../types";

export const workflow: DecisionWorkflow = {
  id: "workspace-choice",
  slug: "workspace-choice",
  pluginId: "test-plugin",
  version: "1.0.0",
  title: "Choose a workspace",
  description: "Compare workspace options from user-provided preferences.",
  intent: {
    keywords: ["workspace", "remote", "office", "team"],
    aliases: ["choose a workspace", "remote or office"],
    examples: ["should I work remotely or in an office"],
  },
  questions: [
    { id: "workStyle", prompt: "Preferred work style", type: "single-select", required: true, options: [{ label: "Solo", value: "solo" }, { label: "Team", value: "team" }] },
    { id: "collaboration", prompt: "Collaboration frequency", type: "number", visibleWhen: { all: [{ fact: "workStyle", operator: "equals", value: "team" }] } },
    { id: "experience", prompt: "Prior experience", type: "single-select", required: true },
  ],
  weights: [
    { factorId: "fit", label: "Fit", weight: 60, baselineScore: 50 },
    { factorId: "readiness", label: "Readiness", weight: 40, baselineScore: 50 },
  ],
  rules: [
    { id: "team-fit", description: "Team preference improves this option's fit.", when: { all: [{ fact: "workStyle", operator: "equals", value: "team" }] }, factorId: "fit", scoreEffect: { operation: "add", value: 20 } },
    { id: "experienced", description: "Prior experience improves readiness.", when: { all: [{ fact: "experience", operator: "equals", value: "high" }] }, factorId: "readiness", scoreEffect: { operation: "add", value: 30 } },
    { id: "inexperienced", description: "Limited experience lowers readiness.", when: { all: [{ fact: "experience", operator: "equals", value: "low" }] }, factorId: "readiness", scoreEffect: { operation: "subtract", value: 30 }, risk: { id: "experience-gap", title: "Experience gap", description: "The selected option may require preparation.", severity: "medium", mitigation: "Run a small trial first." } },
  ],
  scoreBands: [
    { min: 0, max: 49.99, label: "Weak fit" },
    { min: 50, max: 100, label: "Viable fit" },
  ],
  recommendations: [
    { id: "reconsider", minScore: 0, maxScore: 49.99, title: "Reconsider", summary: "Address the largest gaps first.", actions: ["Run a trial"] },
    { id: "proceed", minScore: 50, maxScore: 100, title: "Proceed carefully", summary: "The inputs support a trial.", actions: ["Define success criteria"] },
  ],
  scenarios: [{ id: "more-experience", label: "With more experience", overrides: { experience: "high" } }],
};

export const learningWorkflow: DecisionWorkflow = {
  ...workflow,
  id: "learning-path",
  slug: "learning-path",
  title: "Choose a learning path",
  intent: { keywords: ["course", "learning", "study"], aliases: ["choose a course", "pick a learning path"] },
};
