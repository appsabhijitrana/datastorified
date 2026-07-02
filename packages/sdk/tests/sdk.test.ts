import { describe, expect, it } from "vitest";
import { createDataStorifiedClient, OfflineError, ParseError, UnauthorizedError } from "../src";

describe("sdk", () => {
  it("returns offline errors without crashing", async () => {
    const client = createDataStorifiedClient({
      fetcher: async () => { throw new Error("should not be called"); },
    });
    Object.defineProperty(globalThis, "navigator", { value: { onLine: false }, configurable: true });
    const result = await client.profile.get();
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected offline error");
    expect(result.error).toBeInstanceOf(OfflineError);
  });

  it("maps 401 responses to typed errors", async () => {
    Object.defineProperty(globalThis, "navigator", { value: { onLine: true }, configurable: true });
    const client = createDataStorifiedClient({
      fetcher: async () => new Response(JSON.stringify({ error: "nope" }), { status: 401, headers: { "Content-Type": "application/json" } }),
    });
    const result = await client.decisions.list();
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected unauthorized error");
    expect(result.error).toBeInstanceOf(UnauthorizedError);
  });

  it("returns parse errors when the server body is invalid JSON", async () => {
    Object.defineProperty(globalThis, "navigator", { value: { onLine: true }, configurable: true });
    const client = createDataStorifiedClient({
      fetcher: async () => new Response("not-json", { status: 200, headers: { "Content-Type": "application/json" } }),
    });
    const result = await client.decisions.get("id");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected parse error");
    expect(result.error).toBeInstanceOf(ParseError);
  });
});
