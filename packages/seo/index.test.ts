import { describe, expect, it } from "vitest";
import { breadcrumbSchema, createMetadata, serializeJsonLd, softwareApplicationSchema } from ".";
describe("SEO helpers", () => {
  it("builds canonical and social metadata", () => { const metadata = createMetadata("Title", "Description", "example.com", "/tool"); expect(metadata.alternates).toEqual({ canonical: "https://example.com/tool" }); expect(metadata.openGraph).toMatchObject({ url: "https://example.com/tool" }); });
  it("creates ordered breadcrumbs", () => expect(breadcrumbSchema([{name:"Home",url:"https://example.com"}]).itemListElement[0].position).toBe(1));
  it("describes a free browser application", () => expect(softwareApplicationSchema({name:"Tool",description:"Useful",url:"https://example.com/tool"}).offers.price).toBe("0"));
  it("escapes script-breaking JSON-LD characters", () => expect(serializeJsonLd({value:"</script>"})).not.toContain("</script>"));
});
