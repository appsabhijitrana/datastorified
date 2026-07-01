import { describe, expect, it } from "vitest";
import { createStaticPluginRegistry, staticDecisionPlugins } from "../plugins/staticPlugins";

describe("DecisionPluginRegistry", () => {
  it("statically registers every domain plugin and its metadata", () => {
    const registry = createStaticPluginRegistry();
    expect(registry.getAllPlugins()).toHaveLength(8);
    expect(registry.snapshot().plugins).toEqual([
      "finance",
      "property",
      "automobile",
      "career",
      "education",
      "shopping",
      "travel",
      "business",
    ]);
    for (const plugin of staticDecisionPlugins) {
      expect(plugin.categories.length).toBeGreaterThan(0);
      expect(plugin.keywords.length).toBeGreaterThan(0);
      expect(plugin.relatedCalculators.length).toBeGreaterThan(0);
      expect(plugin.relatedTools.length).toBeGreaterThan(0);
      expect(plugin.knowledgeAssumptions.length).toBeGreaterThan(0);
      expect(plugin.workflows.every((workflow) => workflow.pluginId === plugin.id)).toBe(true);
    }
  });

  it("gets plugins and workflows by stable identifiers", () => {
    const registry = createStaticPluginRegistry();
    expect(registry.getPlugin("property")?.name).toBe("Property Decisions");
    expect(registry.getWorkflowBySlug("rent-or-buy-home")?.pluginId).toBe("property");
    expect(registry.getWorkflow("career:switch-jobs")?.slug).toBe("switch-jobs");
  });

  it("searches workflow and plugin metadata", () => {
    const registry = createStaticPluginRegistry();
    expect(registry.searchWorkflows("home mortgage")[0]?.slug).toBe("rent-or-buy-home");
    expect(registry.searchWorkflows("startup customer market")[0]?.slug).toBe("launch-or-delay-business-idea");
    expect(registry.searchWorkflows("unmatched-gibberish")).toEqual([]);
  });

  it.each([
    ["Should I invest extra money or repay my loan?", "invest-or-repay-debt"],
    ["Is it better to rent or buy a house?", "rent-or-buy-home"],
    ["Should I get an electric vehicle or petrol car?", "electric-or-petrol-car"],
    ["Should I accept this new job offer?", "switch-jobs"],
    ["Which degree should I study?", "choose-course-or-degree"],
    ["Should I purchase this product now or wait?", "buy-now-or-wait"],
    ["Where should I travel for my holiday?", "choose-travel-destination"],
    ["Should I launch my startup idea now?", "launch-or-delay-business-idea"],
  ])("detects a workflow from text: %s", (query, expectedSlug) => {
    expect(createStaticPluginRegistry().detectWorkflowFromText(query)?.slug).toBe(expectedSlug);
  });

  it("does not invent a workflow for unrelated text", () => {
    expect(createStaticPluginRegistry().detectWorkflowFromText("zebra quantum nebula")).toBeUndefined();
  });
});
