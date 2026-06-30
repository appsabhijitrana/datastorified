import "./globals.css";import {createMetadata} from "@datastorified/seo";import {AnalyticsScripts,PlatformClient} from "@datastorified/ui/platform-client";
export const metadata=createMetadata("Smart Calculators — DataStorified","Visual, guided financial and everyday calculators.","calculators.datastorified.com");
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}<PlatformClient/><AnalyticsScripts/></body></html>}
