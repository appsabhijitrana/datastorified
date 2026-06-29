import { describe, expect, it } from "vitest";
import { formatIndianNumber, formatInternationalNumber, formatSmartNumber, numberToIndianWords, numberToInternationalWords, parseIndianNumber, parseInternationalNumber, parseSmartNumber } from "./smart-number";

describe("smart number parsing", () => {
  it.each([
    ["25 lakh", 2_500_000], ["25L", 2_500_000], ["25 lac", 2_500_000], ["2cr", 20_000_000], ["2.5cr", 25_000_000],
    ["₹2500000", 2_500_000], ["₹25 lakh", 2_500_000], ["85k", 85_000], ["3M", 3_000_000], ["4 million", 4_000_000], ["5 billion", 5_000_000_000], ["10bn", 10_000_000_000],
  ])("parses %s", (input, expected) => expect(parseSmartNumber(input).numericValue).toBe(expected));

  it("exposes Indian and international parser aliases", () => {
    expect(parseIndianNumber("25 lakh")).toBe(2_500_000);
    expect(parseInternationalNumber("3M")).toBe(3_000_000);
  });

  it("rejects invalid and infinite values", () => {
    expect(parseSmartNumber("twenty five").isParseable).toBe(false);
    expect(parseSmartNumber("1e309", true).numericValue).toBeNull();
  });

  it("supports scientific notation only when enabled", () => {
    expect(parseSmartNumber("2.5e6").isParseable).toBe(false);
    expect(parseSmartNumber("2.5e6", true).numericValue).toBe(2_500_000);
  });
});

describe("smart number formatting", () => {
  it("formats INR using Indian grouping", () => expect(formatIndianNumber(2_500_000, { currency: "INR" })).toBe("₹25,00,000"));
  it("formats larger Indian values", () => expect(formatIndianNumber(125_340_00, { currency: "INR" })).toBe("₹1,25,34,000"));
  it("formats international grouping and compact notation", () => {
    expect(formatInternationalNumber(2_500_000)).toBe("2,500,000");
    expect(formatInternationalNumber(2_500_000, { compact: true })).toBe("2.5M");
  });
  it("formats supported units", () => {
    expect(formatSmartNumber(25, "percentage", "indian")).toBe("25%");
    expect(formatSmartNumber(10, "weight", "indian", { unit: "kg" })).toBe("10 kg");
  });
});

describe("number words", () => {
  it("uses Indian scale words", () => {
    expect(numberToIndianWords(2_500_000)).toBe("Twenty Five Lakh");
    expect(numberToIndianWords(12_534_000)).toBe("One Crore Twenty Five Lakh Thirty Four Thousand");
  });
  it("uses international scale words", () => expect(numberToInternationalWords(2_500_000)).toBe("Two Million Five Hundred Thousand"));
  it("supports negatives, zero, and decimals", () => {
    expect(numberToIndianWords(0)).toBe("Zero");
    expect(numberToIndianWords(-12.5)).toBe("Minus Twelve Point Five");
  });
});
