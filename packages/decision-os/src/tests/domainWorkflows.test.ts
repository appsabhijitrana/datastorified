import { calculate } from "@datastorified/calculators-engine";
import { describe, expect, it } from "vitest";
import { buildDecisionReport } from "../core/reportEngine";
import { createDefaultAnswers } from "../core/questionEngine";
import { decisionPluginRegistry } from "../plugins/staticPlugins";
import type { DecisionQuestionType, DecisionWorkflow } from "../types";

const workflowSlugs = [
  "sip-vs-fd",
  "emergency-fund",
  "loan-prepayment",
  "buy-house",
  "rent-vs-buy",
  "ev-vs-petrol",
  "buy-car",
  "job-switch",
] as const;

const workflows = workflowSlugs.map((slug) => {
  const workflow = decisionPluginRegistry.getWorkflowBySlug(slug);
  if (!workflow) throw new Error(`Missing test workflow: ${slug}`);
  return workflow;
});

describe("first Decision OS domain workflows", () => {
  it.each(workflows)("$slug produces a score, recommendation, and action plan", (workflow) => {
    const answers = createDefaultAnswers(workflow.questions);
    const report = buildDecisionReport(workflow, answers, { id: `test:${workflow.slug}`, generatedAt: "2026-07-02T00:00:00.000Z" });
    expect(report.score.value).toBeGreaterThanOrEqual(0);
    expect(report.score.value).toBeLessThanOrEqual(100);
    expect(Number.isFinite(report.score.value)).toBe(true);
    expect(report.score.factors).toHaveLength(workflow.weights.length);
    expect(report.recommendation).toBeDefined();
    expect(report.actionPlan.length).toBeGreaterThan(0);
  });

  it.each(workflows)("$slug includes complete workflow metadata", (workflow) => {
    expect(workflow.id).toBe(workflow.slug);
    expect(workflow.category).toBeTruthy();
    expect(workflow.description).toBeTruthy();
    expect(workflow.aliases?.length).toBeGreaterThan(0);
    expect(workflow.questions.length).toBeGreaterThan(0);
    expect(workflow.rules.length).toBeGreaterThan(0);
    expect(workflow.weights.length).toBeGreaterThan(0);
    expect(workflow.riskFactors?.length).toBeGreaterThan(0);
    expect(workflow.recommendations.length).toBeGreaterThan(0);
    expect(workflow.actionPlanTemplates?.length).toBeGreaterThan(0);
    expect(workflow.relatedCalculators?.length).toBeGreaterThan(0);
    expect(workflow.relatedTools?.length).toBeGreaterThan(0);
    expect(workflow.assumptions?.length).toBeGreaterThan(0);
    expect(workflow.faqs?.length).toBeGreaterThan(0);
  });

  it("covers every requested question type", () => {
    const types = new Set(workflows.flatMap((workflow) => workflow.questions.map(({ type }) => type)));
    const required: DecisionQuestionType[] = ["currency", "percentage", "number", "select", "boolean", "slider", "duration", "text"];
    expect([...types]).toEqual(expect.arrayContaining(required));
  });

  it("uses the calculator engine for derived loan payments", () => {
    const workflow = decisionPluginRegistry.getWorkflowBySlug("buy-car") as DecisionWorkflow;
    const answers = createDefaultAnswers(workflow.questions);
    const report = buildDecisionReport(workflow, answers);
    const expected = calculate("car-loan-calculator", { principal: 900_000, rate: 9, years: 5 }).primaryResult.value;
    expect(report.facts.emi).toBeCloseTo(expected, 8);
  });
});
