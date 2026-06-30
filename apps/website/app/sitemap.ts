import type { MetadataRoute } from "next";
import { legalPolicies } from "../lib/legal-content";
const base = "https://datastorified.com";
export default function sitemap(): MetadataRoute.Sitemap { const now = new Date(); return ["", "/about", "/contact", "/trust", "/legal", ...legalPolicies.map(({slug}) => `/legal/${slug}`)].map((path) => ({ url: `${base}${path || "/"}`, lastModified: now, changeFrequency: path.startsWith("/legal") ? "monthly" : "weekly", priority: path === "" ? 1 : .7 })); }
