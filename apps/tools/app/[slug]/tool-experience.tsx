"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileUp, Heart, Play, RefreshCw, ShieldCheck } from "lucide-react";
import { processImage, processPdf, runTool, tools, type FileLike, type FileUtilityResult, type ToolDefinition, type UtilityResult, type UtilityScalar } from "@datastorified/tools-engine";
import { storage } from "@datastorified/storage";
import { trackFavorite, trackToolUsed } from "@datastorified/analytics";
import { Badge, BottomNav, Breadcrumb, Button, Card, CopyButton, FAQ, Footer, Header, Input, InsightCard, Tabs, Textarea, ToolCard } from "@datastorified/ui";
import { SmartNumberInput } from "@datastorified/ui/smart-number-input";

const samples: Record<string, string> = {
  "json-format": '{"decision":"clear","confidence":82,"nextSteps":["compare","verify","act"]}',
  "json-valid": '{"valid":true}', "json-minify": '{\n  "name": "DataStorified",\n  "ready": true\n}', "json-csv": '[{"name":"Asha","score":91},{"name":"Kabir","score":87}]',
  "csv-json": "name,score\nAsha,91\nKabir,87", "yaml-json": "name: DataStorified\nfeatures:\n  - calculators\n  - tools", "json-yaml": '{"name":"DataStorified","ready":true}',
  regex: "Order IDs: DS-1042, DS-2088 and invalid D-3.", timestamp: "1767225600", cron: "0 9 * * 1-5", "html-format": "<main><h1>Hello</h1><p>Clear tools.</p></main>",
  "css-minify": ".card {\n  color: #2563eb;\n  padding: 1rem;\n}", "js-minify": "function greet(name) {\n  return `Hello ${name}`;\n}",
  "text-diff": "First version\nShared line\n---\nSecond version\nShared line", "find-replace": "Clear decisions start with clear inputs.",
  "text-csv": "name|score\nAsha|91\nKabir|87", "csv-text": "name,score\nAsha,91\nKabir,87", jwt: "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJkZW1vIiwicm9sZSI6InJlYWRlciJ9.",
  color: "#2563EB", contrast: "#111827 #FFFFFF", "upi-qr": "demo@upi", qr: "https://datastorified.com",
};
const sampleFor = (mode: string) => samples[mode] ?? "Paste or type your content here. DataStorified keeps the work in your browser.";
const defaultOptions: Record<string, UtilityScalar> = { case: "upper", order: "asc", find: "clear", replace: "better", delimiter: "|", paragraphs: 3, pattern: "DS-\\d{4}", flags: "g", count: 10, length: 18, uppercase: true, lowercase: true, numbers: true, symbols: true, amount: 0, name: "Payee", note: "", width: 800, height: 600, quality: .8, x: 0, y: 0, rotation: 90, pages: "1" };

export default function ToolExperience({ tool }: { tool: ToolDefinition }) {
  const [input, setInput] = useState(sampleFor(tool.mode));
  const [options, setOptions] = useState<Record<string, UtilityScalar>>(defaultOptions);
  const [favorite, setFavorite] = useState(false);
  const [ready, setReady] = useState(false);
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    setInput(storage.getDraft(`tool:${tool.slug}`, sampleFor(tool.mode)));
    storage.addRecent("tools", tool.slug);
    setFavorite(storage.getFavorites("tools").includes(tool.slug));
    trackToolUsed(tool.slug);
    setReady(true);
  }, [tool.mode, tool.slug]);
  useEffect(() => { if (ready && tool.inputKind === "text") storage.saveDraft(`tool:${tool.slug}`, input); }, [input, ready, tool.inputKind, tool.slug]);

  const toggleFavorite = () => {
    const active = storage.toggleFavorite("tools", tool.slug); setFavorite(active); trackFavorite(tool.slug, "tool", active);
  };
  const related = tools.filter((candidate) => candidate.category === tool.category && candidate.slug !== tool.slug).slice(0, 3);
  const faq = [
    { question: `Does ${tool.name} upload my data?`, answer: "No. Phase 1 processing happens locally in your browser. Selected files and text are not uploaded to DataStorified." },
    { question: `What are the limitations of ${tool.name}?`, answer: tool.limitations.join(" ") || "This tool handles the documented client-side workflow and reports invalid input instead of silently changing it." },
  ];

  return <>
    <Header surface="tools" />
    <main className="mx-auto max-w-7xl px-4 pb-32 pt-7 sm:px-6">
      <Breadcrumb items={[{ label: "Tools", href: "/" }, { label: tool.category, href: "/#categories" }, { label: tool.name }]} />
      <div className="mt-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><Badge>{tool.category}</Badge><h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">{tool.name}</h1><p className="mt-3 max-w-2xl text-lg leading-8 text-muted">{tool.description}</p></div>
        <Button variant="secondary" onClick={toggleFavorite}><Heart size={17} className={favorite ? "fill-danger text-danger" : ""} />{favorite ? "Saved" : "Favorite"}</Button>
      </div>

      <div className="mt-10">
        {tool.inputKind === "image" || tool.inputKind === "pdf" || tool.inputKind === "files"
          ? <FileWorkspace tool={tool} options={options} setOptions={setOptions} />
          : <TextWorkspace tool={tool} input={input} setInput={setInput} options={options} setOptions={setOptions} generation={generation} rerun={() => setGeneration((value) => value + 1)} />}
      </div>

      <div className="mt-6"><InsightCard title="Private by design">This tool runs on your device. Your content is not sent to a DataStorified server.</InsightCard></div>
      <section className="mt-16"><h2 className="text-2xl font-bold sm:text-3xl">Related tools</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{related.map((candidate) => <ToolCard key={candidate.slug} name={candidate.name} description={candidate.description} category={candidate.category} href={`/${candidate.slug}`} />)}</div></section>
      <section className="mt-16"><h2 className="text-2xl font-bold sm:text-3xl">Frequently asked questions</h2><div className="mt-5"><FAQ items={faq} /></div></section>
    </main>
    <Footer /><BottomNav />
  </>;
}

