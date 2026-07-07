import { ProfilePageContent } from "../../components/profile/ProfilePageContent";
import { AppShell } from "../../components/shell/AppShell";

export const metadata = {
  title: "Profile | Decision OS",
  description: "Review your profile completeness and improve decision accuracy without being forced to sign in.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfileRoute() {
  return <AppShell><ProfilePageContent /></AppShell>;
}
