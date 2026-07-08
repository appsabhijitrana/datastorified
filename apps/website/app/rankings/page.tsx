import { AppShell } from "../../components/shell/AppShell";
import { RankingsDashboard } from "../../components/rankings/RankingsDashboard";

export const metadata = {
  title: "Decision Rankings | DataStorified",
  description: "Explore modern decision rankings with filters, score bars, trend charts, and category cards.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RankingsPage() {
  return (
    <AppShell>
      <RankingsDashboard />
    </AppShell>
  );
}
