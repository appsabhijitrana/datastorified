import type { DecisionPlugin } from "../../types";
import { propertyDecisionWorkflows } from "./workflows";
export * from "./workflows";

export const propertyPluginId = "property";
export const propertyPluginName = "Property Decisions";
export const propertyCategories = ["property", "housing", "renting", "home ownership"];
export const propertyKeywords = ["house", "home", "property", "rent", "buy", "mortgage"];
export const propertyRelatedCalculators = ["rent-vs-buy-calculator", "home-affordability-calculator", "rental-yield-calculator"];
export const propertyRelatedTools = ["percentage-calculator"];
export const propertyKnowledgeAssumptions = [{ id: "local-costs", description: "Property prices, taxes, transaction costs, financing terms, and rent vary by location and must be supplied or verified by the user." }];
export const propertyWorkflows = propertyDecisionWorkflows;
export const propertyPlugin: DecisionPlugin = { id: propertyPluginId, name: propertyPluginName, version: "1.0.0", categories: propertyCategories, workflows: propertyWorkflows, keywords: propertyKeywords, relatedCalculators: propertyRelatedCalculators, relatedTools: propertyRelatedTools, knowledgeAssumptions: propertyKnowledgeAssumptions };
