import type { MetadataRoute } from "next";
import { tools } from "@datastorified/tools-engine/registry";
const base = "https://tools.datastorified.com";
export default function sitemap(): MetadataRoute.Sitemap { const now = new Date(); return [{ url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 }, ...tools.map(({ slug, popular }) => ({ url: `${base}/${slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: popular ? .9 : .7 }))]; }
