type Metadata = Record<string, unknown>;
export const canonical = (host: string, path = "/") => `https://${host}${path.startsWith("/") ? path : `/${path}`}`;
export function createMetadata(title: string, description: string, host: string, path = "/"): Metadata {
  const url = canonical(host, path); return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, siteName: "DataStorified", type: "website" }, twitter: { card: "summary_large_image", title, description } };
}
export const faqSchema = (items: Array<{question:string;answer:string}>) => ({ "@context":"https://schema.org", "@type":"FAQPage", mainEntity: items.map(x => ({ "@type":"Question", name:x.question, acceptedAnswer:{"@type":"Answer", text:x.answer} })) });
