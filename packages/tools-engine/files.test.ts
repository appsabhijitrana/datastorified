import { PDFDocument } from "pdf-lib";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { processImage, processPdf, tools, type FileLike } from ".";

const pdfFile = async (name = "sample.pdf", pages = 2): Promise<FileLike> => {
  const document = await PDFDocument.create();
  for (let index = 0; index < pages; index += 1) document.addPage([300, 400]);
  document.setTitle("DataStorified test");
  const blob = new Blob([new Uint8Array(await document.save())], { type: "application/pdf" }) as FileLike;
  Object.defineProperty(blob, "name", { value: name });
  return blob;
};

describe("file utility catalog coverage", () => {
  tools.filter((tool) => tool.inputKind === "image").forEach((tool) => {
    it(`${tool.name} is routed to a real image processor`, () => {
      expect(tool.mode).toMatch(/^image-|png-jpg|jpg-png/u);
      expect(tool.limitations.length).toBeGreaterThan(0);
    });
  });

  it("merges PDFs", async () => {
    const result = await processPdf("pdf-merge", [await pdfFile("one.pdf", 1), await pdfFile("two.pdf", 2)]);
    expect(result.valid).toBe(true); expect(result.stats.Pages).toBe(3); expect(result.files[0].blob.type).toBe("application/pdf");
  });
  it("splits every PDF page", async () => { const result = await processPdf("pdf-split", [await pdfFile("split.pdf", 3)]); expect(result.files).toHaveLength(3); });
  it("rotates a PDF", async () => { const result = await processPdf("pdf-rotate", [await pdfFile()], { rotation: 90 }); expect(result.valid).toBe(true); expect(result.stats.Rotation).toBe("90°"); });
  it("extracts selected PDF pages", async () => { const result = await processPdf("pdf-extract", [await pdfFile("extract.pdf", 5)], { pages: "1,3-4" }); expect(result.stats["Extracted pages"]).toBe(3); });
  it("reads PDF metadata", async () => { const result = await processPdf("pdf-metadata", [await pdfFile()]); expect(result.metadata.Title).toBe("DataStorified test"); expect(result.stats.Pages).toBe(2); });
  it("rejects missing and invalid PDF input", async () => { expect((await processPdf("pdf-split", [])).valid).toBe(false); const text = new Blob(["no"], { type: "text/plain" }) as FileLike; expect((await processPdf("pdf-split", [text])).valid).toBe(false); });
  it("creates a PDF from images", async () => {
    const bytes = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="), (character) => character.charCodeAt(0));
    const image = new Blob([bytes], { type: "image/png" }) as FileLike; Object.defineProperty(image, "name", { value: "pixel.png" });
    const result = await processPdf("images-pdf", [image]); expect(result.valid, result.warnings.join(" ")).toBe(true); expect(result.stats.Pages).toBe(1);
  });
});

describe("client-side image processors", () => {
  const context = { fillStyle: "", fillRect: vi.fn(), drawImage: vi.fn(), getImageData: vi.fn(() => ({ data: new Uint8ClampedArray([37, 99, 235, 255]) })) };
  beforeEach(() => {
    vi.stubGlobal("createImageBitmap", vi.fn(async () => ({ width: 100, height: 80, close: vi.fn() })));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback, type) => callback(new Blob(["processed"], { type: type || "image/png" })));
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:preview") });
  });
  afterEach(() => vi.restoreAllMocks());

  const image = (type = "image/png") => { const blob = new Blob(["image"], { type }) as FileLike; Object.defineProperty(blob, "name", { value: type === "image/png" ? "sample.png" : "sample.jpg" }); return blob; };

  it.each([
    ["image-compress", image(), { quality: .7 }], ["image-resize", image(), { width: 40, height: 30 }], ["image-crop", image(), { x: 5, y: 4, width: 30, height: 20 }],
    ["png-jpg", image(), {}], ["jpg-png", image("image/jpeg"), {}], ["image-webp", image(), {}],
  ])("processes %s", async (mode, file, options) => {
    const result = await processImage(String(mode), file as FileLike, options as Record<string, number>);
    expect(result.valid, result.warnings.join(" ")).toBe(true); expect(result.files).toHaveLength(1); expect(result.previewUrl).toBe("blob:preview");
  });

  it("reads dimensions without creating an output file", async () => { const result = await processImage("image-metadata", image()); expect(result.stats.Width).toBe(100); expect(result.files).toHaveLength(0); });
  it("samples a color at numeric coordinates", async () => { const result = await processImage("image-color", image(), { x: 10, y: 20 }); expect(result.output).toBe("#2563EB"); });
  it("rejects unsupported files and unsupported browser APIs", async () => {
    expect((await processImage("image-resize", new Blob(["text"], { type: "text/plain" }) as FileLike)).valid).toBe(false);
    vi.stubGlobal("createImageBitmap", undefined); expect((await processImage("image-resize", image())).valid).toBe(false);
  });
});
