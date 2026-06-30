import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: "*", allow: "/" }, sitemap: "https://calculators.datastorified.com/sitemap.xml", host: "https://calculators.datastorified.com" }; }
