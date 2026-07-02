import { beforeEach, describe, expect, it, vi } from "vitest";
import { StatusService } from "./service";

beforeEach(() => {
  vi.unstubAllEnvs();
});

describe("StatusService", () => {
  it("reads maintenance configuration from environment variables", () => {
    vi.stubEnv("NEXT_PUBLIC_MAINTENANCE_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_MAINTENANCE_MODE", "page");
    vi.stubEnv("NEXT_PUBLIC_MAINTENANCE_MESSAGE", "We are making a quiet update.");
    vi.stubEnv("NEXT_PUBLIC_MAINTENANCE_START", "2026-07-03T18:00:00.000Z");
    vi.stubEnv("NEXT_PUBLIC_MAINTENANCE_END", "2026-07-03T19:00:00.000Z");

    expect(StatusService.getMaintenance()).toEqual({
      enabled: true,
      mode: "page",
      message: "We are making a quiet update.",
      start: "2026-07-03T18:00:00.000Z",
      end: "2026-07-03T19:00:00.000Z",
    });
  });

  it("reads banner configuration and falls back safely", () => {
    vi.stubEnv("NEXT_PUBLIC_OUTAGE_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_OUTAGE_MESSAGE", "A brief interruption is being handled.");
    vi.stubEnv("NEXT_PUBLIC_APP_VERSION", "2026.07.03");

    expect(StatusService.getOutageBanner()).toEqual({
      enabled: true,
      variant: "outage",
      message: "A brief interruption is being handled.",
    });
  });

  it("switches the system to maintenance mode when enabled", () => {
    vi.stubEnv("NEXT_PUBLIC_MAINTENANCE_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_MAINTENANCE_MODE", "page");

    expect(StatusService.getHealth().status).toBe("maintenance");
  });

  it("returns a healthy status when no outage flags are enabled", () => {
    expect(StatusService.getHealth().status).toBe("operational");
    expect(StatusService.getHealth().message).toBeUndefined();
    expect(StatusService.getHealth().version).toBeTruthy();
  });

  it("blocks public pages only when maintenance mode is page", () => {
    vi.stubEnv("NEXT_PUBLIC_MAINTENANCE_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_MAINTENANCE_MODE", "page");
    expect(StatusService.shouldBlockPublicPath("/decision")).toBe(true);
    expect(StatusService.shouldBlockPublicPath("/admin")).toBe(false);
  });
});
