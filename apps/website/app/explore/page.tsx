import { AppShell } from "../../components/shell/AppShell";
import { ExploreDiscovery } from "../../components/explore/ExploreDiscovery";

export const metadata = {
  title: "Explore Decisions | DataStorified",
  description: "Discover decision workflows with search, trending decisions, quick checks, and local suggestions.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ExplorePage() {
  return (
    <AppShell>
      <ExploreDiscovery />
    </AppShell>
  );
}
