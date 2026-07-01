import type { DecisionPlugin } from "../../types";
import { createPluginWorkflow } from "../createPluginWorkflow";

export const financePluginId = "finance";
export const financePluginName = "Finance Decisions";
export const financeCategories = ["personal finance", "saving", "investing", "debt"];
export const financeKeywords = ["money", "budget", "save", "invest", "loan", "debt", "return"];
export const financeRelatedCalculators = ["sip-calculator", "fd-calculator", "loan-prepayment-calculator", "emergency-fund-calculator"];
export const financeRelatedTools = ["percentage-calculator"];
export const financeKnowledgeAssumptions = [{ id: "user-inputs", description: "Rates, returns, inflation, and costs are user-provided planning assumptions rather than live market data." }];
export const financeWorkflows = [createPluginWorkflow({
  pluginId: financePluginId,
  slug: "invest-or-repay-debt",
  title: "Should I invest or repay debt?",
  description: "Compare the case for investing available money with reducing outstanding debt.",
  keywords: ["invest", "repay", "debt", "loan", "interest", "return"],
  aliases: ["invest or pay off debt", "save or repay loan"],
  examples: ["Should I invest extra money or repay my loan?"],
})];
export const financePlugin: DecisionPlugin = { id: financePluginId, name: financePluginName, version: "1.0.0", categories: financeCategories, workflows: financeWorkflows, keywords: financeKeywords, relatedCalculators: financeRelatedCalculators, relatedTools: financeRelatedTools, knowledgeAssumptions: financeKnowledgeAssumptions };
