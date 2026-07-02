import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { LegalAcceptanceGate } from "./LegalAcceptanceGate";

const mocks = vi.hoisted(() => ({
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  useSession: vi.fn(),
  fetch: vi.fn(),
  router: { push: vi.fn(), refresh: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => mocks.router,
}));

vi.mock("../client", () => ({
  authClient: { useSession: mocks.useSession },
  signInWithGoogle: mocks.signInWithGoogle,
  signOut: mocks.signOut,
}));

beforeEach(() => {
  vi.clearAllMocks();
  window.sessionStorage.clear();
  vi.stubGlobal("fetch", mocks.fetch);
  mocks.useSession.mockReturnValue({ data: null, isPending: false, isRefetching: false, error: null, refetch: vi.fn() });
});

describe("GoogleSignInButton and TermsAcceptanceModal", () => {
  it("opens the legal modal before sign-in", async () => {
    const user = userEvent.setup();
    render(<GoogleSignInButton callbackURL="/decision">Continue with Google</GoogleSignInButton>);

    await user.click(screen.getByRole("button", { name: /continue with google/i }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeTruthy();
    expect(screen.getAllByText(/Before you continue/i)[0]).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /Continue with Google/i })[1]).toBeDisabled();
  });

  it("enables continue only after the checkbox is checked", async () => {
    const user = userEvent.setup();
    render(<GoogleSignInButton callbackURL="/decision">Continue with Google</GoogleSignInButton>);

    await user.click(screen.getByRole("button", { name: /continue with google/i }));
    const continueButton = screen.getAllByRole("button", { name: /Continue with Google/i })[1];
    expect(continueButton).toBeDisabled();

    await user.click(screen.getByLabelText(/I agree to DataStorified/i));
    expect(continueButton).toBeEnabled();
  });

  it("renders the legal links and cancel closes the modal", async () => {
    const user = userEvent.setup();
    render(<GoogleSignInButton callbackURL="/decision">Continue with Google</GoogleSignInButton>);

    await user.click(screen.getByRole("button", { name: /continue with google/i }));
    for (const label of ["Terms of Service", "Privacy Policy", "Cookie Policy", "Disclaimer", "AI Disclosure"]) {
      expect(screen.getByRole("link", { name: label })).toBeTruthy();
    }
    await user.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("calls Google sign-in only after acceptance", async () => {
    const user = userEvent.setup();
    render(<GoogleSignInButton callbackURL="/decision">Continue with Google</GoogleSignInButton>);

    await user.click(screen.getByRole("button", { name: /continue with google/i }));
    await user.click(screen.getByLabelText(/I agree to DataStorified/i));
    await user.click(screen.getAllByRole("button", { name: /Continue with Google/i })[1]);

    expect(mocks.signInWithGoogle).toHaveBeenCalledWith({ callbackURL: "/decision" });
  });

  it("blocks authenticated content until legal acceptance is resolved", async () => {
    mocks.useSession.mockReturnValue({
      data: { user: { id: "user-1", email: "user@example.com" } },
      isPending: false,
      isRefetching: false,
      error: null,
      refetch: vi.fn(),
    });
    mocks.fetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          acceptedCurrentTerms: false,
          acceptedCurrentPrivacy: false,
          acceptedCurrentLegal: false,
          requiresAcceptance: true,
          currentVersions: {
            termsVersion: "terms-v1.0",
            privacyVersion: "privacy-v1.0",
            legalAcceptanceVersion: "legal-v1.0",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    render(
      <LegalAcceptanceGate>
        <div>protected content</div>
      </LegalAcceptanceGate>,
    );

    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.queryByText("protected content")).toBeNull();
    expect(mocks.fetch).toHaveBeenCalledWith("/api/legal/acceptance/status", expect.any(Object));
  });
});
