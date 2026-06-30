"use client";
import { useEffect, useState } from "react";
import Script from "next/script";
import { Button, Card } from "./components";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export function PlatformClient() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent>();
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const updateNetwork = () => setOffline(!navigator.onLine);
    const capturePrompt = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPromptEvent); };
    window.addEventListener("online", updateNetwork);
    window.addEventListener("offline", updateNetwork);
    window.addEventListener("beforeinstallprompt", capturePrompt);
    updateNetwork();
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    return () => { window.removeEventListener("online", updateNetwork); window.removeEventListener("offline", updateNetwork); window.removeEventListener("beforeinstallprompt", capturePrompt); };
  }, []);
  return <>
    {offline && <div role="status" className="fixed inset-x-0 top-0 z-[100] bg-warning px-4 py-2 text-center text-sm font-semibold text-ink">You’re offline. Saved work remains available on this device.</div>}
    {installPrompt && <Card className="fixed bottom-24 right-4 z-[90] max-w-xs p-4 shadow-lift md:bottom-5"><p className="font-semibold">Install DataStorified</p><p className="mt-1 text-sm text-muted">Open faster and keep the platform close at hand.</p><div className="mt-3 flex gap-2"><Button onClick={async () => { await installPrompt.prompt(); await installPrompt.userChoice; setInstallPrompt(undefined); }}>Install</Button><Button variant="ghost" onClick={() => setInstallPrompt(undefined)}>Not now</Button></div></Card>}
  </>;
}

export function AnalyticsScripts() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  return <>
    {gaId && <><Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive"/><Script id="ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config',${JSON.stringify(gaId)},{anonymize_ip:true});`}</Script></>}
  </>;
}
