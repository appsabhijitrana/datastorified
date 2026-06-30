# SEO implementation

Each surface generates canonical metadata, Open Graph and Twitter cards, favicons, crawler directives, and an XML sitemap through Next.js metadata routes.

Calculator and tool detail pages include a safe JSON-LD graph containing `FAQPage`, `BreadcrumbList`, and `SoftwareApplication`. JSON-LD serialization escapes HTML-significant characters. Registered routes are statically generated and included automatically in the corresponding sitemap.

Production origins:

- `https://datastorified.com`
- `https://calculators.datastorified.com`
- `https://tools.datastorified.com`

After launch, submit all three sitemap URLs to Google Search Console and Bing Webmaster Tools. Validate representative detail pages with Schema Markup Validator and Rich Results Test after every schema change.
