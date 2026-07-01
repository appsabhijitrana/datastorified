import type { DecisionPlugin } from "../../types";
import { createPluginWorkflow } from "../createPluginWorkflow";

export const educationPluginId = "education";
export const educationPluginName = "Education Decisions";
export const educationCategories = ["education", "learning", "courses", "qualifications"];
export const educationKeywords = ["education", "course", "degree", "college", "study", "training", "learn"];
export const educationRelatedCalculators = ["percentage-calculator", "goal-planner-calculator"];
export const educationRelatedTools = ["word-counter", "pdf-merge"];
export const educationKnowledgeAssumptions = [{ id: "programme-details", description: "Curriculum, recognition, admissions, cost, duration, outcomes, and eligibility should be verified with the institution and relevant authorities." }];
export const educationWorkflows = [createPluginWorkflow({
  pluginId: educationPluginId,
  slug: "choose-course-or-degree",
  title: "Which course or degree should I choose?",
  description: "Compare an education path against learning goals, constraints, and confidence in programme information.",
  keywords: ["course", "degree", "college", "study", "education", "training", "programme"],
  aliases: ["choose a course", "pick a degree", "which course should I study"],
  examples: ["Which degree or course is right for me?"],
})];
export const educationPlugin: DecisionPlugin = { id: educationPluginId, name: educationPluginName, version: "1.0.0", categories: educationCategories, workflows: educationWorkflows, keywords: educationKeywords, relatedCalculators: educationRelatedCalculators, relatedTools: educationRelatedTools, knowledgeAssumptions: educationKnowledgeAssumptions };
