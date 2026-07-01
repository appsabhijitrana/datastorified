import type { DecisionPlugin } from "../../types";
import { createPluginWorkflow } from "../createPluginWorkflow";

export const businessPluginId = "business";
export const businessPluginName = "Business Decisions";
export const businessCategories = ["business", "entrepreneurship", "operations", "growth"];
export const businessKeywords = ["business", "startup", "launch", "expand", "hire", "profit", "customer", "market"];
export const businessRelatedCalculators = ["break-even-calculator", "profit-margin-calculator", "roi-calculator", "startup-runway-calculator"];
export const businessRelatedTools = ["csv-to-json", "json-to-csv", "pdf-merge"];
export const businessKnowledgeAssumptions = [{ id: "business-inputs", description: "Demand, pricing, costs, competition, regulation, capacity, and execution estimates are supplied by the user and should be tested with evidence." }];
export const businessWorkflows = [createPluginWorkflow({
  pluginId: businessPluginId,
  slug: "launch-or-delay-business-idea",
  title: "Should I launch or delay a business idea?",
  description: "Assess a business launch against customer need, constraints, and confidence in the underlying evidence.",
  keywords: ["business", "startup", "launch", "delay", "customer", "market", "idea"],
  aliases: ["start a business or wait", "launch my startup"],
  examples: ["Should I launch my business idea now?"],
})];
export const businessPlugin: DecisionPlugin = { id: businessPluginId, name: businessPluginName, version: "1.0.0", categories: businessCategories, workflows: businessWorkflows, keywords: businessKeywords, relatedCalculators: businessRelatedCalculators, relatedTools: businessRelatedTools, knowledgeAssumptions: businessKnowledgeAssumptions };
