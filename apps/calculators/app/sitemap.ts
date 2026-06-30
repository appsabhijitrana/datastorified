import type { MetadataRoute } from "next";
import { calculators } from "@datastorified/calculators-engine/registry";

const baseUrl = "https://calculators.datastorified.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${baseUrl}/`, changeFrequency: "weekly", priority: 1 },
    ...calculators.map(({ slug, popular }) => ({
      url: `${baseUrl}/${slug}`,
      changeFrequency: "monthly" as const,
      priority: popular ? 0.9 : 0.7,
    })),
  ];
}
