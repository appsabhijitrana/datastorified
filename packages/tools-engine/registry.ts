export type ToolCategory = "Text" | "Developer" | "Image" | "PDF" | "Utility";
export type ToolInputKind = "text" | "generator" | "image" | "pdf" | "files";
export type ToolDefinition = {
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  keywords: string[];
  icon: string;
  mode: string;
  inputKind: ToolInputKind;
  popular?: boolean;
  limitations: string[];
};

const define = (slug: string, name: string, description: string, category: ToolCategory, mode: string, inputKind: ToolInputKind = "text", keywords: string[] = [], popular = false, limitations: string[] = []): ToolDefinition =>
  ({ slug, name, description, category, mode, inputKind, keywords, popular, icon: "WandSparkles", limitations });

const browserText = ["Processing happens locally in this browser."];
const imageLimits = ["Large images are limited by available browser memory.", "Output metadata and animation frames may not be preserved."];
const pdfLimits = ["Encrypted PDFs require their password to be removed first.", "Very large documents are limited by available browser memory."];

export const tools: ToolDefinition[] = [
  define("word-counter", "Word Counter", "Count words, characters, lines, and reading time.", "Text", "word-count", "text", ["text", "count"], true, browserText),
  define("character-counter", "Character Counter", "Measure Unicode characters with and without spaces.", "Text", "character-count", "text", [], false, browserText),
  define("sentence-counter", "Sentence Counter", "Estimate sentence count from terminal punctuation.", "Text", "sentence-count", "text", [], false, ["Abbreviations and unconventional punctuation can affect the estimate."]),
  define("paragraph-counter", "Paragraph Counter", "Count non-empty text blocks.", "Text", "paragraph-count"),
  define("case-converter", "Case Converter", "Transform text into upper, lower, title, sentence, or camel case.", "Text", "case", "text", [], true),
  define("slug-generator", "Slug Generator", "Create clean URL-friendly slugs.", "Text", "slug"),
  define("remove-duplicate-lines", "Remove Duplicate Lines", "Remove repeated lines while preserving first occurrence.", "Text", "dedupe"),
  define("sort-lines", "Sort Lines", "Sort lines alphabetically or in reverse order.", "Text", "sort"),
  define("reverse-text", "Reverse Text", "Reverse text by Unicode character.", "Text", "reverse"),
  define("text-diff", "Text Diff Basic", "Compare two text blocks line by line.", "Text", "text-diff", "text", ["compare"], false, ["This is a line-based comparison and does not detect moved blocks."]),
  define("find-and-replace", "Find and Replace", "Replace text using plain or case-sensitive matching.", "Text", "find-replace"),
  define("remove-extra-spaces", "Remove Extra Spaces", "Normalize repeated spaces while preserving paragraphs.", "Text", "spaces"),
  define("lorem-ipsum-generator", "Lorem Ipsum Generator", "Generate deterministic placeholder paragraphs.", "Text", "lorem", "generator"),
  define("text-to-csv", "Text to CSV Basic", "Convert delimited text lines into escaped CSV rows.", "Text", "text-csv", "text", [], false, ["Automatic column detection assumes the selected delimiter."]),
  define("csv-to-text", "CSV to Text Basic", "Convert CSV rows into delimited plain text.", "Text", "csv-text", "text", [], false, ["Supports standard quoted CSV fields, including escaped quotes."]),

  define("json-formatter", "JSON Formatter", "Format and inspect JSON with clear errors.", "Developer", "json-format", "text", ["prettify"], true),
  define("json-validator", "JSON Validator", "Validate JSON syntax.", "Developer", "json-valid"),
  define("json-minifier", "JSON Minifier", "Remove insignificant whitespace from JSON.", "Developer", "json-minify"),
  define("json-to-csv", "JSON to CSV", "Convert an array of flat JSON objects to CSV.", "Developer", "json-csv", "text", [], false, ["Nested objects are serialized as JSON strings."]),
  define("csv-to-json", "CSV to JSON", "Convert CSV rows to a JSON object array.", "Developer", "csv-json"),
  define("yaml-to-json", "YAML to JSON", "Parse YAML and output formatted JSON.", "Developer", "yaml-json", "text", [], false, ["Custom YAML tags are not supported."]),
  define("json-to-yaml", "JSON to YAML", "Convert valid JSON into readable YAML.", "Developer", "json-yaml"),
  define("base64-encode", "Base64 Encode", "Encode Unicode text as Base64.", "Developer", "base64-encode"),
  define("base64-decode", "Base64 Decode", "Decode Base64 into Unicode text.", "Developer", "base64-decode"),
  define("url-encode", "URL Encode", "Percent-encode URL content.", "Developer", "url-encode"),
  define("url-decode", "URL Decode", "Decode percent-encoded URL content.", "Developer", "url-decode"),
  define("uuid-generator", "UUID Generator", "Generate a cryptographically secure UUID v4.", "Developer", "uuid", "generator", [], true),
  define("bulk-uuid-generator", "Bulk UUID Generator", "Generate multiple secure UUID v4 values.", "Developer", "bulk-uuid", "generator"),
  define("hash-generator", "Hash Generator SHA-256", "Calculate a SHA-256 digest locally.", "Developer", "sha256"),
  define("jwt-decoder", "JWT Decoder", "Decode JWT header and payload without verification.", "Developer", "jwt", "text", ["token"], false, ["Decoding does not verify the signature or establish trust."]),
  define("regex-tester", "Regex Tester", "Test a JavaScript regular expression against text.", "Developer", "regex"),
  define("timestamp-converter", "Timestamp Converter", "Convert Unix seconds or milliseconds to ISO time.", "Developer", "timestamp"),
  define("cron-expression-explainer", "Cron Expression Explainer Basic", "Explain common five-field cron expressions.", "Developer", "cron", "text", [], false, ["Advanced Quartz syntax and named calendars are not supported."]),
  define("html-formatter", "HTML Formatter Basic", "Indent common HTML structures.", "Developer", "html-format", "text", [], false, ["Embedded script and style blocks are treated as text."]),
  define("css-minifier", "CSS Minifier", "Remove comments and unnecessary CSS whitespace.", "Developer", "css-minify", "text", [], false, ["This performs safe basic minification, not semantic optimization."]),
  define("javascript-minifier", "JavaScript Minifier Basic", "Remove comments and redundant whitespace from simple JavaScript.", "Developer", "js-minify", "text", [], false, ["Use a compiler for production bundles; regex-heavy or template-literal code may require manual review."]),

  define("image-compressor", "Image Compressor", "Compress an image locally using canvas quality controls.", "Image", "image-compress", "image", [], true, imageLimits),
  define("image-resizer", "Image Resizer", "Resize an image to exact dimensions.", "Image", "image-resize", "image", [], false, imageLimits),
  define("image-cropper", "Image Cropper Basic", "Crop an image using numeric coordinates.", "Image", "image-crop", "image", [], false, ["The Phase 1 cropper uses precise numeric bounds rather than a drag overlay.", ...imageLimits]),
  define("png-to-jpg", "PNG to JPG", "Convert PNG images to JPEG locally.", "Image", "png-jpg", "image", [], false, ["Transparent pixels are flattened onto white.", ...imageLimits]),
  define("jpg-to-png", "JPG to PNG", "Convert JPEG images to PNG locally.", "Image", "jpg-png", "image", [], false, imageLimits),
  define("image-to-webp", "Image to WebP", "Convert common image formats to WebP.", "Image", "image-webp", "image", [], false, imageLimits),
  define("image-metadata-reader", "Image Metadata Reader Basic", "Read dimensions, type, and file size without uploading.", "Image", "image-metadata", "image", [], false, ["EXIF camera and GPS fields are not parsed in Phase 1."]),
  define("color-picker-image", "Color Picker from Image Basic", "Sample a pixel color from numeric image coordinates.", "Image", "image-color", "image", [], false, ["The Phase 1 picker uses numeric X/Y coordinates.", ...imageLimits]),

  define("pdf-merge", "PDF Merge", "Merge multiple PDFs in the selected order.", "PDF", "pdf-merge", "files", [], true, pdfLimits),
  define("pdf-split", "PDF Split", "Split a PDF into one file per page.", "PDF", "pdf-split", "pdf", [], false, pdfLimits),
  define("pdf-rotate", "PDF Rotate", "Rotate every PDF page by 90, 180, or 270 degrees.", "PDF", "pdf-rotate", "pdf", [], false, pdfLimits),
  define("images-to-pdf", "Images to PDF", "Create a PDF from PNG and JPEG images.", "PDF", "images-pdf", "files", [], false, imageLimits),
  define("extract-pdf-pages", "Extract PDF Pages", "Extract selected pages into a new PDF.", "PDF", "pdf-extract", "pdf", [], false, ["Page ranges use one-based numbers such as 1,3-5.", ...pdfLimits]),
  define("pdf-metadata-reader", "PDF Metadata Reader Basic", "Read page count and standard document metadata.", "PDF", "pdf-metadata", "pdf", [], false, ["Custom metadata and attachments are not parsed.", ...pdfLimits]),

  define("qr-code-generator", "QR Code Generator", "Generate a downloadable SVG QR code.", "Utility", "qr", "text", [], true),
  define("password-generator", "Password Generator", "Create strong customizable passwords.", "Utility", "password", "generator", [], true),
  define("upi-qr-generator", "UPI QR Generator", "Create a UPI payment QR with amount and note.", "Utility", "upi-qr", "text", ["payment"], false, ["Always verify the payee and amount in the payment app before authorising."]),
  define("color-converter", "Color Converter HEX/RGB/HSL", "Convert colors between HEX, RGB, and HSL.", "Utility", "color"),
  define("contrast-checker", "Contrast Checker", "Check WCAG contrast ratio for two colors.", "Utility", "contrast", "text", ["accessibility"], false, ["Contrast conformance also depends on text size, weight, and UI context."]),
];

export const toolBySlug = (slug: string) => tools.find((tool) => tool.slug === slug);
export const searchTools = (query: string) => {
  const normalized = query.toLowerCase().trim();
  return normalized ? tools.filter((tool) => [tool.name, tool.slug, tool.category, tool.description, ...tool.keywords].join(" ").toLowerCase().includes(normalized)) : tools;
};
