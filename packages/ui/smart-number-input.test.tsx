import React, { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SmartNumberInput, type SmartNumberChange, type SmartNumberInputProps } from "./smart-number-input";

function ControlledInput(props: Partial<SmartNumberInputProps> = {}) {
  const [value, setValue] = useState<number | null>(props.value ?? null);
  return <SmartNumberInput label="Loan amount" mode="currency" {...props} value={value} onChange={(result) => { setValue(result.numericValue); props.onChange?.(result); }} />;
}

describe("SmartNumberInput", () => {
  it("uses a spinner-free decimal keyboard input", () => {
    render(<ControlledInput value={2_500_000} />);
    const input = screen.getByLabelText("Loan amount");
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveAttribute("inputmode", "decimal");
    expect(input).toHaveValue("₹25,00,000");
  });

  it("parses shorthand and returns the complete contract", async () => {
    const user = userEvent.setup(); const changes: SmartNumberChange[] = [];
    render(<ControlledInput onChange={(result) => changes.push(result)} showWords />);
    const input = screen.getByLabelText("Loan amount");
    await user.type(input, "25L");
    expect(input).toHaveValue("₹25,00,000");
    expect(changes.at(-1)).toMatchObject({ numericValue: 2_500_000, formattedValue: "₹25,00,000", words: "Twenty Five Lakh", isValid: true, validationErrors: [] });
    await waitFor(() => expect(screen.getByText("Twenty Five Lakh")).toBeVisible());
  });

  it("keeps the caret at the natural end after live grouping", async () => {
    const user = userEvent.setup();
    render(<ControlledInput />); const input = screen.getByLabelText("Loan amount") as HTMLInputElement;
    await user.type(input, "2500000");
    await waitFor(() => expect(input.selectionStart).toBe(input.value.length));
    expect(input).toHaveValue("₹25,00,000");
  });

  it("supports Arrow Up and Arrow Down stepping", () => {
    const onChange = vi.fn(); render(<ControlledInput value={10} step={5} onChange={onChange} />);
    const input = screen.getByLabelText("Loan amount"); fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ numericValue: 15 }));
    fireEvent.keyDown(input, { key: "ArrowDown" }); expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ numericValue: 10 }));
  });

  it("shows friendly range validation", async () => {
    const user = userEvent.setup(); render(<ControlledInput min={50_000} max={200_000_000} />);
    const input = screen.getByLabelText("Loan amount"); await user.type(input, "100"); await user.tab();
    expect(screen.getByRole("alert")).toHaveTextContent("Loan amount should be between ₹50,000 and ₹20,00,00,000.");
  });

  it("keeps chips and slider synchronized", async () => {
    const user = userEvent.setup(); const onChange = vi.fn();
    render(<ControlledInput value={10} mode="percentage" min={0} max={100} showSlider showChips chips={[{ label: "+5", value: 5, action: "add" }]} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "+5" })); expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ numericValue: 15 }));
    fireEvent.change(screen.getByLabelText("Loan amount slider"), { target: { value: "40" } }); expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ numericValue: 40 }));
  });
});
