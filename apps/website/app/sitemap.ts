import type { MetadataRoute } from "next";
import { legalPolicies } from "../lib/legal-content";
import { decisions } from "@datastorified/decision-engine";

const baseUrl = "https://datastorified.com";
const legalLastModified = "2026-06-30";

export default function sitemap(): MetadataRoute.Sitemap {
  const corePages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/contact`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${baseUrl}/trust`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/decision`, changeFrequency: "weekly", priority: 0.9 },
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

  const decisionPages: MetadataRoute.Sitemap = decisions.map(({ id }) => ({ url: `${baseUrl}/decision/${id}`, changeFrequency: "monthly", priority: 0.8 }));
  return [...corePages, ...decisionPages, ...policyPages];
}