function TextWorkspace({ tool, input, setInput, options, setOptions, generation, rerun }: { tool: ToolDefinition; input: string; setInput: (value: string) => void; options: Record<string, UtilityScalar>; setOptions: (value: Record<string, UtilityScalar>) => void; generation: number; rerun: () => void }) {
  const output = useMemo(() => { void generation; return runTool(tool.mode, input, options); }, [generation, input, options, tool.mode]);
  const isGenerator = tool.inputKind === "generator";
  const isQr = ["qr", "upi-qr"].includes(tool.mode);
  return <div className="grid items-start gap-5 lg:grid-cols-2">
    <Card className="p-5 sm:p-7">
      <div className="flex items-center justify-between"><h2 className="text-lg font-bold">{isGenerator ? "Options" : "Input"}</h2>{!isGenerator && <button onClick={() => setInput("")} className="text-sm font-semibold text-muted hover:text-primary">Clear</button>}</div>
      <ToolOptions mode={tool.mode} options={options} setOptions={setOptions} />
      {!isGenerator && <Textarea aria-label={`${tool.name} input`} className="mt-4 min-h-72 font-mono text-sm" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Start typing…" />}
      {isGenerator && <Button className="mt-5 w-full" onClick={rerun}><RefreshCw size={16} /> Generate new</Button>}
    </Card>
    <ResultPanel tool={tool} result={output} isQr={isQr} />
  </div>;
}

function ToolOptions({ mode, options, setOptions }: { mode: string; options: Record<string, UtilityScalar>; setOptions: (value: Record<string, UtilityScalar>) => void }) {
  const update = (key: string, value: UtilityScalar) => setOptions({ ...options, [key]: value });
  return <>
    {mode === "case" && <div className="mt-4"><Tabs items={["upper", "lower", "title", "sentence", "camel"]} value={String(options.case)} onChange={(value) => update("case", value)} /></div>}
    {mode === "sort" && <div className="mt-4"><Tabs items={["asc", "desc"]} value={String(options.order)} onChange={(value) => update("order", value)} /></div>}
    {mode === "find-replace" && <div className="mt-4 grid gap-3 sm:grid-cols-2"><Input aria-label="Find" value={String(options.find)} onChange={(event) => update("find", event.target.value)} placeholder="Find" /><Input aria-label="Replace" value={String(options.replace)} onChange={(event) => update("replace", event.target.value)} placeholder="Replace" /></div>}
    {["text-csv", "csv-text"].includes(mode) && <label className="mt-4 block"><span className="mb-2 block text-sm font-semibold">Delimiter</span><Input value={String(options.delimiter)} onChange={(event) => update("delimiter", event.target.value)} /></label>}
    {mode === "lorem" && <NumberOption label="Paragraphs" value={Number(options.paragraphs)} min={1} max={20} onChange={(value) => update("paragraphs", value)} />}
    {mode === "bulk-uuid" && <NumberOption label="Number of UUIDs" value={Number(options.count)} min={1} max={1000} onChange={(value) => update("count", value)} />}
    {mode === "regex" && <div className="mt-4 grid grid-cols-[1fr_80px] gap-2"><Input aria-label="Pattern" value={String(options.pattern)} onChange={(event) => update("pattern", event.target.value)} placeholder="Pattern" /><Input aria-label="Flags" value={String(options.flags)} onChange={(event) => update("flags", event.target.value)} placeholder="Flags" /></div>}
    {mode === "password" && <><NumberOption label="Password length" value={Number(options.length)} min={8} max={128} onChange={(value) => update("length", value)} /><div className="mt-4 grid grid-cols-2 gap-3">{[["uppercase", "Uppercase"], ["lowercase", "Lowercase"], ["numbers", "Numbers"], ["symbols", "Symbols"]].map(([key, label]) => <label key={key} className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={Boolean(options[key])} onChange={(event) => update(key, event.target.checked)} />{label}</label>)}</div></>}
    {mode === "upi-qr" && <div className="mt-4 grid gap-3"><Input aria-label="Payee name" value={String(options.name)} onChange={(event) => update("name", event.target.value)} placeholder="Payee name" /><SmartNumberInput compact label="Amount" mode="currency" value={Number(options.amount)} min={0} onChange={(result) => update("amount", result.numericValue ?? 0)} actions={["clear"]} /><Input aria-label="Payment note" value={String(options.note)} onChange={(event) => update("note", event.target.value)} placeholder="Payment note" /></div>}
  </>;
}

function NumberOption({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void }) {
  return <SmartNumberInput className="mt-4" compact label={label} mode={step % 1 === 0 ? "integer" : "decimal"} value={Number.isFinite(value) ? value : null} min={min} max={max} step={step} allowDecimal={step % 1 !== 0} showStepper onChange={(result) => onChange(result.numericValue ?? min)} actions={["reset"]} defaultValue={value} />;
}

function ResultPanel({ tool, result, isQr = false }: { tool: ToolDefinition; result: UtilityResult; isQr?: boolean }) {
  const downloadText = () => downloadBlob(new Blob([result.output], { type: isQr ? "image/svg+xml" : "text/plain;charset=utf-8" }), `${tool.slug}.${isQr ? "svg" : "txt"}`);
  const details = { ...result.stats, ...result.metadata };
  return <Card className="overflow-hidden p-5 sm:p-7">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold">Result</h2><div className="flex gap-2">{result.valid && result.output && <><CopyButton value={result.output} /><Button variant="secondary" onClick={downloadText}><Download size={16} /> Download</Button></>}</div></div>
    {result.valid ? isQr && result.output ? <div className="mx-auto mt-5 max-w-sm rounded-2xl border border-border bg-white p-5" dangerouslySetInnerHTML={{ __html: result.output }} /> : <pre className="mt-5 min-h-64 whitespace-pre-wrap break-words rounded-2xl bg-soft p-5 text-sm leading-6 text-ink">{result.output || "Your result will appear here."}</pre> : <div role="alert" className="mt-5 rounded-2xl bg-danger/5 p-5 text-sm font-medium text-danger">{result.metadata.error}</div>}
    {Object.keys(details).length > 0 && <div className="mt-4 grid grid-cols-2 gap-3">{Object.entries(details).map(([key, value]) => <div className="rounded-xl bg-soft p-3" key={key}><p className="text-xs text-muted">{key}</p><p className="mt-1 break-all font-semibold">{String(value)}</p></div>)}</div>}
    {[...result.warnings, ...tool.limitations].length > 0 && <ul className="mt-4 space-y-1 text-xs leading-5 text-muted">{[...new Set([...result.warnings, ...tool.limitations])].map((warning) => <li key={warning}>• {warning}</li>)}</ul>}
  </Card>;
}

function FileWorkspace({ tool, options, setOptions }: { tool: ToolDefinition; options: Record<string, UtilityScalar>; setOptions: (value: Record<string, UtilityScalar>) => void }) {
  const [files, setFiles] = useState<File[]>([]); const [result, setResult] = useState<FileUtilityResult | null>(null); const [processing, setProcessing] = useState(false);
  const accept = tool.category === "Image" || tool.mode === "images-pdf" ? "image/png,image/jpeg,image/webp" : "application/pdf";
  const multiple = ["pdf-merge", "images-pdf"].includes(tool.mode);
  const process = async () => { setProcessing(true); const next = tool.category === "Image" ? await processImage(tool.mode, files[0] as FileLike, options) : await processPdf(tool.mode, files as FileLike[], options); setResult(next); setProcessing(false); };
  return <div className="grid items-start gap-5 lg:grid-cols-2">
    <Card className="p-5 sm:p-7">
      <h2 className="text-lg font-bold">Choose {multiple ? "files" : "a file"}</h2>
      <label className="mt-4 grid min-h-56 cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-border bg-soft/50 p-6 text-center transition hover:border-primary/40">
        <span><FileUp className="mx-auto text-primary" size={32} /><span className="mt-3 block font-semibold">Select {multiple ? "files" : "a file"}</span><span className="mt-1 block text-sm text-muted">Processed privately in this browser</span></span>
        <input aria-label={`Choose files for ${tool.name}`} className="sr-only" type="file" accept={accept} multiple={multiple} onChange={(event) => { setFiles(Array.from(event.target.files ?? [])); setResult(null); }} />
      </label>
      {files.length > 0 && <div className="mt-4 space-y-2">{files.map((file) => <div key={`${file.name}-${file.size}`} className="flex justify-between rounded-xl bg-soft px-3 py-2 text-sm"><span className="truncate">{file.name}</span><span className="ml-3 shrink-0 text-muted">{(file.size / 1024).toFixed(1)} KB</span></div>)}</div>}
      <FileOptions mode={tool.mode} options={options} setOptions={setOptions} />
      <Button className="mt-5 w-full" disabled={!files.length || processing} onClick={process}><Play size={16} />{processing ? "Processing…" : "Process locally"}</Button>
      <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-success"><ShieldCheck size={17} /> No files are uploaded</div>
    </Card>
    <Card className="p-5 sm:p-7">
      <h2 className="text-lg font-bold">Output</h2>
      {!result && <div className="mt-5 grid min-h-64 place-items-center rounded-2xl bg-soft p-6 text-center text-sm text-muted">Select files and run the tool to create an output.</div>}
      {result && !result.valid && <div role="alert" className="mt-5 rounded-2xl bg-danger/5 p-5 text-sm font-medium text-danger">{result.metadata.error}</div>}
      {result?.valid && <><p className="mt-5 rounded-xl bg-success/10 p-4 text-sm font-semibold text-success">{result.output}</p>{result.previewUrl && <img className="mt-4 max-h-72 w-full rounded-2xl object-contain" src={result.previewUrl} alt="Processed preview" />}{result.files.length > 0 && <div className="mt-4 space-y-2">{result.files.map((file) => <Button key={file.name} variant="secondary" className="w-full" onClick={() => downloadBlob(file.blob, file.name)}><Download size={16} /> Download {file.name}</Button>)}</div>}<div className="mt-4 grid grid-cols-2 gap-3">{Object.entries({ ...result.stats, ...result.metadata }).map(([key, value]) => <div className="rounded-xl bg-soft p-3" key={key}><p className="text-xs text-muted">{key}</p><p className="mt-1 break-all font-semibold">{String(value)}</p></div>)}</div></>}
      <ul className="mt-4 space-y-1 text-xs leading-5 text-muted">{tool.limitations.map((limitation) => <li key={limitation}>• {limitation}</li>)}</ul>
    </Card>
  </div>;
}

function FileOptions({ mode, options, setOptions }: { mode: string; options: Record<string, UtilityScalar>; setOptions: (value: Record<string, UtilityScalar>) => void }) {
  const update = (key: string, value: UtilityScalar) => setOptions({ ...options, [key]: value });
  return <div className="mt-4 grid gap-3 sm:grid-cols-2">
    {mode === "image-compress" && <><NumberOption label="Quality" value={Number(options.quality)} min={.1} max={1} step={.05} onChange={(value) => update("quality", value)} /></>}
    {mode === "image-resize" && <><NumberOption label="Width" value={Number(options.width)} min={1} max={12_000} onChange={(value) => update("width", value)} /><NumberOption label="Height" value={Number(options.height)} min={1} max={12_000} onChange={(value) => update("height", value)} /></>}
    {mode === "image-crop" && <><NumberOption label="X" value={Number(options.x)} min={0} max={12_000} onChange={(value) => update("x", value)} /><NumberOption label="Y" value={Number(options.y)} min={0} max={12_000} onChange={(value) => update("y", value)} /><NumberOption label="Width" value={Number(options.width)} min={1} max={12_000} onChange={(value) => update("width", value)} /><NumberOption label="Height" value={Number(options.height)} min={1} max={12_000} onChange={(value) => update("height", value)} /></>}
    {mode === "image-color" && <><NumberOption label="X" value={Number(options.x)} min={0} max={12_000} onChange={(value) => update("x", value)} /><NumberOption label="Y" value={Number(options.y)} min={0} max={12_000} onChange={(value) => update("y", value)} /></>}
    {mode === "pdf-rotate" && <label className="mt-4 block"><span className="mb-2 block text-sm font-semibold">Rotation</span><select className="min-h-12 w-full rounded-xl border border-border bg-white px-4" value={Number(options.rotation)} onChange={(event) => update("rotation", Number(event.target.value))}><option value={90}>90°</option><option value={180}>180°</option><option value={270}>270°</option></select></label>}
    {mode === "pdf-extract" && <label className="mt-4 block sm:col-span-2"><span className="mb-2 block text-sm font-semibold">Pages</span><Input value={String(options.pages)} onChange={(event) => update("pages", event.target.value)} placeholder="1,3-5" /></label>}
  </div>;
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
