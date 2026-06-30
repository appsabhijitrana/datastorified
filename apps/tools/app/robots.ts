import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: "*", allow: "/" }, sitemap: "https://tools.datastorified.com/sitemap.xml", host: "https://tools.datastorified.com" }; }
