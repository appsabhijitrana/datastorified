import type { DecisionPlugin } from "../../types";
import { createPluginWorkflow } from "../createPluginWorkflow";

export const travelPluginId = "travel";
export const travelPluginName = "Travel Decisions";
export const travelCategories = ["travel", "destinations", "trips", "transport"];
export const travelKeywords = ["travel", "trip", "destination", "holiday", "flight", "hotel", "itinerary"];
export const travelRelatedCalculators = ["road-trip-cost-calculator", "fuel-cost-calculator", "currency-converter"];
export const travelRelatedTools = ["timestamp-converter", "pdf-merge"];
export const travelKnowledgeAssumptions = [{ id: "live-travel-data", description: "Fares, availability, entry rules, weather, safety conditions, and local restrictions are time-sensitive and require current verification." }];
export const travelWorkflows = [createPluginWorkflow({
  pluginId: travelPluginId,
  slug: "choose-travel-destination",
  title: "Which travel destination should I choose?",
  description: "Compare a destination against trip goals, practical constraints, and confidence in current travel information.",
  keywords: ["travel", "trip", "destination", "holiday", "vacation", "flight", "hotel"],
  aliases: ["choose a destination", "where should I travel"],
  examples: ["Which destination should I choose for my trip?"],
})];
export const travelPlugin: DecisionPlugin = { id: travelPluginId, name: travelPluginName, version: "1.0.0", categories: travelCategories, workflows: travelWorkflows, keywords: travelKeywords, relatedCalculators: travelRelatedCalculators, relatedTools: travelRelatedTools, knowledgeAssumptions: travelKnowledgeAssumptions };
