import { DecisionPluginRegistry } from "./pluginRegistry";
import { financePlugin } from "./finance";
import { propertyPlugin } from "./property";
import { automobilePlugin } from "./automobile";
import { careerPlugin } from "./career";
import { educationPlugin } from "./education";
import { shoppingPlugin } from "./shopping";
import { travelPlugin } from "./travel";
import { businessPlugin } from "./business";
import type { DecisionPlugin } from "../types";

export const staticDecisionPlugins: DecisionPlugin[] = [
  financePlugin,
  propertyPlugin,
  automobilePlugin,
  careerPlugin,
  educationPlugin,
  shoppingPlugin,
  travelPlugin,
  businessPlugin,
];

export function createStaticPluginRegistry(): DecisionPluginRegistry {
  const registry = new DecisionPluginRegistry();
  for (const plugin of staticDecisionPlugins) registry.registerPlugin(plugin);
  return registry;
}

export const decisionPluginRegistry = createStaticPluginRegistry();
