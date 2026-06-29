export * from "./registry";
export * from "./files";

import { load as parseYaml, dump as toYaml } from "js-yaml";
import QRCode from "qrcode";
import { z } from "zod";

export type UtilityScalar = string | number | boolean;
export type UtilityResult = {
  output: string;
  stats: Record<string, UtilityScalar>;
  warnings: string[];
  metadata: Record<string, UtilityScalar>;
  valid: boolean;
};

const success = (output: string, stats: UtilityResult["stats"] = {}, metadata: UtilityResult["metadata"] = {}, warnings: string[] = []): UtilityResult => ({ output, stats, warnings, metadata, valid: true });
const failure = (message: string): UtilityResult => ({ output: "", stats: {}, warnings: [message], metadata: { error: message }, valid: false });
const inputSchema = z.string().max(5_000_000, "Input is too large for this browser tool.");
const words = (input: string) => input.trim() ? input.trim().split(/\s+/u).length : 0;
const unicodeLength = (input: string) => [...input].length;
const lines = (input: string) => input ? input.split(/\r?\n/u) : [];
const escapeCsv = (value: unknown) => {
  const string = typeof value === "string" ? value : value === null || value === undefined ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
  return /[",\n\r]/u.test(string) ? `"${string.replace(/"/gu, '""')}"` : string;
};
const parseCsv = (input: string): string[][] => {
  const rows: string[][] = []; let row: string[] = []; let field = ""; let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') { field += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"' && field === "") quoted = true;
    else if (character === ",") { row.push(field); field = ""; }
    else if (character === "\n") { row.push(field.replace(/\r$/u, "")); rows.push(row); row = []; field = ""; }
    else field += character;
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field.");
  if (field !== "" || row.length > 0) { row.push(field.replace(/\r$/u, "")); rows.push(row); }
  return rows;
};
const base64Encode = (input: string) => {
  const bytes = new TextEncoder().encode(input); let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
};
const base64Decode = (input: string) => {
  if (!/^[A-Za-z0-9+/]*={0,2}$/u.test(input.replace(/\s/gu, ""))) throw new Error("Enter valid Base64 content.");
  const binary = atob(input.replace(/\s/gu, ""));
  return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
};
const secureUuid = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16); globalThis.crypto?.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

// Compact synchronous SHA-256 keeps the utility deterministic in browsers and tests.
const sha256 = (text: string) => {
  const rightRotate = (value: number, amount: number) => value >>> amount | value << (32 - amount);
  const maxWord = 2 ** 32; const words32: number[] = []; const ascii = unescape(encodeURIComponent(text)); const length = ascii.length * 8;
  const hash: number[] = []; const constants: number[] = []; const composite: Record<number, boolean> = {};
  for (let candidate = 2, primeCount = 0; primeCount < 64; candidate += 1) if (!composite[candidate]) {
    for (let multiple = candidate * candidate; multiple < 313; multiple += candidate) composite[multiple] = true;
    hash[primeCount] = (candidate ** .5 * maxWord) | 0; constants[primeCount] = (candidate ** (1 / 3) * maxWord) | 0; primeCount += 1;
  }
  let padded = `${ascii}\x80`; while (padded.length % 64 !== 56) padded += "\x00";
  for (let index = 0; index < padded.length; index += 1) words32[index >> 2] |= padded.charCodeAt(index) << ((3 - index) % 4) * 8;
  words32.push((length / maxWord) | 0, length);
  for (let block = 0; block < words32.length; block += 16) {
    const schedule = words32.slice(block, block + 16); const oldHash = hash.slice(0); let working = hash.slice(0, 8);
    for (let index = 0; index < 64; index += 1) {
      const w15 = schedule[index - 15]; const w2 = schedule[index - 2];
      const a = working[0]; const e = working[4];
      const temp1 = working[7] + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + (e & working[5] ^ ~e & working[6]) + constants[index] + (schedule[index] = index < 16 ? schedule[index] : (schedule[index - 16] + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ w15 >>> 3) + schedule[index - 7] + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ w2 >>> 10)) | 0);
      const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + (a & working[1] ^ a & working[2] ^ working[1] & working[2]);
      working = [(temp1 + temp2) | 0, working[0], working[1], working[2], (working[3] + temp1) | 0, working[4], working[5], working[6]];
    }
    for (let index = 0; index < 8; index += 1) hash[index] = (working[index] + oldHash[index]) | 0;
  }
  return hash.map((value) => (value >>> 0).toString(16).padStart(8, "0")).join("");
};

const qrSvg = (content: string) => {
  if (!content.trim()) throw new Error("Enter content for the QR code.");
  const qr = QRCode.create(content, { errorCorrectionLevel: "M" });
  const size = qr.modules.size; const cells: string[] = [];
  for (let row = 0; row < size; row += 1) for (let column = 0; column < size; column += 1) if (qr.modules.get(row, column)) cells.push(`M${column + 4} ${row + 4}h1v1h-1z`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size + 8} ${size + 8}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${cells.join("")}" fill="#111827"/></svg>`;
};

type RGB = { r: number; g: number; b: number };
const parseHex = (input: string): RGB => {
  const match = input.trim().match(/^#?([\da-f]{3}|[\da-f]{6})$/iu); if (!match) throw new Error("Use a HEX color such as #2563EB.");
  const value = match[1].length === 3 ? [...match[1]].map((character) => character + character).join("") : match[1];
  return { r: Number.parseInt(value.slice(0, 2), 16), g: Number.parseInt(value.slice(2, 4), 16), b: Number.parseInt(value.slice(4, 6), 16) };
};
const toHex = ({ r, g, b }: RGB) => `#${[r, g, b].map((value) => Math.round(value).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
const rgbToHsl = ({ r, g, b }: RGB) => {
  const red = r / 255; const green = g / 255; const blue = b / 255; const max = Math.max(red, green, blue); const min = Math.min(red, green, blue); const light = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: light * 100 };
  const delta = max - min; const saturation = light > .5 ? delta / (2 - max - min) : delta / (max + min);
  const hue = max === red ? (green - blue) / delta + (green < blue ? 6 : 0) : max === green ? (blue - red) / delta + 2 : (red - green) / delta + 4;
  return { h: hue * 60, s: saturation * 100, l: light * 100 };
};
const luminance = ({ r, g, b }: RGB) => [r, g, b].map((value) => { const channel = value / 255; return channel <= .03928 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4; }).reduce((sum, channel, index) => sum + channel * [.2126, .7152, .0722][index], 0);

const cronPart = (part: string, singular: string, plural: string) => {
  if (part === "*") return `every ${singular}`;
  if (/^\*\/\d+$/u.test(part)) return `every ${part.slice(2)} ${plural}`;
  if (/^\d+$/u.test(part)) return `${singular} ${part}`;
  if (/^\d+(,\d+)+$/u.test(part)) return `${plural} ${part}`;
  return `${plural} matching “${part}”`;
};

export function runTool(mode: string, rawInput: string, options: Record<string, UtilityScalar> = {}): UtilityResult {
  const parsedInput = inputSchema.safeParse(rawInput);
  if (!parsedInput.success) return failure(parsedInput.error.issues[0]?.message ?? "Invalid input.");
  const input = parsedInput.data;
  try {
    switch (mode) {
      case "word-count": return success(`${words(input)} words`, { Words: words(input), Characters: unicodeLength(input), "Without spaces": unicodeLength(input.replace(/\s/gu, "")), Lines: lines(input).length, "Reading time": `${Math.ceil(words(input) / 200)} min` });
      case "character-count": return success(`${unicodeLength(input)} characters`, { Characters: unicodeLength(input), "UTF-16 units": input.length, "Without spaces": unicodeLength(input.replace(/\s/gu, "")), Words: words(input), Lines: lines(input).length });
      case "sentence-count": { const count = (input.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/gu) ?? []).filter((item) => item.trim()).length; return success(`${count} sentences`, { Sentences: count, Words: words(input) }); }
      case "paragraph-count": { const count = input.trim() ? input.trim().split(/\n\s*\n/gu).filter(Boolean).length : 0; return success(`${count} paragraphs`, { Paragraphs: count, Lines: lines(input).length, Words: words(input) }); }
      case "case": {
        const type = String(options.case ?? "upper");
        const transformed: Record<string, string> = { upper: input.toLocaleUpperCase(), lower: input.toLocaleLowerCase(), title: input.toLocaleLowerCase().replace(/\b[\p{L}\p{N}]/gu, (character) => character.toLocaleUpperCase()), sentence: input.toLocaleLowerCase().replace(/(^\s*\p{L}|[.!?]\s+\p{L})/gu, (character) => character.toLocaleUpperCase()), camel: input.trim().toLocaleLowerCase().replace(/[^\p{L}\p{N}]+(.)/gu, (_, character: string) => character.toLocaleUpperCase()) };
        if (!(type in transformed)) throw new Error("Choose a valid case conversion."); return success(transformed[type]);
      }
      case "slug": return success(input.toLocaleLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/gu, "").replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, ""));
      case "dedupe": { const original = lines(input); const output = [...new Set(original)].join("\n"); return success(output, { "Original lines": original.length, "Unique lines": lines(output).length, Removed: original.length - lines(output).length }); }
      case "sort": { const sorted = lines(input).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })); if (options.order === "desc") sorted.reverse(); return success(sorted.join("\n"), { Lines: sorted.length }); }
      case "reverse": return success([...input].reverse().join(""), { Characters: unicodeLength(input) });
      case "text-diff": { const [before = "", after = ""] = input.split(/\n---\n/u, 2); const a = lines(before); const b = lines(after); const output = [...new Set([...a, ...b])].map((line) => a.includes(line) && b.includes(line) ? `  ${line}` : a.includes(line) ? `- ${line}` : `+ ${line}`).join("\n"); return success(output, { Added: b.filter((line) => !a.includes(line)).length, Removed: a.filter((line) => !b.includes(line)).length }, {}, ["Separate the two versions with a line containing ---."]); }
      case "find-replace": { const find = String(options.find ?? ""); if (!find) throw new Error("Enter text to find."); const replacement = String(options.replace ?? ""); const sensitive = Boolean(options.caseSensitive); const expression = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), sensitive ? "gu" : "giu"); const matches = input.match(expression)?.length ?? 0; return success(input.replace(expression, replacement), { Replacements: matches }); }
      case "spaces": return success(input.split(/\n\s*\n/gu).map((paragraph) => paragraph.replace(/[\t ]+/gu, " ").replace(/ *\n */gu, "\n").trim()).join("\n\n"));
      case "lorem": { const paragraph = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."; const count = Math.max(1, Math.min(20, Number(options.paragraphs ?? 3))); return success(Array.from({ length: count }, () => paragraph).join("\n\n"), { Paragraphs: count, Words: words(paragraph) * count }); }
      case "text-csv": { const delimiter = String(options.delimiter ?? "|"); const rows = lines(input).map((line) => line.split(delimiter).map(escapeCsv).join(",")); return success(rows.join("\n"), { Rows: rows.length }); }
      case "csv-text": { const delimiter = String(options.delimiter ?? " | "); const rows = parseCsv(input); return success(rows.map((row) => row.join(delimiter)).join("\n"), { Rows: rows.length, Columns: Math.max(0, ...rows.map((row) => row.length)) }); }

      case "json-format": { const value: unknown = JSON.parse(input); return success(JSON.stringify(value, null, 2), {}, { Type: Array.isArray(value) ? "array" : typeof value }); }
      case "json-valid": { const value: unknown = JSON.parse(input); return success("Valid JSON", {}, { Type: Array.isArray(value) ? "array" : typeof value }); }
      case "json-minify": { const value: unknown = JSON.parse(input); const output = JSON.stringify(value); return success(output, { "Original size": input.length, "Minified size": output.length, Saved: `${input.length ? Math.max(0, (1 - output.length / input.length) * 100).toFixed(1) : 0}%` }); }
      case "json-csv": { const value: unknown = JSON.parse(input); if (!Array.isArray(value) || value.some((item) => !item || typeof item !== "object" || Array.isArray(item))) throw new Error("Enter a JSON array of objects."); const records = value as Record<string, unknown>[]; const headers = [...new Set(records.flatMap((record) => Object.keys(record)))]; const output = [headers.map(escapeCsv).join(","), ...records.map((record) => headers.map((header) => escapeCsv(record[header])).join(","))].join("\n"); return success(output, { Rows: records.length, Columns: headers.length }); }
      case "csv-json": { const rows = parseCsv(input); if (!rows.length) return success("[]", { Rows: 0 }); const [headers, ...body] = rows; const output = body.filter((row) => row.some(Boolean)).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]))); return success(JSON.stringify(output, null, 2), { Rows: output.length, Columns: headers.length }); }
      case "yaml-json": { const value = parseYaml(input); return success(JSON.stringify(value, null, 2)); }
      case "json-yaml": { const value: unknown = JSON.parse(input); return success(toYaml(value, { noRefs: true, lineWidth: 100 })); }
      case "base64-encode": return success(base64Encode(input), { "Input bytes": new TextEncoder().encode(input).length });
      case "base64-decode": return success(base64Decode(input));
      case "url-encode": return success(encodeURIComponent(input));
      case "url-decode": return success(decodeURIComponent(input));
      case "uuid": return success(secureUuid(), {}, { Version: 4 });
      case "bulk-uuid": { const count = Math.max(1, Math.min(1000, Number(options.count ?? 10))); return success(Array.from({ length: count }, secureUuid).join("\n"), { Generated: count }); }
      case "sha256": return success(sha256(input), { Bits: 256 }, { Algorithm: "SHA-256" });
      case "jwt": { const parts = input.trim().split("."); if (parts.length !== 3) throw new Error("A JWT must have three dot-separated parts."); const decodePart = (part: string) => JSON.parse(base64Decode(part.replace(/-/gu, "+").replace(/_/gu, "/").padEnd(Math.ceil(part.length / 4) * 4, "="))) as unknown; const header = decodePart(parts[0]); const payload = decodePart(parts[1]); return success(JSON.stringify({ header, payload }, null, 2), {}, { Signature: "Not verified" }, ["Decoded only—the signature has not been verified."]); }
      case "regex": { const pattern = String(options.pattern ?? ""); if (!pattern) throw new Error("Enter a regular expression."); const requested = String(options.flags ?? "g"); const flags = requested.includes("g") ? requested : `${requested}g`; const expression = new RegExp(pattern, flags); const matches = [...input.matchAll(expression)]; return success(matches.map((match, index) => `${index + 1}. ${match[0]} (index ${match.index})`).join("\n"), { Matches: matches.length }, { Pattern: pattern, Flags: flags }); }
      case "timestamp": { const numeric = Number(input.trim()); const date = Number.isFinite(numeric) ? new Date(numeric < 1e12 ? numeric * 1000 : numeric) : new Date(input.trim()); if (Number.isNaN(date.getTime())) throw new Error("Enter Unix seconds, milliseconds, or a valid date string."); return success(date.toISOString(), { "Unix seconds": Math.floor(date.getTime() / 1000), "Unix milliseconds": date.getTime() }, { UTC: date.toUTCString() }); }
      case "cron": { const parts = input.trim().split(/\s+/u); if (parts.length !== 5) throw new Error("Enter a standard five-field cron expression."); const [minute, hour, day, month, weekday] = parts; return success(`${cronPart(minute, "minute", "minutes")}; ${cronPart(hour, "hour", "hours")}; ${cronPart(day, "day of month", "days of month")}; ${cronPart(month, "month", "months")}; ${cronPart(weekday, "weekday", "weekdays")}.`, {}, { Fields: "minute hour day month weekday" }); }
      case "html-format": { const formatted = input.replace(/>\s*</gu, "><").replace(/(<\/?[^>]+>)/gu, "\n$1\n").split("\n").map((line) => line.trim()).filter(Boolean); let depth = 0; const output = formatted.map((line) => { if (/^<\//u.test(line)) depth = Math.max(0, depth - 1); const indented = `${"  ".repeat(depth)}${line}`; if (/^<[^/!][^>]*>$/u.test(line) && !/\/(?:>|$)|^<(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)\b/iu.test(line) && !line.includes("</")) depth += 1; return indented; }).join("\n"); return success(output); }
      case "css-minify": { const output = input.replace(/\/\*[\s\S]*?\*\//gu, "").replace(/\s+/gu, " ").replace(/\s*([{}:;,>])\s*/gu, "$1").replace(/;}/gu, "}").trim(); return success(output, { "Original size": input.length, "Minified size": output.length }); }
      case "js-minify": { const output = input.replace(/\/\*[\s\S]*?\*\//gu, "").replace(/(^|[^:])\/\/.*$/gmu, "$1").replace(/\s+/gu, " ").replace(/\s*([{}();,:=+*<>])\s*/gu, "$1").trim(); return success(output, { "Original size": input.length, "Minified size": output.length }, {}, ["Basic minification only; review complex regular expressions and template literals."]); }

      case "qr": { const output = qrSvg(input); return success(output, { Characters: unicodeLength(input) }, { Format: "SVG" }); }
      case "password": { const length = Math.max(8, Math.min(128, Number(options.length ?? 18))); const sets = `${options.uppercase === false ? "" : "ABCDEFGHJKLMNPQRSTUVWXYZ"}${options.lowercase === false ? "" : "abcdefghijkmnopqrstuvwxyz"}${options.numbers === false ? "" : "23456789"}${options.symbols === false ? "" : "!@#$%&*"}`; if (!sets) throw new Error("Enable at least one character set."); const random = new Uint32Array(length); crypto.getRandomValues(random); const output = [...random].map((value) => sets[value % sets.length]).join(""); return success(output, { Length: length, "Character pool": sets.length }, { Entropy: `${Math.floor(length * Math.log2(sets.length))} bits` }); }
      case "upi-qr": { const payee = input.trim(); if (!/^[\w.-]+@[\w.-]+$/u.test(payee)) throw new Error("Enter a valid UPI ID such as name@bank."); const amount = Number(options.amount ?? 0); if (!Number.isFinite(amount) || amount < 0) throw new Error("Enter a valid non-negative amount."); const params = new URLSearchParams({ pa: payee, pn: String(options.name ?? "Payee"), cu: "INR" }); if (amount > 0) params.set("am", amount.toFixed(2)); if (options.note) params.set("tn", String(options.note)); const uri = `upi://pay?${params.toString()}`; return success(qrSvg(uri), { Amount: amount }, { "UPI URI": uri, Format: "SVG" }, ["Verify the payee and amount in your payment app before authorising."]); }
      case "color": { const rgb = parseHex(input); const hsl = rgbToHsl(rgb); return success(`${toHex(rgb)}\nrgb(${rgb.r}, ${rgb.g}, ${rgb.b})\nhsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`, { Red: rgb.r, Green: rgb.g, Blue: rgb.b }, { HEX: toHex(rgb) }); }
      case "contrast": { const colors = input.trim().split(/\s+/u); if (colors.length < 2) throw new Error("Enter foreground and background HEX colors separated by a space."); const first = parseHex(colors[0]); const second = parseHex(colors[1]); const ratio = (Math.max(luminance(first), luminance(second)) + .05) / (Math.min(luminance(first), luminance(second)) + .05); return success(`${ratio.toFixed(2)}:1`, { Ratio: Number(ratio.toFixed(2)), "AA normal text": ratio >= 4.5, "AA large text": ratio >= 3, "AAA normal text": ratio >= 7 }, { Foreground: toHex(first), Background: toHex(second) }); }
      default: return failure("This utility is not implemented.");
    }
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Something went wrong.");
  }
}
