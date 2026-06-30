import { beforeEach, describe, expect, it, vi } from "vitest";
import { storage, storageKeys } from ".";

describe("local storage adapter", () => {
  beforeEach(() => localStorage.clear());

  it("stores recent calculators and tools without duplicates", () => {
    storage.addRecent("calculators", "emi-calculator"); storage.addRecent("calculators", "sip-calculator"); storage.addRecent("calculators", "emi-calculator");
    expect(storage.getRecent("calculators")).toEqual(["emi-calculator", "sip-calculator"]);
    storage.addRecent("tools", "json-formatter"); expect(storage.getRecent("tools")).toEqual(["json-formatter"]);
  });

  it("toggles calculator and tool favorites", () => {
    expect(storage.toggleFavorite("calculators", "emi-calculator")).toBe(true);
    expect(storage.getFavorites("calculators")).toEqual(["emi-calculator"]);
    expect(storage.toggleFavorite("calculators", "emi-calculator")).toBe(false);
    expect(storage.getFavorites("calculators")).toEqual([]);
    expect(storage.toggleFavorite("tools", "json-formatter")).toBe(true);
  });

  it("stores drafts, search history, and preferences", () => {
    storage.saveDraft("emi-calculator", { principal: 100 }); expect(storage.getDraft("emi-calculator", {})).toEqual({ principal: 100 });
    storage.addSearch(" EMI "); storage.addSearch("SIP"); expect(storage.getSearches()).toEqual(["SIP", "EMI"]);
    storage.savePreferences({ locale: "en-IN" }); expect(storage.getPreferences()).toEqual({ locale: "en-IN" });
  });

  it("returns fallbacks for malformed stored values", () => {
    localStorage.setItem(storageKeys.recentCalculators, "not-json");
    expect(storage.getRecent("calculators")).toEqual([]);
    localStorage.setItem(storageKeys.favoriteTools, JSON.stringify({ broken: true }));
    localStorage.setItem(storageKeys.preferences, JSON.stringify({ locale: "en-IN", invalid: 42 }));
    expect(storage.getFavorites("tools")).toEqual([]);
    expect(storage.getPreferences()).toEqual({ locale: "en-IN" });
    expect(storage.addSearch("   ")).toEqual([]);
  });

  it("fails gracefully when localStorage reads and writes throw", () => {
    const read = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new DOMException("blocked"); });
    const write = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("blocked"); });
    expect(storage.getRecent("tools")).toEqual([]);
    expect(() => storage.addRecent("tools", "json-formatter")).not.toThrow();
    expect(() => storage.saveDraft("test", { value: 1 })).not.toThrow();
    read.mockRestore(); write.mockRestore();
  });
});
