import { Footer, Header } from "@datastorified/ui";
import { ProfilePageContent } from "../../components/profile/ProfilePageContent";

export const metadata = {
  title: "Profile | Decision OS",
  description: "Review your profile completeness and improve decision accuracy without being forced to sign in.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfileRoute() {
  return (
    <>
      <Header />
      <ProfilePageContent />
      <Footer />
    </>
  );
}
