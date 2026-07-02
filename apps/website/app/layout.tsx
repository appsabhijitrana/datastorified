import "./globals.css";
import { createMetadata } from "@datastorified/seo";
import { AnalyticsScripts, PlatformClient } from "@datastorified/ui/platform-client";
import { PlatformNoticeProvider } from "../components/status/PlatformNoticeProvider";

export const metadata = createMetadata("DataStorified — Decision Intelligence for Everyone", "Ask real-life questions and get clear, data-backed next steps.", "datastorified.com");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PlatformNoticeProvider>{children}</PlatformNoticeProvider>
        <PlatformClient />
        <AnalyticsScripts />
      </body>
    </html>
  );
}
