import type { DecisionWorkflow } from "../types";

export type PluginWorkflowDefinition = {
  pluginId: string;
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  aliases: string[];
  examples: string[];
};

export function createPluginWorkflow(definition: PluginWorkflowDefinition): DecisionWorkflow {
  return {
    id: `${definition.pluginId}:${definition.slug}`,
    slug: definition.slug,
    pluginId: definition.pluginId,
    version: "1.0.0",
    title: definition.title,
    description: definition.description,
    intent: { keywords: definition.keywords, aliases: definition.aliases, examples: definition.examples },
    questions: [
      { id: "need", prompt: "How strong is the need for this decision?", type: "number", required: true, validation: { min: 1, max: 5 } },
      { id: "fit", prompt: "How well does the option fit your constraints?", type: "number", required: true, validation: { min: 1, max: 5 } },
      { id: "confidence", prompt: "How confident are you in the assumptions?", type: "number", required: true, validation: { min: 1, max: 5 } },
    ],
    weights: [
      { factorId: "need", label: "Need", weight: 30, baselineScore: 50 },
      { factorId: "fit", label: "Constraint fit", weight: 40, baselineScore: 50 },
      { factorId: "confidence", label: "Confidence", weight: 30, baselineScore: 50 },
    ],
    rules: [
      { id: "need-high", description: "A strong need supports action.", when: { all: [{ fact: "need", operator: "greater-than-or-equal", value: 4 }] }, factorId: "need", scoreEffect: { operation: "add", value: 30 } },
      { id: "need-low", description: "A weak need reduces urgency.", when: { all: [{ fact: "need", operator: "less-than-or-equal", value: 2 }] }, factorId: "need", scoreEffect: { operation: "subtract", value: 25 } },
      { id: "fit-high", description: "The option fits the stated constraints.", when: { all: [{ fact: "fit", operator: "greater-than-or-equal", value: 4 }] }, factorId: "fit", scoreEffect: { operation: "add", value: 30 } },
      { id: "fit-low", description: "The option conflicts with important constraints.", when: { all: [{ fact: "fit", operator: "less-than-or-equal", value: 2 }] }, factorId: "fit", scoreEffect: { operation: "subtract", value: 30 }, risk: { id: "constraint-mismatch", title: "Constraint mismatch", description: "The current option does not fit important stated constraints.", severity: "high", mitigation: "Revisit the option or relax only non-essential constraints." } },
      { id: "confidence-high", description: "Well-tested assumptions improve confidence.", when: { all: [{ fact: "confidence", operator: "greater-than-or-equal", value: 4 }] }, factorId: "confidence", scoreEffect: { operation: "add", value: 25 } },
      { id: "confidence-low", description: "Uncertain assumptions weaken the decision.", when: { all: [{ fact: "confidence", operator: "less-than-or-equal", value: 2 }] }, factorId: "confidence", scoreEffect: { operation: "subtract", value: 25 }, risk: { id: "assumption-uncertainty", title: "Assumption uncertainty", description: "Important inputs have low confidence.", severity: "medium", mitigation: "Validate the least certain assumptions before acting." } },
    ],
    scoreBands: [
      { min: 0, max: 44.99, label: "Needs review" },
      { min: 45, max: 69.99, label: "Conditional fit" },
      { min: 70, max: 100, label: "Strong fit" },
    ],
    recommendations: [
      { id: "pause", minScore: 0, maxScore: 44.99, title: "Pause and investigate", summary: "Important gaps need attention before committing.", actions: ["Validate assumptions", "Compare alternatives"] },
      { id: "test", minScore: 45, maxScore: 69.99, title: "Run a limited test", summary: "The option may fit, but uncertainty remains.", actions: ["Define a reversible next step", "Set success criteria"] },
      { id: "proceed", minScore: 70, maxScore: 100, title: "Proceed with safeguards", summary: "The current inputs support moving forward.", actions: ["Document assumptions", "Review the decision after new evidence"] },
    ],
  };
}
