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
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
  return <>
    {gaId && <><Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive"/><Script id="ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config',${JSON.stringify(gaId)},{anonymize_ip:true});`}</Script></>}
    {posthogKey && <Script id="posthog" strategy="afterInteractive">{`!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once reset opt_out_capturing opt_in_capturing has_opted_out_capturing".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);posthog.init(${JSON.stringify(posthogKey)},{api_host:${JSON.stringify(posthogHost)},capture_pageview:true,person_profiles:'identified_only'});`}</Script>}
  </>;
}
