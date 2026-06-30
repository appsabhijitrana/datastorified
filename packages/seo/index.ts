export type MetadataRecord = Record<string, unknown>;
export type FaqItem = { question: string; answer: string };
export type BreadcrumbItem = { name: string; url: string };

export const canonical = (host: string, path = "/") => `https://${host}${path.startsWith("/") ? path : `/${path}`}`;

export function createMetadata(title: string, description: string, host: string, path = "/"): MetadataRecord {
  const url = canonical(host, path);
  const socialImage = canonical(host, "/brand/og-card.png");
  return {
    title,
    description,
    metadataBase: new URL(`https://${host}`),
    alternates: { canonical: url },
    manifest: "/manifest.webmanifest",
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
    icons: {
      icon: [
        { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/brand/favicon-48.png", sizes: "48x48", type: "image/png" },
        { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      ],
      apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    openGraph: { title, description, url, siteName: "DataStorified", locale: "en_IN", type: "website", images: [{ url: socialImage, width: 1200, height: 630, alt: "DataStorified — Decision Intelligence for Everyone" }] },
    twitter: { card: "summary_large_image", title, description, images: [socialImage] },
  };
}

export const faqSchema = (items: FaqItem[]) => ({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) });

export const breadcrumbSchema = (items: BreadcrumbItem[]) => ({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: item.url })) });

export const softwareApplicationSchema = ({ name, description, url, category = "UtilitiesApplication" }: { name: string; description: string; url: string; category?: string }) => ({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name,
  description,
  url,
  applicationCategory: category,
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
  provider: { "@type": "Organization", name: "DataStorified", url: "https://datastorified.com" },
});

/** Escapes HTML-significant characters so user-controlled data cannot terminate a JSON-LD script. */
export const serializeJsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
