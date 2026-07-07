import { AppShell } from "../../../components/shell/AppShell";
import { DecisionSavedPage } from "../../../components/decision/DecisionSavedPage";

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
