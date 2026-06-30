# Utility catalog and test specification

All 55 utilities are registered in `packages/tools-engine/registry.ts`. Text/developer/utility logic is in `packages/tools-engine/index.ts`; client-side image and PDF processing is in `packages/tools-engine/files.ts`. Text results return `output`, `stats`, `warnings`, and `metadata`; file workflows add downloadable blobs while retaining that result contract.

Every text utility is tested with valid and empty input, output types, deterministic repetition where applicable, and focused invalid/Unicode/large-input cases. Every image workflow has mocked browser-canvas unit coverage; PDF tests create real documents with `pdf-lib` and verify merge, split, rotation, extraction, conversion, and metadata.

## Text utilities

| Tool | Input → output | Limitation / specific test |
| --- | --- | --- |
| Word Counter | Text → word, character, line, reading stats | 100,000-word input regression |
| Character Counter | Unicode text → code-point and UTF-16 counts | `A🌍` counts as two user-visible code points |
| Sentence Counter | Text → punctuation-based sentence count | Abbreviations can affect estimates |
| Paragraph Counter | Text → non-empty block count | Empty input returns zero |
| Case Converter | Text + selected case → transformed text | Unicode case and invalid option tested |
| Slug Generator | Text → normalized URL slug | Accent removal tested with “Café” |
| Remove Duplicate Lines | Lines → first unique occurrences | Reports removed count |
| Sort Lines | Lines + order → locale/numeric sorting | Ascending and descending supported |
| Reverse Text | Text → reversed code points | Emoji remains intact |
| Text Diff Basic | Two blocks separated by `---` → line diff | Line-based; moved blocks not detected |
| Find and Replace | Text + find/replacement → replaced text | Literal matching avoids regex injection |
| Remove Extra Spaces | Text → normalized whitespace | Paragraph breaks preserved |
| Lorem Ipsum Generator | Paragraph count → deterministic copy | Constrained to 1–20 paragraphs |
| Text to CSV Basic | Delimited lines → escaped CSV | Selected delimiter assumed |
| CSV to Text Basic | Quoted CSV → delimited text | Escaped quotes and commas tested |

## Developer utilities

| Tool | Input → output | Limitation / specific test |
| --- | --- | --- |
| JSON Formatter | JSON → indented JSON | Invalid syntax returns friendly error |
| JSON Validator | JSON → validity and type | Empty input invalid |
| JSON Minifier | JSON → compact JSON and savings | Semantic round trip tested |
| JSON to CSV | Object array → CSV | Nested values serialized as JSON strings |
| CSV to JSON | CSV → object array | Quoted comma test |
| YAML to JSON | YAML → formatted JSON | Custom tags unsupported |
| JSON to YAML | JSON → YAML | Invalid JSON reported |
| Base64 Encode | Unicode text → Base64 | Unicode round-trip test |
| Base64 Decode | Base64 → Unicode text | Invalid alphabet rejected |
| URL Encode | Text → percent encoding | Reserved characters tested |
| URL Decode | Encoded text → decoded text | Invalid escapes reported |
| UUID Generator | None → secure UUID v4 | Format/version tested; nondeterministic by design |
| Bulk UUID Generator | Count → newline UUID list | Count constrained to 1–1,000 |
| SHA-256 Hash | Text → 64-character digest | Official `abc` known vector tested |
| JWT Decoder | JWT → header and payload JSON | Signature is explicitly not verified |
| Regex Tester | Pattern, flags, text → matches | Invalid expression reported |
| Timestamp Converter | Unix/date input → ISO and epoch values | Seconds and milliseconds distinguished |
| Cron Explainer Basic | Five fields → readable schedule | Quartz extensions unsupported |
| HTML Formatter Basic | HTML → indented markup | Embedded script/style treated as text |
| CSS Minifier | CSS → safe whitespace minification | Not a semantic optimizer |
| JavaScript Minifier Basic | Simple JS → compact JS | Complex regex/templates require review |

## Image utilities

| Tool | Input → output | Limitation / specific test |
| --- | --- | --- |
| Image Compressor | Image + quality → JPEG/WebP blob | Browser memory and metadata limits |
| Image Resizer | Image + width/height → resized blob | Dimensions constrained to 12,000 px |
| Image Cropper Basic | Image + numeric bounds → cropped PNG | Numeric crop rather than drag overlay |
| PNG to JPG | PNG → white-flattened JPEG | Transparency intentionally flattened |
| JPG to PNG | JPEG → PNG | Does not restore lost JPEG detail |
| Image to WebP | Image → WebP | Browser codec support required |
| Image Metadata Reader | Image → dimensions/type/size | EXIF camera/GPS fields not parsed |
| Color Picker from Image | Image + X/Y → HEX/RGBA | Numeric coordinate picker in Phase 1 |

## PDF utilities

| Tool | Input → output | Limitation / specific test |
| --- | --- | --- |
| PDF Merge | Two-plus PDFs → merged PDF | Real three-page merge test |
| PDF Split | PDF → one PDF per page | Real three-output split test |
| PDF Rotate | PDF + angle → rotated PDF | 90/180/270-degree validation |
| Images to PDF | PNG/JPEG files → PDF | One real PNG embedding test |
| Extract PDF Pages | PDF + ranges → selected-page PDF | `1,3-4` extraction test |
| PDF Metadata Reader | PDF → page count and standard metadata | Custom metadata/attachments excluded |

## General utilities

| Tool | Input → output | Limitation / specific test |
| --- | --- | --- |
| QR Code Generator | Text/URL → downloadable SVG QR | Real QR module matrix, not a placeholder |
| Password Generator | Length/sets → secure random password | At least one character set required |
| UPI QR Generator | UPI ID, amount, name, note → SVG QR | Payment app verification warning always shown |
| HEX/RGB/HSL Converter | HEX → HEX, RGB, and HSL | Phase 1 input is HEX |
| Contrast Checker | Two HEX colors → WCAG ratio/pass flags | Black/white known ratio is 21:1 |

Run utility tests with `pnpm vitest run packages/tools-engine` or the full gate with `pnpm test:coverage`.
