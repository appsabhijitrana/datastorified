import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button, Input } from ".";
import { Badge, Card, Chip, EmptyState, ProgressBar, ScoreRing, SearchInput, StatusBadge } from "./design-system";

describe("shared form controls", () => {
  it("accepts typed input", async () => {
    const user = userEvent.setup();
    render(<Input aria-label="Scenario name" />);
    await user.type(screen.getByLabelText("Scenario name"), "Conservative case");
    expect(screen.getByLabelText("Scenario name")).toHaveValue("Conservative case");
  });

  it("invokes button actions and respects disabled state", async () => {
    const user = userEvent.setup(); const action = vi.fn();
    const { rerender } = render(<Button onClick={action}>Calculate</Button>);
    await user.click(screen.getByRole("button", { name: "Calculate" })); expect(action).toHaveBeenCalledOnce();
    rerender(<Button onClick={action} disabled>Calculate</Button>); await user.click(screen.getByRole("button", { name: "Calculate" })); expect(action).toHaveBeenCalledOnce();
  });

  it("renders the new shared primitives", () => {
    render(
      <div>
        <Badge>New</Badge>
        <Card>Card</Card>
        <Chip>Chip</Chip>
        <SearchInput aria-label="Search" placeholder="Search" />
        <ProgressBar value={40} />
        <ScoreRing score={78} />
        <StatusBadge status="success" />
        <EmptyState title="Empty" description="No items" />
      </div>,
    );
    expect(screen.getByText("New")).toBeTruthy();
    expect(screen.getByText("Card")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Chip" })).toBeTruthy();
    expect(screen.getByLabelText("Search")).toBeTruthy();
  });
});
