import { describe, expect, it } from "vitest";
import { DecisionFlowEngine } from "../core/flowEngine";
import type { DecisionWorkflow } from "../types";

const workflow: DecisionWorkflow = {
  id: "flow-test",
  slug: "flow-test",
  pluginId: "test-plugin",
  version: "1.0.0",
  title: "Flow test",
  category: "career",
  description: "Exercise the flow engine.",
  intent: {
    keywords: ["flow", "test"],
    aliases: ["flow test"],
    examples: ["test the question flow"],
  },
  questions: [
    {
      id: "proceed",
      prompt: "Do you want to continue?",
      type: "single_choice",
      required: true,
      options: [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" },
      ],
    },
    {
      id: "budget",
      prompt: "What is your budget?",
      type: "currency",
      required: true,
      visibleWhen: { all: [{ fact: "proceed", operator: "equals", value: "yes" }] },
    },
    {
      id: "features",
      prompt: "Pick the features you want",
      type: "multi_choice",
      required: false,
      visibleWhen: { all: [{ fact: "budget", operator: "greater-than", value: 0 }] },
      options: [
        { label: "Fast setup", value: "fast-setup" },
        { label: "Low cost", value: "low-cost" },
      ],
    },
  ],
  rules: [],
  weights: [],
  recommendations: [
    { id: "proceed", minScore: 0, maxScore: 100, title: "Proceed", summary: "Looks workable.", actions: ["Review details"] },
  ],
};

describe("DecisionFlowEngine", () => {
  it("starts a workflow at the first visible question", () => {
    const engine = new DecisionFlowEngine();
    const session = engine.startWorkflow(workflow);

    expect(session.workflowId).toBe(workflow.id);
    expect(session.status).toBe("draft");
    expect(engine.getCurrentQuestion(session)?.id).toBe("proceed");
    expect(engine.canGoBack(session)).toBe(false);
    expect(engine.canGoNext(session)).toBe(false);
    expect(engine.calculateProgress(session)).toBe(0);
  });

  it("answers questions and moves through the flow", () => {
    const engine = new DecisionFlowEngine();
    const session = engine.startWorkflow(workflow);

    const afterProceed = engine.answerQuestion(session.id, "proceed", "yes");
    expect(afterProceed.answers.proceed).toBe("yes");
    expect(engine.getCurrentQuestion(afterProceed)?.id).toBe("budget");
    expect(engine.getPreviousQuestion(afterProceed)?.id).toBe("proceed");
    expect(engine.canGoBack(afterProceed)).toBe(true);

    const afterBudget = engine.answerQuestion(session.id, "budget", 2500);
    expect(afterBudget.answers.budget).toBe(2500);
    expect(engine.getCurrentQuestion(afterBudget)?.id).toBe("features");
    expect(engine.getNextQuestion(afterBudget)).toBeUndefined();
    expect(engine.canGoNext(afterBudget)).toBe(false);

    const afterFeatures = engine.answerQuestion(session.id, "features", ["fast-setup", "low-cost"]);
    expect(afterFeatures.answers.features).toEqual(["fast-setup", "low-cost"]);
  });

  it("keeps required questions on the current step until answered", () => {
    const engine = new DecisionFlowEngine();
    const session = engine.startWorkflow(workflow);

    const invalid = engine.answerQuestion(session.id, "proceed", "");
    expect(engine.getCurrentQuestion(invalid)?.id).toBe("proceed");
    expect(invalid.metadata?.validationErrors?.proceed).toBeDefined();
    expect(engine.calculateProgress(invalid)).toBe(0);
  });

  it("hides conditional questions and prunes hidden answers", () => {
    const engine = new DecisionFlowEngine();
    const session = engine.startWorkflow(workflow);

    engine.answerQuestion(session.id, "proceed", "yes");
    engine.answerQuestion(session.id, "budget", 2500);
    const hiddenState = engine.answerQuestion(session.id, "proceed", "no");

    expect(hiddenState.answers.budget).toBeUndefined();
    expect(hiddenState.answers.features).toBeUndefined();
    expect(engine.getNextQuestion(hiddenState)).toBeUndefined();
    expect(engine.calculateProgress(hiddenState)).toBe(100);
  });

  it("calculates progress based on visible required questions", () => {
    const engine = new DecisionFlowEngine();
    const session = engine.startWorkflow(workflow);

    expect(engine.calculateProgress(session)).toBe(0);
    const afterProceed = engine.answerQuestion(session.id, "proceed", "yes");
    expect(engine.calculateProgress(afterProceed)).toBe(50);
    const afterBudget = engine.answerQuestion(session.id, "budget", 2500);
    expect(engine.calculateProgress(afterBudget)).toBe(100);
  });

  it("completes the workflow when all required answers are provided", () => {
    const engine = new DecisionFlowEngine();
    const session = engine.startWorkflow(workflow);

    engine.answerQuestion(session.id, "proceed", "yes");
    const afterBudget = engine.answerQuestion(session.id, "budget", 2500);
    const completed = engine.completeWorkflow(afterBudget);

    expect(completed.status).toBe("completed");
    expect(completed.completedAt).toBeDefined();
  });

  it("does not complete when required answers are missing", () => {
    const engine = new DecisionFlowEngine();
    const session = engine.startWorkflow(workflow);

    const incomplete = engine.completeWorkflow(session);
    expect(incomplete.status).toBe("in_progress");
    expect(incomplete.metadata?.validationErrors?.proceed).toBeDefined();
  });
});
