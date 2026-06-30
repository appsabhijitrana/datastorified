import type { MetadataRoute } from "next";
import { calculators } from "@datastorified/calculators-engine/registry";
const base = "https://calculators.datastorified.com";
export default function sitemap(): MetadataRoute.Sitemap { const now = new Date(); return [{ url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 }, ...calculators.map(({ slug, popular }) => ({ url: `${base}/${slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: popular ? .9 : .7 }))]; }
