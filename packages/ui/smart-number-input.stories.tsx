import React, { useState } from "react";
import { SmartNumberInput, type SmartNumberInputProps } from "./smart-number-input";

const meta = { title: "DataStorified/SmartNumberInput", component: SmartNumberInput };
export default meta;

function Story(props: Omit<SmartNumberInputProps, "value" | "onChange"> & { initial?: number | null }) {
  const [value, setValue] = useState<number | null>(props.initial ?? null);
  return <div className="max-w-xl bg-canvas p-8"><SmartNumberInput {...props} value={value} onChange={(result) => setValue(result.numericValue)} /></div>;
}

export const Currency = () => <Story label="Investment amount" mode="currency" initial={2_500_000} showWords actions={["clear", "copy", "paste", "reset"]} />;
export const Percentage = () => <Story label="Expected annual return" mode="percentage" initial={12} min={0} max={40} step={.5} showSlider showStepper />;
export const Loan = () => <Story label="Loan amount" description="How much would you like to borrow?" mode="currency" initial={2_500_000} min={50_000} max={200_000_000} step={100_000} showWords showChips showSlider actions={["clear", "copy", "reset"]} />;
export const Salary = () => <Story label="Monthly salary" mode="currency" initial={100_000} min={10_000} max={2_000_000} showWords chips={[{ label: "₹50K", value: 50_000 }, { label: "₹1L", value: 100_000 }, { label: "₹2L", value: 200_000 }]} showChips />;
export const Weight = () => <Story label="Weight" mode="weight" unit="kg" initial={70} min={1} max={500} step={.5} showStepper />;
export const Slider = () => <Story label="Home budget" mode="currency" initial={5_000_000} min={1_000_000} max={50_000_000} step={100_000} showSlider showWords />;
export const Stepper = () => <Story label="Loan tenure" mode="years" initial={20} min={1} max={50} showStepper />;
export const Error = () => <Story label="Loan amount" mode="currency" initial={10_000} min={50_000} max={200_000_000} showWords />;
