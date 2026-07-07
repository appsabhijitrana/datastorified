import { describe, it, expect, vi, beforeEach } from "vitest";
import { DecisionOSStatusService } from "./service";

beforeEach(() => {
  vi.unstubAllEnvs();
});

describe("DecisionOSStatusService", () => {
  it('should return "normal" state when no environment variable is set', () => {
    const status = DecisionOSStatusService.getStatus();
    expect(status.state).toBe("normal");
    expect(status.message).toBeUndefined();
  });

  it('should return "maintenance_banner" state when the environment variable is set', () => {
    vi.stubEnv("NEXT_PUBLIC_DECISION_OS_MAINTENANCE_STATE", "maintenance_banner");
    vi.stubEnv("NEXT_PUBLIC_DECISION_OS_MAINTENANCE_MESSAGE", "Test message");
    const status = DecisionOSStatusService.getStatus();
    expect(status.state).toBe("maintenance_banner");
    expect(status.message).toBe("Test message");
  });

  it('should return "scheduled_maintenance" state when the environment variable is set', () => {
    vi.stubEnv("NEXT_PUBLIC_DECISION_OS_MAINTENANCE_STATE", "scheduled_maintenance");
    vi.stubEnv("NEXT_PUBLIC_DECISION_OS_MAINTENANCE_MESSAGE", "Scheduled message");
    const status = DecisionOSStatusService.getStatus();
    expect(status.state).toBe("scheduled_maintenance");
    expect(status.message).toBe("Scheduled message");
  });

  it('should return "outage_blocking" state when the environment variable is set', () => {
    vi.stubEnv("NEXT_PUBLIC_DECISION_OS_MAINTENANCE_STATE", "outage_blocking");
    vi.stubEnv("NEXT_PUBLIC_DECISION_OS_MAINTENANCE_MESSAGE", "Outage message");
    const status = DecisionOSStatusService.getStatus();
    expect(status.state).toBe("outage_blocking");
    expect(status.message).toBe("Outage message");
  });

  it("should be case-insensitive", () => {
    vi.stubEnv("NEXT_PUBLIC_DECISION_OS_MAINTENANCE_STATE", "OUTAGE_BLOCKING");
    const status = DecisionOSStatusService.getStatus();
    expect(status.state).toBe("outage_blocking");
  });
});
