import type { MetadataRoute } from "next";

const sitemaps = [
  "https://datastorified.com/sitemap.xml",
  "https://calculators.datastorified.com/sitemap.xml",
  "https://tools.datastorified.com/sitemap.xml",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: sitemaps,
  };
}
