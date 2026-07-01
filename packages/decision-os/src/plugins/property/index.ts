import type { DecisionPlugin } from "../../types";
import { createPluginWorkflow } from "../createPluginWorkflow";

export const propertyPluginId = "property";
export const propertyPluginName = "Property Decisions";
export const propertyCategories = ["property", "housing", "renting", "home ownership"];
export const propertyKeywords = ["house", "home", "property", "rent", "buy", "mortgage"];
export const propertyRelatedCalculators = ["rent-vs-buy-calculator", "home-affordability-calculator", "rental-yield-calculator"];
export const propertyRelatedTools = ["percentage-calculator"];
export const propertyKnowledgeAssumptions = [{ id: "local-costs", description: "Property prices, taxes, transaction costs, financing terms, and rent vary by location and must be supplied or verified by the user." }];
export const propertyWorkflows = [createPluginWorkflow({
  pluginId: propertyPluginId,
  slug: "rent-or-buy-home",
  title: "Should I rent or buy a home?",
  description: "Compare renting and home ownership against personal constraints and confidence in assumptions.",
  keywords: ["rent", "buy", "home", "house", "property", "mortgage"],
  aliases: ["rent vs buy", "buy a house or keep renting"],
  examples: ["Should I rent or buy a house?"],
})];
export const propertyPlugin: DecisionPlugin = { id: propertyPluginId, name: propertyPluginName, version: "1.0.0", categories: propertyCategories, workflows: propertyWorkflows, keywords: propertyKeywords, relatedCalculators: propertyRelatedCalculators, relatedTools: propertyRelatedTools, knowledgeAssumptions: propertyKnowledgeAssumptions };
