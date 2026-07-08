import { AppShell } from "../../components/shell/AppShell";
import { DecisionLibrary } from "../../components/decision/DecisionLibrary";

export default function MyDecisionsPage() {
  return (
    <AppShell>
      <DecisionLibrary />
    </AppShell>
  );
}
