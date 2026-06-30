"use client";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button, Card } from "./components";

export function ErrorScreen({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="grid min-h-screen place-items-center bg-soft px-4"><Card className="max-w-lg p-8 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-danger/10 text-danger"><AlertTriangle /></span><h1 className="mt-4 text-2xl font-bold">Something went wrong</h1><p className="mt-2 text-sm leading-6 text-muted">Your local work is safe. Try this screen again, or return home if the problem continues.</p>{error.digest && <p className="mt-3 text-xs text-muted">Reference: {error.digest}</p>}<div className="mt-6 flex flex-wrap justify-center gap-3"><Button onClick={reset}><RefreshCw size={16}/> Try again</Button><a href="/" className="inline-flex min-h-11 items-center rounded-xl border border-border bg-white px-4 text-sm font-semibold">Return home</a></div></Card></main>;
}
