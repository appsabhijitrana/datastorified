"use client";

import { useMemo } from "react";
import { Badge, Card } from "@datastorified/ui";
import { authClient, GoogleSignInButton, LegalAcceptanceGate } from "@datastorified/auth";
import { ProfileCompletenessCard } from "./ProfileCompletenessCard";
import { ImproveAnalysisCTA } from "./ImproveAnalysisCTA";
import { getProfileAnalysis } from "@datastorified/profile";

export function ProfilePageContent() {
  const { data: session } = authClient.useSession();
  const analysis = useMemo(() => getProfileAnalysis(session?.user ? { source: "cloud" } : undefined), [session?.user]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="max-w-3xl">
        <Badge>{session?.user ? "Profile" : "Anonymous mode"}</Badge>
        <h1 className="mt-4 text-3xl font-bold tracking-[-.035em] sm:text-4xl">Your decision profile</h1>
        <p className="mt-3 text-base leading-7 text-muted">
          {session?.user
            ? "We use your saved profile and history to improve decision accuracy."
            : "You can stay anonymous and still use the decision engine, but profile completeness will remain basic until you sign in."}
        </p>
      </div>

      {!session?.user && (
        <Card className="mt-8 border-primary/15 bg-primary/[.04] p-5">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Login optional</p>
          <h2 className="mt-2 text-xl font-bold">Sign in later to save your profile and sync history.</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {analysis.description}
          </p>
          <GoogleSignInButton className="mt-4">
            Sign in with Google
          </GoogleSignInButton>
        </Card>
      )}

      <LegalAcceptanceGate mode="account">
        <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <ProfileCompletenessCard analysis={analysis} />
          <ImproveAnalysisCTA />
        </div>
      </LegalAcceptanceGate>
    </main>
  );
}
