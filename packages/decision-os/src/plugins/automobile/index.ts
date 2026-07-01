import type { DecisionPlugin } from "../../types";
import { createPluginWorkflow } from "../createPluginWorkflow";

export const automobilePluginId = "automobile";
export const automobilePluginName = "Automobile Decisions";
export const automobileCategories = ["automobile", "vehicle", "car ownership", "mobility"];
export const automobileKeywords = ["car", "vehicle", "automobile", "electric", "petrol", "buy", "lease"];
export const automobileRelatedCalculators = ["car-loan-calculator", "ev-vs-petrol-savings-calculator", "fuel-cost-calculator"];
export const automobileRelatedTools = ["percentage-calculator"];
export const automobileKnowledgeAssumptions = [{ id: "ownership-costs", description: "Purchase price, financing, energy, maintenance, insurance, resale, and usage inputs are estimates that vary by model and location." }];
export const automobileWorkflows = [createPluginWorkflow({
  pluginId: automobilePluginId,
  slug: "electric-or-petrol-car",
  title: "Should I choose an electric or petrol car?",
  description: "Compare vehicle options against usage needs, constraints, and confidence in ownership assumptions.",
  keywords: ["electric", "ev", "petrol", "car", "vehicle", "charging", "fuel"],
  aliases: ["EV vs petrol", "electric or petrol car"],
  examples: ["Should I buy an EV or a petrol car?"],
})];
export const automobilePlugin: DecisionPlugin = { id: automobilePluginId, name: automobilePluginName, version: "1.0.0", categories: automobileCategories, workflows: automobileWorkflows, keywords: automobileKeywords, relatedCalculators: automobileRelatedCalculators, relatedTools: automobileRelatedTools, knowledgeAssumptions: automobileKnowledgeAssumptions };
