import type { MetadataRoute } from "next";
import { tools } from "@datastorified/tools-engine/registry";

const baseUrl = "https://tools.datastorified.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${baseUrl}/`, changeFrequency: "weekly", priority: 1 },
    ...tools.map(({ slug, popular }) => ({
      url: `${baseUrl}/${slug}`,
      changeFrequency: "monthly" as const,
      priority: popular ? 0.9 : 0.7,
    })),
  ];
}
