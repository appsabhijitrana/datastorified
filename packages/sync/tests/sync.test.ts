import { describe, expect, it } from "vitest";
import { createFingerprint, mergeByFingerprintOrLocalId } from "../src/merge";
import { resolveSyncConflict } from "../src/conflict";
import { syncLocalToCloud } from "../src/syncLocalToCloud";

describe("sync merge", () => {
  it("keeps the latest record when fingerprint and local id collide", () => {
    const older = {
      localId: "decision-1",
      fingerprint: createFingerprint({ id: "decision-1" }),
      updatedAt: "2026-07-01T10:00:00.000Z",
      value: "older",
    };
    const newer = {
      localId: "decision-1",
      fingerprint: older.fingerprint,
      updatedAt: "2026-07-02T10:00:00.000Z",
      value: "newer",
    };

    const merged = mergeByFingerprintOrLocalId([older, newer], []);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.value).toBe("newer");
  });
});

describe("sync conflict resolution", () => {
  it("prefers the newest updatedAt value", () => {
    const local = { updatedAt: "2026-07-02T10:00:00.000Z", value: "local" };
    const cloud = { updatedAt: "2026-07-01T10:00:00.000Z", value: "cloud" };
    expect(resolveSyncConflict(local, cloud).reason).toBe("local-newer");
    expect(resolveSyncConflict(cloud, local).reason).toBe("cloud-newer");
  });

  it("treats equal timestamps as same-time", () => {
    const record = { updatedAt: "2026-07-02T10:00:00.000Z", value: "same" };
    expect(resolveSyncConflict(record, record).reason).toBe("same-time");
  });
});

describe("sync local to cloud", () => {
  it("surfaces a friendly error when the cloud sync fails", async () => {
    await expect(
      syncLocalToCloud({
        fetcher: async () => new Response(JSON.stringify({ error: "nope" }), { status: 500, headers: { "Content-Type": "application/json" } }),
      }),
    ).rejects.toThrow(/local copy is safe/i);
  });
});
