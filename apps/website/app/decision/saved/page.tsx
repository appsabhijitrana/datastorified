import { DecisionSavedPage } from "../../../components/decision/DecisionSavedPage";
import { AppShell } from "../../../components/shell/AppShell";

export const metadata = {
  title: "Saved decisions | Decision OS",
  description: "Resume drafts and revisit locally saved decisions without signing in.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DecisionSavedRoute() {
  return <AppShell><DecisionSavedPage /></AppShell>;
}
