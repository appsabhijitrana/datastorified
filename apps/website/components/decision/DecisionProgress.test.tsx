import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DecisionProgress } from "./DecisionProgress";

describe("DecisionProgress", () => {
  it("exposes progressbar semantics", () => {
    render(<DecisionProgress value={42} current={2} total={5} />);

    const progressbar = screen.getByRole("progressbar");
    expect(progressbar.getAttribute("aria-valuenow")).toBe("42");
    expect(progressbar.getAttribute("aria-valuemin")).toBe("0");
    expect(progressbar.getAttribute("aria-valuemax")).toBe("100");
    expect(screen.getByText("Question 2 of 5")).toBeTruthy();
  });

  it("clamps values to 0-100", () => {
    render(<DecisionProgress value={150} />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("100");
  });
});
