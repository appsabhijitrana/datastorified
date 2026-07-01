import type { DecisionPlugin } from "../../types";
import { careerDecisionWorkflows } from "./workflows";
export * from "./workflows";

export const careerPluginId = "career";
export const careerPluginName = "Career Decisions";
export const careerCategories = ["career", "employment", "professional growth", "work"];
export const careerKeywords = ["career", "job", "offer", "salary", "role", "switch", "resign"];
export const careerRelatedCalculators = ["salary-in-hand-calculator", "percentage-calculator", "emergency-fund-calculator"];
export const careerRelatedTools = ["word-counter"];
export const careerKnowledgeAssumptions = [{ id: "offer-quality", description: "Compensation, role scope, growth, culture, stability, and transition details should be verified from primary sources and written terms." }];
export const careerWorkflows = careerDecisionWorkflows;
export const careerPlugin: DecisionPlugin = { id: careerPluginId, name: careerPluginName, version: "1.0.0", categories: careerCategories, workflows: careerWorkflows, keywords: careerKeywords, relatedCalculators: careerRelatedCalculators, relatedTools: careerRelatedTools, knowledgeAssumptions: careerKnowledgeAssumptions };
