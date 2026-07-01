import type { DecisionPlugin, DecisionWorkflow } from "../types";
import { detectIntent } from "../core/intentEngine";
import { normalizeText } from "../utils/format";
import type { PluginRegistrySnapshot } from "./pluginTypes";

export class DecisionPluginRegistry {
  private readonly plugins = new Map<string, DecisionPlugin>();
  private readonly workflows = new Map<string, DecisionWorkflow>();
  private readonly workflowsBySlug = new Map<string, DecisionWorkflow>();

  registerPlugin(plugin: DecisionPlugin): void {
    if (this.plugins.has(plugin.id)) throw new Error(`Decision plugin "${plugin.id}" is already registered.`);
    const workflowIds = new Set<string>();
    const workflowSlugs = new Set<string>();
    for (const workflow of plugin.workflows) {
      if (workflow.pluginId !== plugin.id) throw new Error(`Workflow "${workflow.id}" must reference plugin "${plugin.id}".`);
      if (workflowIds.has(workflow.id) || this.workflows.has(workflow.id)) throw new Error(`Decision workflow "${workflow.id}" is already registered.`);
      if (workflowSlugs.has(workflow.slug) || this.workflowsBySlug.has(workflow.slug)) throw new Error(`Decision workflow slug "${workflow.slug}" is already registered.`);
      workflowIds.add(workflow.id);
      workflowSlugs.add(workflow.slug);
    }
    this.plugins.set(plugin.id, plugin);
    for (const workflow of plugin.workflows) {
      this.workflows.set(workflow.id, workflow);
      this.workflowsBySlug.set(workflow.slug, workflow);
    }
  }

  register(plugin: DecisionPlugin): void { this.registerPlugin(plugin); }

  unregister(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;
    for (const workflow of plugin.workflows) {
      this.workflows.delete(workflow.id);
      this.workflowsBySlug.delete(workflow.slug);
    }
    return this.plugins.delete(pluginId);
  }

  getPlugin(pluginId: string): DecisionPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  getWorkflow(workflowId: string): DecisionWorkflow | undefined {
    return this.workflows.get(workflowId);
  }

  getWorkflowBySlug(slug: string): DecisionWorkflow | undefined {
    return this.workflowsBySlug.get(slug);
  }

  listPlugins(): DecisionPlugin[] {
    return [...this.plugins.values()];
  }

  getAllPlugins(): DecisionPlugin[] { return this.listPlugins(); }

  listWorkflows(): DecisionWorkflow[] {
    return [...this.workflows.values()];
  }

  searchWorkflows(query: string, limit = 10): DecisionWorkflow[] {
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) return this.listWorkflows().slice(0, Math.max(0, limit));
    const queryTokens = normalizedQuery.split(" ").filter(Boolean);
    return this.listWorkflows()
      .map((workflow) => {
        const plugin = this.plugins.get(workflow.pluginId);
        const searchable = normalizeText([
          workflow.title,
          workflow.description,
          ...workflow.intent.keywords,
          ...(workflow.intent.aliases ?? []),
          ...(workflow.intent.examples ?? []),
          ...(plugin?.categories ?? []),
          ...(plugin?.keywords ?? []),
        ].join(" "));
        const score = queryTokens.reduce((total, token) => total + (searchable.includes(token) ? 1 : 0), 0);
        return { workflow, score };
      })
      .filter(({ score }) => score > 0)
      .sort((left, right) => right.score - left.score || left.workflow.title.localeCompare(right.workflow.title))
      .slice(0, Math.max(0, limit))
      .map(({ workflow }) => workflow);
  }

  detectWorkflowFromText(input: string): DecisionWorkflow | undefined {
    const workflows = this.listWorkflows().map((workflow) => {
      const plugin = this.plugins.get(workflow.pluginId);
      return {
        ...workflow,
        intent: {
          ...workflow.intent,
          keywords: [...new Set([...workflow.intent.keywords, ...(plugin?.keywords ?? []), ...(plugin?.categories ?? [])])],
        },
      };
    });
    const match = detectIntent(input, workflows, 1).bestMatch;
    if (!match || match.matchedTerms.length === 0 || match.confidence < 0.2) return undefined;
    return this.workflows.get(match.workflowId);
  }

  snapshot(): PluginRegistrySnapshot {
    return { plugins: [...this.plugins.keys()], workflows: [...this.workflows.keys()], workflowSlugs: [...this.workflowsBySlug.keys()] };
  }

  clear(): void {
    this.plugins.clear();
    this.workflows.clear();
    this.workflowsBySlug.clear();
  }
}
