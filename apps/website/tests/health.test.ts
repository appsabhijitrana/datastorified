import { describe, expect, it } from "vitest";
import { GET } from "../app/api/health/route";

describe("/api/health", () => {
  it("returns a structured health payload", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: expect.any(String),
      systemStatus: expect.any(String),
      version: expect.any(String),
      timestamp: expect.any(String),
      uptime: expect.any(Number),
      services: expect.any(Object),
    });
  });
});

