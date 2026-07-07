import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import * as decisionOs from "@datastorified/decision-os";
import { DecisionSearch } from "./DecisionSearch";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("DecisionSearch", () => {
  beforeEach(() => {
    push.mockClear();
    vi.restoreAllMocks();
  });

  it("shows an empty state when no workflows match", () => {
    vi.spyOn(decisionOs.decisionPluginRegistry, "searchWorkflows").mockReturnValue([]);
    vi.spyOn(decisionOs, "detectIntent").mockReturnValue({ input: "zzzz-no-match-xyz", matches: [] });

    render(<DecisionSearch />);
    fireEvent.change(screen.getByLabelText("What decision are you trying to make today?"), {
      target: { value: "zzzz-no-match-xyz" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Find my decision" }));

    expect(screen.getByText("No matching decision flows")).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
  });

  it("routes to a matching workflow", () => {
    render(<DecisionSearch initialValue="buy a house" />);
    fireEvent.click(screen.getByRole("button", { name: "Find my decision" }));
    expect(push).toHaveBeenCalled();
  });
});
