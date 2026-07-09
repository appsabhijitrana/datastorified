import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DecisionQuestion } from "./DecisionQuestion";

describe("DecisionQuestion", () => {
  it("marks selected options with aria-pressed", () => {
    render(
      <DecisionQuestion
        question={{
          id: "owns-home",
          prompt: "Do you already own a home?",
          type: "boolean",
          required: true,
        }}
        value={true}
        onChange={() => undefined}
      />,
    );

    expect(screen.getByRole("button", { name: /^Yes/ }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: /^No/ }).getAttribute("aria-pressed")).toBe("false");
  });

  it("announces validation errors", () => {
    render(
      <DecisionQuestion
        question={{
          id: "notes",
          prompt: "Anything else we should know?",
          type: "text",
        }}
        value=""
        onChange={() => undefined}
        error="This answer is required."
      />,
    );

    expect(screen.getByRole("alert").textContent).toContain("This answer is required.");
  });

  it("calls onChange when an option is selected", () => {
    const onChange = vi.fn();
    render(
      <DecisionQuestion
        question={{
          id: "owns-home",
          prompt: "Do you already own a home?",
          type: "boolean",
          required: true,
        }}
        value={undefined}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^No/ }));
    expect(onChange).toHaveBeenCalledWith(false);
  });
});
