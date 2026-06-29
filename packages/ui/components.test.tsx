import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button, Input } from ".";

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
});
