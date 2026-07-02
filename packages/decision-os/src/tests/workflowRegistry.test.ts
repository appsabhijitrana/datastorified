import { beforeEach, describe, expect, it } from "vitest";
import { DecisionWorkflowRegistry } from "../plugins/workflowRegistry";
import type { DecisionWorkflow } from "../types";

function buildWorkflow(overrides: Partial<DecisionWorkflow> = {}): DecisionWorkflow {
  return {
    id: "test-workflow",
    slug: "test-workflow",
    pluginId: "test-plugin",
    version: "1.0.0",
    title: "Should I make this choice?",
    category: "career",
    description: "Compare practical constraints and outcomes.",
    aliases: ["make choice"],
    intent: { keywords: ["choice", "compare"], aliases: ["should I choose"], examples: ["should I pick this option"] },
    questions: [
      {
        id: "confidence",
        prompt: "How confident are you?",
        type: "select",
        required: true,
        options: [
          { label: "Low", value: 1 },
          { label: "High", value: 2 },
        ],
      },
    ],
    rules: [],
    weights: [],
    recommendations: [
      { id: "go", minScore: 0, maxScore: 100, title: "Proceed", summary: "Looks reasonable.", actions: ["Review details"] },
    ],
    ...overrides,
  };
}

describe("DecisionWorkflowRegistry", () => {
  let registry: DecisionWorkflowRegistry;

  beforeEach(() => {
    registry = new DecisionWorkflowRegistry();
  });

  it("successfully registers workflows", () => {
    const workflow = buildWorkflow();
    registry.registerWorkflow(workflow);

    expect(registry.getWorkflowById(workflow.id)).toBe(workflow);
    expect(registry.getWorkflowBySlug(workflow.slug)).toBe(workflow);
    expect(registry.getAllWorkflows()).toHaveLength(1);
  });

  it("rejects duplicate workflow ids", () => {
    registry.registerWorkflow(buildWorkflow());

    expect(() =>
      registry.registerWorkflow(
        buildWorkflow({
          slug: "another-slug",
          title: "Another choice",
          questions: [
            {
              id: "confidence-2",
              prompt: "How confident are you now?",
              type: "select",
              required: true,
              options: [
                { label: "Low", value: 1 },
                { label: "High", value: 2 },
              ],
            },
          ],
        }),
      ),
    ).toThrow(/already registered/i);
  });

  it("rejects duplicate slugs", () => {
    registry.registerWorkflow(buildWorkflow());

    expect(() =>
      registry.registerWorkflow(
        buildWorkflow({
          id: "another-id",
          title: "Another choice",
          questions: [
            {
              id: "confidence-2",
              prompt: "How confident are you now?",
              type: "select",
              required: true,
              options: [
                { label: "Low", value: 1 },
                { label: "High", value: 2 },
              ],
            },
          ],
        }),
      ),
    ).toThrow(/slug/i);
  });

  it("rejects invalid workflows", () => {
    expect(() =>
      registry.registerWorkflow(
        buildWorkflow({
          questions: [
            {
              id: "only-question",
              prompt: "One option only",
              type: "select",
              required: true,
              options: [{ label: "Only", value: 1 }],
            },
          ],
        }),
      ),
    ).toThrow(/at least two decision options/i);

    expect(() =>
      registry.registerWorkflow(
        buildWorkflow({
          questions: [],
        }),
      ),
    ).toThrow(/at least one question/i);

    expect(() =>
      registry.registerWorkflow(
        buildWorkflow({
          id: "duplicate-option-ids",
          slug: "duplicate-option-ids",
          questions: [
            {
              id: "shared-question",
              prompt: "Pick one",
              type: "select",
              required: true,
              options: [
                { id: "shared-option", label: "First", value: 1 } as never,
                { id: "shared-option", label: "Second", value: 2 } as never,
              ],
            },
          ],
        }),
      ),
    ).toThrow(/duplicate option id/i);
  });

  it("searches workflows by category", () => {
    registry.registerWorkflow(buildWorkflow({ id: "career-choice", slug: "career-choice", category: "career" }));
    registry.registerWorkflow(buildWorkflow({ id: "property-choice", slug: "property-choice", category: "property", title: "Should I buy a house?" }));

    expect(registry.getWorkflowsByCategory("career")).toHaveLength(1);
    expect(registry.getWorkflowsByCategory("property")[0]?.slug).toBe("property-choice");
  });

  it("searches workflows by query", () => {
    registry.registerWorkflow(buildWorkflow({ id: "career-choice", slug: "career-choice", title: "Should I switch jobs?", category: "career" }));
    registry.registerWorkflow(buildWorkflow({ id: "home-choice", slug: "home-choice", title: "Should I buy a house?", category: "property" }));

    expect(registry.searchWorkflows("switch jobs")[0]?.slug).toBe("career-choice");
    expect(registry.searchWorkflows("house")[0]?.slug).toBe("home-choice");
  });
});
