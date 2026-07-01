import type { DecisionPlugin } from "../../types";
import { createPluginWorkflow } from "../createPluginWorkflow";

export const careerPluginId = "career";
export const careerPluginName = "Career Decisions";
export const careerCategories = ["career", "employment", "professional growth", "work"];
export const careerKeywords = ["career", "job", "offer", "salary", "role", "switch", "resign"];
export const careerRelatedCalculators = ["salary-in-hand-calculator", "percentage-calculator", "emergency-fund-calculator"];
export const careerRelatedTools = ["word-counter"];
export const careerKnowledgeAssumptions = [{ id: "offer-quality", description: "Compensation, role scope, growth, culture, stability, and transition details should be verified from primary sources and written terms." }];
export const careerWorkflows = [createPluginWorkflow({
  pluginId: careerPluginId,
  slug: "switch-jobs",
  title: "Should I switch jobs?",
  description: "Assess a potential job change against needs, constraints, and confidence in the available evidence.",
  keywords: ["switch", "job", "career", "offer", "salary", "role", "resign"],
  aliases: ["change jobs", "accept a job offer", "leave my job"],
  examples: ["Should I switch jobs for a new offer?"],
})];
export const careerPlugin: DecisionPlugin = { id: careerPluginId, name: careerPluginName, version: "1.0.0", categories: careerCategories, workflows: careerWorkflows, keywords: careerKeywords, relatedCalculators: careerRelatedCalculators, relatedTools: careerRelatedTools, knowledgeAssumptions: careerKnowledgeAssumptions };
