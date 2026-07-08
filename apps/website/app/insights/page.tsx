import { AppShell } from "../../components/shell/AppShell";
import { InsightsDashboard } from "../../components/insights/InsightsDashboard";

export const metadata = {
  title: "Insights | Decision OS",
  description: "Track decision clarity, streaks, and return visits across your personal decision library.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function InsightsPage() {
  return (
    <AppShell>
      <InsightsDashboard />
    </AppShell>
  );
}
