import "./globals.css";
import { createMetadata } from "@datastorified/seo";
import { AnalyticsScripts, PlatformClient } from "@datastorified/ui/platform-client";
import { StatusService } from "../lib/status/service";
import { StatusBanner } from "../components/status/StatusBanner";
import { VersionBanner } from "../components/status/VersionBanner";

export const metadata = createMetadata("DataStorified — Decision Intelligence for Everyone", "Ask real-life questions and get clear, data-backed next steps.", "datastorified.com");

export default function Layout({ children }: { children: React.ReactNode }) {
  const banner = StatusService.getBanner();
  const version = process.env.NEXT_PUBLIC_APP_VERSION?.trim() || StatusService.getHealth().version;

  return (
    <html lang="en">
      <body>
        <StatusBanner banner={banner} />
        <VersionBanner version={version} />
        {children}
        <PlatformClient />
        <AnalyticsScripts />
      </body>
    </html>
  );
}
