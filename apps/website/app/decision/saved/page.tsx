import { Footer, Header } from "@datastorified/ui";
import { DecisionSavedPage } from "../../../components/decision/DecisionSavedPage";

export const metadata = {
  title: "Saved decisions | Decision OS",
  description: "Resume drafts and revisit locally saved decisions without signing in.",
};

export default function DecisionSavedRoute() {
  return (
    <>
      <Header />
      <DecisionSavedPage />
      <Footer />
    </>
  );
}
