import { degrees, PDFDocument } from "pdf-lib";
import type { UtilityResult, UtilityScalar } from ".";

export type FileLike = Blob & { name?: string };
export type ProcessedFile = { name: string; blob: Blob };
export type FileUtilityResult = UtilityResult & { files: ProcessedFile[]; previewUrl?: string };
export type FileOptions = Record<string, UtilityScalar>;

const ok = (output: string, files: ProcessedFile[] = [], stats: Record<string, UtilityScalar> = {}, metadata: Record<string, UtilityScalar> = {}, warnings: string[] = [], previewUrl?: string): FileUtilityResult => ({ output, files, stats, metadata, warnings, previewUrl, valid: true });
const fail = (message: string): FileUtilityResult => ({ output: "", files: [], stats: {}, metadata: { error: message }, warnings: [message], valid: false });
const filename = (file: FileLike, fallback: string) => file.name || fallback;
const stem = (name: string) => name.replace(/\.[^.]+$/u, "");
const extensionFor = (mime: string) => mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
const blobBuffer = (blob: Blob): Promise<ArrayBuffer> => {
  if (typeof blob.arrayBuffer === "function") return blob.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => reader.result instanceof ArrayBuffer ? resolve(reader.result) : reject(new Error("Could not read the selected file."));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the selected file."));
    reader.readAsArrayBuffer(blob);
  });
};

const loadImage = async (file: Blob): Promise<ImageBitmap> => {
  if (typeof createImageBitmap !== "function") throw new Error("This browser does not support local canvas image processing.");
  return createImageBitmap(file);
};
const canvasBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) => new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("The browser could not create the output image.")), type, quality));

