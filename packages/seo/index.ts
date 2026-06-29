type Metadata = Record<string, unknown>;
export const canonical = (host: string, path = "/") => `https://${host}${path.startsWith("/") ? path : `/${path}`}`;
export function createMetadata(title: string, description: string, host: string, path = "/"): Metadata {
  const url = canonical(host, path);
  const socialImage = canonical(host, "/brand/og-card.png");
  return {
    title,
    description,
    alternates: { canonical: url },
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [
        { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/brand/favicon-48.png", sizes: "48x48", type: "image/png" },
        { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      ],
      apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "DataStorified",
      type: "website",
      images: [{ url: socialImage, width: 1200, height: 630, alt: "DataStorified — Decision Intelligence for Everyone" }],
    },
    twitter: { card: "summary_large_image", title, description, images: [socialImage] },
  };
}
export const faqSchema = (items: Array<{question:string;answer:string}>) => ({ "@context":"https://schema.org", "@type":"FAQPage", mainEntity: items.map(x => ({ "@type":"Question", name:x.question, acceptedAnswer:{"@type":"Answer", text:x.answer} })) });
