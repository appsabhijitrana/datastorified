import type { DecisionQuestion, DecisionWorkflow } from "../types";
import { normalizeText } from "../utils/format";

type RegisteredWorkflow = DecisionWorkflow;

function hasDecisionOptions(question: DecisionQuestion): boolean {
  return Boolean(question.options && question.options.length > 0);
}

function validateWorkflow(workflow: DecisionWorkflow, existing: Iterable<DecisionWorkflow>): void {
  const existingWorkflows = [...existing];
  if (existingWorkflows.some((item) => item.id === workflow.id)) {
    throw new Error(`Decision workflow "${workflow.id}" is already registered.`);
  }
  if (existingWorkflows.some((item) => item.slug === workflow.slug)) {
    throw new Error(`Decision workflow slug "${workflow.slug}" is already registered.`);
  }
  if (workflow.questions.length < 1) {
    throw new Error(`Decision workflow "${workflow.id}" must include at least one question.`);
  }

  const questionIds = new Set<string>();
  let optionCount = 0;
  const optionIds = new Set<string>();

  for (const question of workflow.questions) {
    if (questionIds.has(question.id)) {
      throw new Error(`Decision workflow "${workflow.id}" has duplicate question id "${question.id}".`);
    }
    questionIds.add(question.id);

    if (!hasDecisionOptions(question)) continue;
    optionCount += question.options?.length ?? 0;

    for (const [index, option] of (question.options ?? []).entries()) {
      const optionId = (option as { id?: string }).id ?? `${question.id}:${index}`;
      if (optionIds.has(optionId)) {
        throw new Error(`Decision workflow "${workflow.id}" has duplicate option id "${optionId}".`);
      }
      optionIds.add(optionId);
    }
  }

  if (optionCount < 2) {
    throw new Error(`Decision workflow "${workflow.id}" must include at least two decision options.`);
  }
}

export class DecisionWorkflowRegistry {
  private readonly workflows = new Map<string, RegisteredWorkflow>();
  private readonly slugs = new Map<string, RegisteredWorkflow>();

  registerWorkflow(workflow: DecisionWorkflow): void {
    validateWorkflow(workflow, this.workflows.values());
    this.workflows.set(workflow.id, workflow);
    this.slugs.set(workflow.slug, workflow);
  }

  unregisterWorkflow(workflowId: string): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;
    this.workflows.delete(workflowId);
    this.slugs.delete(workflow.slug);
    return true;
  }

  getWorkflowById(workflowId: string): DecisionWorkflow | undefined {
    return this.workflows.get(workflowId);
  }

  getWorkflowBySlug(slug: string): DecisionWorkflow | undefined {
    return this.slugs.get(slug);
  }

  getAllWorkflows(): DecisionWorkflow[] {
    return [...this.workflows.values()];
  }

  getWorkflowsByCategory(category: string): DecisionWorkflow[] {
    const normalizedCategory = normalizeText(category);
    return this.getAllWorkflows().filter((workflow) => normalizeText(workflow.category ?? "").includes(normalizedCategory));
  }

  searchWorkflows(query: string): DecisionWorkflow[] {
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) return this.getAllWorkflows();
    return this.getAllWorkflows()
      .map((workflow) => {
        const searchable = normalizeText([
          workflow.id,
          workflow.slug,
          workflow.title,
          workflow.description,
          workflow.category ?? "",
          ...(workflow.aliases ?? []),
          ...(workflow.intent.keywords ?? []),
          ...(workflow.intent.aliases ?? []),
          ...(workflow.intent.examples ?? []),
        ].join(" "));
        const questionSearchable = workflow.questions
          .map((question) => [
            question.id,
            question.prompt,
            question.helperText ?? "",
            ...(question.options ?? []).map((option) => option.label),
          ].join(" "))
          .join(" ");
        const haystack = normalizeText(`${searchable} ${questionSearchable}`);
        const score = normalizedQuery
          .split(" ")
          .filter(Boolean)
          .reduce((total, token) => total + (haystack.includes(token) ? 1 : 0), 0);
        return { workflow, score };
      })
      .filter(({ score }) => score > 0)
      .sort((left, right) => right.score - left.score || left.workflow.title.localeCompare(right.workflow.title))
      .map(({ workflow }) => workflow);
  }

  clear(): void {
    this.workflows.clear();
    this.slugs.clear();
  }
}

export const workflowRegistry = new DecisionWorkflowRegistry();

export const registerWorkflow = (workflow: DecisionWorkflow): void => workflowRegistry.registerWorkflow(workflow);
export const unregisterWorkflow = (workflowId: string): boolean => workflowRegistry.unregisterWorkflow(workflowId);
export const getWorkflowById = (workflowId: string): DecisionWorkflow | undefined => workflowRegistry.getWorkflowById(workflowId);
export const getWorkflowBySlug = (slug: string): DecisionWorkflow | undefined => workflowRegistry.getWorkflowBySlug(slug);
export const getAllWorkflows = (): DecisionWorkflow[] => workflowRegistry.getAllWorkflows();
export const getWorkflowsByCategory = (category: string): DecisionWorkflow[] => workflowRegistry.getWorkflowsByCategory(category);
export const searchWorkflows = (query: string): DecisionWorkflow[] => workflowRegistry.searchWorkflows(query);
