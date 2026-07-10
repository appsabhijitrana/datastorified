import type { MetadataRoute } from "next";
import { legalPolicies } from "../lib/legal-content";
import { decisionPluginRegistry } from "@datastorified/decision-os";
import { calculators } from "../../../packages/calculators-engine/registry";
import { tools } from "../../../packages/tools-engine/registry";

const baseUrl = "https://datastorified.com";
const legalLastModified = "2026-06-30";

export default function sitemap(): MetadataRoute.Sitemap {
  const corePages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/contact`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${baseUrl}/trust`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/decision`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/calculators`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/tools`, changeFrequency: "weekly", priority: 0.8 },
    {
      url: `${baseUrl}/legal`,
      lastModified: legalLastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const policyPages: MetadataRoute.Sitemap = legalPolicies.map(({ slug }) => ({
    url: `${baseUrl}/legal/${slug}`,
    lastModified: legalLastModified,
    changeFrequency: "yearly",
    priority: 0.5,
  }));

  const decisionPages: MetadataRoute.Sitemap = decisionPluginRegistry.listWorkflows().map(({ pluginId, slug }) => ({ url: `${baseUrl}/decision/${pluginId}/${slug}`, changeFrequency: "monthly", priority: 0.8 }));
  const calculatorPages: MetadataRoute.Sitemap = calculators.map(({ slug, popular }) => ({ url: `${baseUrl}/calculators/${slug}`, changeFrequency: "monthly", priority: popular ? 0.9 : 0.7 }));
  const toolPages: MetadataRoute.Sitemap = tools.map(({ slug, popular }) => ({ url: `${baseUrl}/tools/${slug}`, changeFrequency: "monthly", priority: popular ? 0.9 : 0.7 }));
  return [...corePages, ...decisionPages, ...calculatorPages, ...toolPages, ...policyPages];
}