export async function processImage(mode: string, file: FileLike, options: FileOptions = {}): Promise<FileUtilityResult> {
  if (!file || !file.type.startsWith("image/")) return fail("Choose a supported image file.");
  try {
    const image = await loadImage(file);
    const originalWidth = image.width; const originalHeight = image.height;
    const baseMetadata = { Name: filename(file, "image"), Type: file.type || "unknown", Bytes: file.size, Width: originalWidth, Height: originalHeight };
    if (mode === "image-metadata") { image.close(); return ok("Image metadata read successfully.", [], { Width: originalWidth, Height: originalHeight, Megapixels: Number((originalWidth * originalHeight / 1_000_000).toFixed(2)) }, baseMetadata); }
    const canvas = document.createElement("canvas"); const context = canvas.getContext("2d", { willReadFrequently: mode === "image-color" });
    if (!context) throw new Error("Canvas is unavailable in this browser.");
    let sourceX = 0; let sourceY = 0; let sourceWidth = originalWidth; let sourceHeight = originalHeight;
    let width = originalWidth; let height = originalHeight;
    if (mode === "image-resize") {
      width = Math.max(1, Math.min(12_000, Math.round(Number(options.width ?? originalWidth))));
      height = Math.max(1, Math.min(12_000, Math.round(Number(options.height ?? originalHeight))));
    }
    if (mode === "image-crop") {
      sourceX = Math.max(0, Math.round(Number(options.x ?? 0))); sourceY = Math.max(0, Math.round(Number(options.y ?? 0)));
      sourceWidth = Math.max(1, Math.min(originalWidth - sourceX, Math.round(Number(options.width ?? originalWidth))));
      sourceHeight = Math.max(1, Math.min(originalHeight - sourceY, Math.round(Number(options.height ?? originalHeight))));
      width = sourceWidth; height = sourceHeight;
    }
    canvas.width = width; canvas.height = height;
    if (mode === "png-jpg") { context.fillStyle = "#ffffff"; context.fillRect(0, 0, width, height); }
    context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
    image.close();
    if (mode === "image-color") {
      const x = Math.max(0, Math.min(width - 1, Math.round(Number(options.x ?? width / 2)))); const y = Math.max(0, Math.min(height - 1, Math.round(Number(options.y ?? height / 2))));
      const [r, g, b, a] = context.getImageData(x, y, 1, 1).data; const hex = `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
      return ok(hex, [], { Red: r, Green: g, Blue: b, Alpha: Number((a / 255).toFixed(3)) }, { ...baseMetadata, X: x, Y: y });
    }
    const outputType = mode === "jpg-png" || mode === "image-crop" || mode === "image-resize" && file.type === "image/png" ? "image/png" : mode === "image-webp" ? "image/webp" : mode === "png-jpg" || mode === "image-compress" ? String(options.format ?? "image/jpeg") : file.type;
    const quality = Math.max(.1, Math.min(1, Number(options.quality ?? .8)));
    const blob = await canvasBlob(canvas, outputType, quality);
    const outputName = `${stem(filename(file, "image"))}-${mode.replace(/^image-/u, "")}.${extensionFor(outputType)}`;
    return ok("Image processed successfully.", [{ name: outputName, blob }], { "Original bytes": file.size, "Output bytes": blob.size, "Size change": `${file.size ? ((blob.size / file.size - 1) * 100).toFixed(1) : 0}%` }, { ...baseMetadata, "Output width": width, "Output height": height, "Output type": outputType }, [], URL.createObjectURL(blob));
  } catch (error) { return fail(error instanceof Error ? error.message : "Image processing failed."); }
}

const parsePages = (input: string, pageCount: number) => {
  const selected = new Set<number>();
  for (const part of input.split(",").map((value) => value.trim()).filter(Boolean)) {
    const match = part.match(/^(\d+)(?:-(\d+))?$/u); if (!match) throw new Error("Use page numbers such as 1,3-5.");
    const start = Number(match[1]); const end = Number(match[2] ?? match[1]);
    if (start < 1 || end < start || end > pageCount) throw new Error(`Pages must be between 1 and ${pageCount}.`);
    for (let page = start; page <= end; page += 1) selected.add(page - 1);
  }
  if (!selected.size) throw new Error("Select at least one page.");
  return [...selected];
};
const pdfBlob = (bytes: Uint8Array) => new Blob([new Uint8Array(bytes)], { type: "application/pdf" });

export async function processPdf(mode: string, files: FileLike[], options: FileOptions = {}): Promise<FileUtilityResult> {
  if (!files.length) return fail("Choose at least one file.");
  try {
    if (mode === "images-pdf") {
      const document = await PDFDocument.create();
      for (const file of files) {
        const bytes = new Uint8Array(await blobBuffer(file));
        const embedded = file.type === "image/png" ? await document.embedPng(bytes) : file.type === "image/jpeg" ? await document.embedJpg(bytes) : null;
        if (!embedded) throw new Error("Images to PDF supports PNG and JPEG files.");
        const page = document.addPage([embedded.width, embedded.height]); page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
      }
      const blob = pdfBlob(await document.save());
      return ok("PDF created successfully.", [{ name: "images.pdf", blob }], { Pages: files.length, "Output bytes": blob.size });
    }
    if (files.some((file) => file.type && file.type !== "application/pdf")) return fail("Choose PDF files for this tool.");
    if (mode === "pdf-merge") {
      if (files.length < 2) return fail("Choose at least two PDFs to merge.");
      const merged = await PDFDocument.create(); let pages = 0;
      for (const file of files) { const source = await PDFDocument.load(await blobBuffer(file)); const copied = await merged.copyPages(source, source.getPageIndices()); copied.forEach((page) => merged.addPage(page)); pages += copied.length; }
      const blob = pdfBlob(await merged.save()); return ok("PDFs merged successfully.", [{ name: "merged.pdf", blob }], { Files: files.length, Pages: pages, "Output bytes": blob.size });
    }
    const sourceFile = files[0]; const source = await PDFDocument.load(await blobBuffer(sourceFile)); const pageCount = source.getPageCount();
    if (mode === "pdf-metadata") return ok("PDF metadata read successfully.", [], { Pages: pageCount, Bytes: sourceFile.size }, { Title: source.getTitle() ?? "", Author: source.getAuthor() ?? "", Subject: source.getSubject() ?? "", Creator: source.getCreator() ?? "", Producer: source.getProducer() ?? "", "Creation date": source.getCreationDate()?.toISOString() ?? "", "Modification date": source.getModificationDate()?.toISOString() ?? "" });
    if (mode === "pdf-split") {
      const outputs: ProcessedFile[] = [];
      for (let index = 0; index < pageCount; index += 1) { const document = await PDFDocument.create(); const [page] = await document.copyPages(source, [index]); document.addPage(page); outputs.push({ name: `${stem(filename(sourceFile, "document"))}-page-${index + 1}.pdf`, blob: pdfBlob(await document.save()) }); }
      return ok("PDF split successfully.", outputs, { Pages: pageCount, Files: outputs.length });
    }
    if (mode === "pdf-rotate") {
      const angle = Number(options.rotation ?? 90); if (![90, 180, 270].includes(angle)) throw new Error("Choose a rotation of 90, 180, or 270 degrees.");
      source.getPages().forEach((page) => page.setRotation(degrees((page.getRotation().angle + angle) % 360))); const blob = pdfBlob(await source.save());
      return ok("PDF rotated successfully.", [{ name: `${stem(filename(sourceFile, "document"))}-rotated.pdf`, blob }], { Pages: pageCount, Rotation: `${angle}°` });
    }
    if (mode === "pdf-extract") {
      const selected = parsePages(String(options.pages ?? "1"), pageCount); const document = await PDFDocument.create(); const copied = await document.copyPages(source, selected); copied.forEach((page) => document.addPage(page)); const blob = pdfBlob(await document.save());
      return ok("Pages extracted successfully.", [{ name: `${stem(filename(sourceFile, "document"))}-pages.pdf`, blob }], { "Source pages": pageCount, "Extracted pages": selected.length });
    }
    return fail("This PDF operation is not implemented.");
  } catch (error) { return fail(error instanceof Error ? error.message : "PDF processing failed."); }
}
