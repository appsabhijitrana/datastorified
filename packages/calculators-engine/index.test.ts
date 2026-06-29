import { describe, expect, it } from "vitest";
import { calculate, calculators, validateCalculatorInputs } from ".";

const defaultsFor = (index: number) => Object.fromEntries(calculators[index].fields.map((field) => [field.key, field.default]));

describe("calculator catalog", () => {
  it("contains all 55 production calculators with unique routes", () => {
    expect(calculators).toHaveLength(55);
    expect(new Set(calculators.map((calculator) => calculator.slug)).size).toBe(55);
  });

  calculators.forEach((calculator, index) => {
    describe(calculator.name, () => {
      it("calculates its documented default example and returns the complete contract", () => {
        const values = defaultsFor(index);
        const output = calculate(calculator.slug, values);
        expect(output.error, output.error).toBeUndefined();
        expect(Number.isFinite(output.primaryResult.value)).toBe(true);
        expect(output.primaryResult.label).toBeTruthy();
        expect(["currency", "percent", "number"]).toContain(output.primaryResult.unit);
        expect(Array.isArray(output.secondaryResults)).toBe(true);
        expect(Array.isArray(output.chartData)).toBe(true);
        expect(output.insight).toBeTruthy();
        expect(output.formula).toBe(calculator.formula);
        expect(output.assumptions.length).toBeGreaterThan(0);
        expect(Array.isArray(output.warnings)).toBe(true);
        expect(validateCalculatorInputs(calculator, values)).toEqual([]);
      });

      it("rejects missing, non-finite, and below-range inputs through Zod", () => {
        expect(calculate(calculator.slug, {}).error).toBeTruthy();
        const values = defaultsFor(index);
        const first = calculator.fields[0];
        expect(calculate(calculator.slug, { ...values, [first.key]: Number.NaN }).error).toBeTruthy();
        if (first.min !== undefined) expect(calculate(calculator.slug, { ...values, [first.key]: first.min - 1 }).error).toBeTruthy();
      });

      it("accepts decimal values within the configured range", () => {
        const values = defaultsFor(index);
        const decimalField = calculator.fields.find((field) => field.input !== "select" && field.min !== undefined && (field.max === undefined || field.min + .25 <= field.max));
        if (!decimalField) return;
        const decimal = Math.max(decimalField.min ?? 0, Math.min(decimalField.default + .25, decimalField.max ?? Number.POSITIVE_INFINITY));
        const output = calculate(calculator.slug, { ...values, [decimalField.key]: decimal });
        expect(Number.isFinite(output.primaryResult.value)).toBe(true);
      });
    });
  });
});

describe("known formula examples", () => {
  it("calculates EMI for ₹20 lakh at 8.5% over 20 years", () => {
    const output = calculate("emi-calculator", { principal: 2_000_000, rate: 8.5, years: 20 });
    expect(output.primaryResult.value).toBeCloseTo(17_356.47, 0);
  });

  it("calculates a 10-year SIP at 12%", () => {
    const output = calculate("sip-calculator", { monthly: 10_000, rate: 12, years: 10 });
    expect(output.primaryResult.value).toBeCloseTo(2_323_391, -2);
  });

  it("adds 18% GST", () => {
    const output = calculate("gst-calculator", { mode: 0, amount: 1_000, rate: 18 });
    expect(output.primaryResult.value).toBe(1_180);
    expect(output.secondaryResults[0].value).toBe(180);
  });

  it("calculates BMI", () => {
    const output = calculate("bmi-calculator", { weight: 70, height: 175 });
    expect(output.primaryResult.value).toBeCloseTo(22.86, 2);
  });

  it("handles zero interest without division errors", () => {
    const output = calculate("emi-calculator", { principal: 120_000, rate: 0, years: 1 });
    expect(output.primaryResult.value).toBe(10_000);
  });

  it("rejects an unknown calculator", () => {
    expect(calculate("not-real", {}).error).toBe("This calculator is not available.");
  });
});
