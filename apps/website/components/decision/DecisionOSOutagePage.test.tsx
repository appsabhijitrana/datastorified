import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DecisionOSOutagePage } from "./DecisionOSOutagePage";

describe("DecisionOSOutagePage", () => {
  it("explains that new flows are paused during outage", () => {
    render(<DecisionOSOutagePage message="Cloud sync is unavailable." />);

    expect(screen.getByText("Decision OS is temporarily unavailable")).toBeTruthy();
    expect(screen.getByText("Cloud sync is unavailable.")).toBeTruthy();
    expect(screen.getByText(/new decision flows are paused/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: "View saved decisions" }).getAttribute("href")).toBe("/decision/saved");
  });
});
