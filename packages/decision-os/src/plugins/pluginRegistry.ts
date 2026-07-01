import type { DecisionPlugin, DecisionWorkflow } from "../types";
import type { PluginRegistrySnapshot } from "./pluginTypes";

export class DecisionPluginRegistry {
  private readonly plugins = new Map<string, DecisionPlugin>();
  private readonly workflows = new Map<string, DecisionWorkflow>();

  register(plugin: DecisionPlugin): void {
    if (this.plugins.has(plugin.id)) throw new Error(`Decision plugin "${plugin.id}" is already registered.`);
    const workflowIds = new Set<string>();
    for (const workflow of plugin.workflows) {
      if (workflow.pluginId !== plugin.id) throw new Error(`Workflow "${workflow.id}" must reference plugin "${plugin.id}".`);
      if (workflowIds.has(workflow.id) || this.workflows.has(workflow.id)) throw new Error(`Decision workflow "${workflow.id}" is already registered.`);
      workflowIds.add(workflow.id);
    }
    this.plugins.set(plugin.id, plugin);
    for (const workflow of plugin.workflows) this.workflows.set(workflow.id, workflow);
  }

  unregister(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;
    for (const workflow of plugin.workflows) this.workflows.delete(workflow.id);
    return this.plugins.delete(pluginId);
  }

  getPlugin(pluginId: string): DecisionPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  getWorkflow(workflowId: string): DecisionWorkflow | undefined {
    return this.workflows.get(workflowId);
  }

  listPlugins(): DecisionPlugin[] {
    return [...this.plugins.values()];
  }

  listWorkflows(): DecisionWorkflow[] {
    return [...this.workflows.values()];
  }

  snapshot(): PluginRegistrySnapshot {
    return { plugins: [...this.plugins.keys()], workflows: [...this.workflows.keys()] };
  }

  clear(): void {
    this.plugins.clear();
    this.workflows.clear();
  }
}

export const decisionPluginRegistry = new DecisionPluginRegistry();
