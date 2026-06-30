import { describe, expect, it } from "vitest";
import { runTool, tools } from ".";

const inputs: Record<string, string> = {
  "word-count": "Clear decisions start here.", "character-count": "नमस्ते 🌍", "sentence-count": "One. Two? Three!", "paragraph-count": "One\n\nTwo", case: "hello WORLD", slug: "Café au lait",
  dedupe: "a\na\nb", sort: "z\na\n10\n2", reverse: "A🌍B", "text-diff": "old\nshared\n---\nnew\nshared", "find-replace": "hello world", spaces: "too   many\n\n spaces", lorem: "",
  "text-csv": "name|score\nAsha|91", "csv-text": 'name,note\nAsha,"clear, calm"', "json-format": '{"a":1}', "json-valid": "[]", "json-minify": '{ "a": 1 }', "json-csv": '[{"a":1,"b":"x"}]', "csv-json": "a,b\n1,x",
  "yaml-json": "ready: true", "json-yaml": '{"ready":true}', "base64-encode": "नमस्ते", "base64-decode": "SGVsbG8=", "url-encode": "hello world?", "url-decode": "hello%20world%3F",
  uuid: "", "bulk-uuid": "", sha256: "abc", jwt: "eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIn0.", regex: "DS-1042", timestamp: "1767225600", cron: "0 9 * * 1-5",
  "html-format": "<main><p>Hello</p></main>", "css-minify": ".a { color: red; }", "js-minify": "const value = 1; // note", qr: "https://datastorified.com", password: "", "upi-qr": "demo@upi", color: "#2563EB", contrast: "#111827 #FFFFFF",
};
const options: Record<string, Record<string, string | number | boolean>> = {
  case: { case: "title" }, sort: { order: "asc" }, "find-replace": { find: "world", replace: "team" }, lorem: { paragraphs: 2 }, "text-csv": { delimiter: "|" }, "csv-text": { delimiter: " | " },
  "bulk-uuid": { count: 3 }, regex: { pattern: "DS-\\d{4}", flags: "g" }, password: { length: 18, uppercase: true, lowercase: true, numbers: true, symbols: true }, "upi-qr": { name: "Demo", amount: 10, note: "Test" },
};

describe("utility catalog", () => {
  it("contains all 55 production utilities with unique routes and no mocks", () => {
    expect(tools).toHaveLength(55);
    expect(new Set(tools.map((tool) => tool.slug)).size).toBe(55);
    expect(tools.some((tool) => tool.mode === "mock")).toBe(false);
  });

  tools.filter((tool) => ["text", "generator"].includes(tool.inputKind)).forEach((tool) => {
    describe(tool.name, () => {
      it("handles valid input and returns the complete utility contract", () => {
        const result = runTool(tool.mode, inputs[tool.mode] ?? "sample", options[tool.mode] ?? {});
        expect(result.valid, result.warnings.join(" ")).toBe(true);
        expect(typeof result.output).toBe("string");
        expect(typeof result.stats).toBe("object");
        expect(Array.isArray(result.warnings)).toBe(true);
        expect(typeof result.metadata).toBe("object");
      });

      it("handles empty input without throwing", () => {
        const result = runTool(tool.mode, "", options[tool.mode] ?? {});
        expect(typeof result.valid).toBe("boolean");
        expect(typeof result.output).toBe("string");
      });

      if (!["uuid", "bulk-uuid", "password"].includes(tool.mode)) it("is deterministic for identical input", () => {
        const first = runTool(tool.mode, inputs[tool.mode] ?? "sample", options[tool.mode] ?? {});
        const second = runTool(tool.mode, inputs[tool.mode] ?? "sample", options[tool.mode] ?? {});
        expect(second).toEqual(first);
      });
    });
  });
});

describe("utility known examples and edge cases", () => {
  it("counts Unicode characters by code point", () => expect(runTool("character-count", "A🌍").stats.Characters).toBe(2));
  it("round-trips Unicode Base64", () => { const encoded = runTool("base64-encode", "नमस्ते 🌍").output; expect(runTool("base64-decode", encoded).output).toBe("नमस्ते 🌍"); });
  it("calculates the SHA-256 known vector", () => expect(runTool("sha256", "abc").output).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"));
  it("parses quoted CSV fields", () => expect(runTool("csv-json", 'name,note\nAsha,"clear, calm"').output).toContain("clear, calm"));
  it("reports invalid JSON", () => expect(runTool("json-format", "{").valid).toBe(false));
  it("reports invalid Base64", () => expect(runTool("base64-decode", "***").valid).toBe(false));
  it("reports invalid regex", () => expect(runTool("regex", "test", { pattern: "[", flags: "g" }).valid).toBe(false));
  it("handles a large text input", () => expect(runTool("word-count", `${"word ".repeat(100_000)}`).stats.Words).toBe(100_000));
  it("creates valid QR SVG rather than a placeholder", () => expect(runTool("qr", "https://datastorified.com").output).toMatch(/^<svg[\s\S]+<path/u));
  it("checks WCAG contrast", () => expect(runTool("contrast", "#000000 #FFFFFF").stats.Ratio).toBe(21));
  it("rejects unknown modes", () => expect(runTool("unknown", "sample").valid).toBe(false));
});
