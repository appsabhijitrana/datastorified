import type { DecisionPlugin } from "../../types";
import { createPluginWorkflow } from "../createPluginWorkflow";

export const shoppingPluginId = "shopping";
export const shoppingPluginName = "Shopping Decisions";
export const shoppingCategories = ["shopping", "products", "purchases", "consumer choices"];
export const shoppingKeywords = ["shop", "shopping", "buy", "purchase", "product", "deal", "discount", "wait"];
export const shoppingRelatedCalculators = ["discount-calculator", "percentage-calculator", "currency-converter"];
export const shoppingRelatedTools = ["text-diff", "qr-code-generator"];
export const shoppingKnowledgeAssumptions = [{ id: "product-evidence", description: "Prices, availability, specifications, warranty, seller terms, and product condition can change and should be verified before purchase." }];
export const shoppingWorkflows = [createPluginWorkflow({
  pluginId: shoppingPluginId,
  slug: "buy-now-or-wait",
  title: "Should I buy now or wait?",
  description: "Assess a planned purchase against urgency, constraints, and confidence in product and price information.",
  keywords: ["buy", "purchase", "wait", "price", "deal", "discount", "product"],
  aliases: ["buy now or later", "wait for a better price"],
  examples: ["Should I buy this product now or wait?"],
})];
export const shoppingPlugin: DecisionPlugin = { id: shoppingPluginId, name: shoppingPluginName, version: "1.0.0", categories: shoppingCategories, workflows: shoppingWorkflows, keywords: shoppingKeywords, relatedCalculators: shoppingRelatedCalculators, relatedTools: shoppingRelatedTools, knowledgeAssumptions: shoppingKnowledgeAssumptions };
