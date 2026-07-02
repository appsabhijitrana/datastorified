import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GoogleSignInButton } from "./GoogleSignInButton";

const mocks = vi.hoisted(() => ({
  signInWithGoogle: vi.fn(),
}));

vi.mock("../client", () => ({
  signInWithGoogle: mocks.signInWithGoogle,
}));

beforeEach(() => {
  vi.clearAllMocks();
  window.sessionStorage.clear();
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
});
