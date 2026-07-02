import { beforeEach, describe, expect, it, vi } from "vitest";
import { StatusService } from "./service";

beforeEach(() => {
  vi.unstubAllEnvs();
});

describe("StatusService", () => {
  it("reads maintenance configuration from environment variables", () => {
    vi.stubEnv("MAINTENANCE_MODE", "true");
    vi.stubEnv("MAINTENANCE_MESSAGE", "We are upgrading the platform.");
    vi.stubEnv("MAINTENANCE_ETA", "2026-07-03T18:30:00.000Z");

    expect(StatusService.getMaintenance()).toEqual({
      enabled: true,
      message: "We are upgrading the platform.",
      eta: "2026-07-03T18:30:00.000Z",
    });
  });

  it("reads banner configuration and falls back safely", () => {
    vi.stubEnv("OUTAGE_BANNER_ENABLED", "true");
    vi.stubEnv("OUTAGE_BANNER_LEVEL", "critical");
    vi.stubEnv("OUTAGE_BANNER_TITLE", "Important notice");
    vi.stubEnv("OUTAGE_BANNER_MESSAGE", "A scheduled update is in progress.");
    vi.stubEnv("OUTAGE_BANNER_LINK", "/status");
    vi.stubEnv("NEXT_PUBLIC_APP_VERSION", "2026.07.03");

    expect(StatusService.getBanner()).toEqual({
      enabled: true,
      level: "critical",
      title: "Important notice",
      message: "A scheduled update is in progress.",
      link: "/status",
      version: "2026.07.03",
    });
  });

  it("switches the system to maintenance mode when enabled", () => {
    vi.stubEnv("MAINTENANCE_MODE", "true");

    expect(StatusService.getSystemStatus()).toBe("maintenance");
    expect(StatusService.getHealth().status).toBe("maintenance");
  });

  it("returns a healthy status when no outage flags are enabled", () => {
    expect(StatusService.getSystemStatus()).toBe("operational");
    expect(StatusService.getHealth().status).toBe("healthy");
    expect(Object.keys(StatusService.getHealth().services).length).toBeGreaterThan(0);
  });
});

