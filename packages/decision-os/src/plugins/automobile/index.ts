import type { DecisionPlugin } from "../../types";
import { automobileDecisionWorkflows } from "./workflows";
export * from "./workflows";

export const automobilePluginId = "automobile";
export const automobilePluginName = "Automobile Decisions";
export const automobileCategories = ["automobile", "vehicle", "car ownership", "mobility"];
export const automobileKeywords = ["car", "vehicle", "automobile", "electric", "petrol", "buy", "lease"];
export const automobileRelatedCalculators = ["car-loan-calculator", "ev-vs-petrol-savings-calculator", "fuel-cost-calculator"];
export const automobileRelatedTools = ["percentage-calculator"];
export const automobileKnowledgeAssumptions = [{ id: "ownership-costs", description: "Purchase price, financing, energy, maintenance, insurance, resale, and usage inputs are estimates that vary by model and location." }];
export const automobileWorkflows = automobileDecisionWorkflows;
export const automobilePlugin: DecisionPlugin = { id: automobilePluginId, name: automobilePluginName, version: "1.0.0", categories: automobileCategories, workflows: automobileWorkflows, keywords: automobileKeywords, relatedCalculators: automobileRelatedCalculators, relatedTools: automobileRelatedTools, knowledgeAssumptions: automobileKnowledgeAssumptions };
