import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthSession = vi.fn();
const profileFindUnique = vi.fn();
const profileUpsert = vi.fn();
const userFindUnique = vi.fn();
const userUpdate = vi.fn();
const decisionFindMany = vi.fn();
const decisionFindFirst = vi.fn();
const decisionUpsert = vi.fn();
const decisionCreate = vi.fn();
const decisionUpdate = vi.fn();
const decisionDeleteMany = vi.fn();
const historyFindMany = vi.fn();
const favoriteFindFirst = vi.fn();
const favoriteCreate = vi.fn();
const favoriteUpdate = vi.fn();
const historyItemFindFirst = vi.fn();
const historyItemCreate = vi.fn();
const historyItemUpdate = vi.fn();

vi.mock("@datastorified/auth/server", () => ({
  getAuthSession,
}));

vi.mock("@datastorified/auth", () => ({
  authClient: { useSession: () => ({ data: null, isPending: false, isRefetching: false, error: null, refetch: vi.fn() }) },
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@datastorified/database", () => ({
  prisma: {
    user: { findUnique: userFindUnique, update: userUpdate },
    profile: { findUnique: profileFindUnique, upsert: profileUpsert },
    decision: { findMany: decisionFindMany, findFirst: decisionFindFirst, upsert: decisionUpsert, create: decisionCreate, update: decisionUpdate, deleteMany: decisionDeleteMany },
    historyItem: { findMany: historyFindMany, findFirst: historyItemFindFirst, create: historyItemCreate, update: historyItemUpdate },
    favorite: { findFirst: favoriteFindFirst, create: favoriteCreate, update: favoriteUpdate },
  },
}));

const profileRoutePromise = import("../app/api/profile/route");
const decisionsRoutePromise = import("../app/api/decisions/route");
const syncRoutePromise = import("../app/api/sync/route");
const recommendationsRoutePromise = import("../app/api/recommendations/route");
const decisionByIdRoutePromise = import("../app/api/decisions/[id]/route");
const legalAcceptanceRoutePromise = import("../app/api/legal/acceptance/route");
const legalAcceptanceStatusRoutePromise = import("../app/api/legal/acceptance/status/route");

function jsonRequest(url: string, body?: unknown) {
  return new Request(url, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

function nextRequest(url: string) {
  return {
    headers: new Headers(),
    nextUrl: new URL(url),
  } as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  getAuthSession.mockResolvedValue(null);
  userFindUnique.mockResolvedValue({
    termsAcceptedAt: new Date(),
    termsVersion: "terms-v1.0",
    privacyAcceptedAt: new Date(),
    privacyVersion: "privacy-v1.0",
    legalAcceptedAt: new Date(),
    legalAcceptanceVersion: "legal-v1.0",
  });
  userUpdate.mockResolvedValue({
    termsAcceptedAt: new Date(),
    termsVersion: "terms-v1.0",
    privacyAcceptedAt: new Date(),
    privacyVersion: "privacy-v1.0",
    legalAcceptedAt: new Date(),
    legalAcceptanceVersion: "legal-v1.0",
  });
});

describe("backend foundation route contracts", () => {
  it("returns 401 for unauthenticated profile access", async () => {
    const { GET } = await profileRoutePromise;
    const response = await GET(jsonRequest("http://localhost/api/profile") as never);
    expect(response.status).toBe(401);
  });

  it("allows authenticated profile updates", async () => {
    getAuthSession.mockResolvedValue({ user: { id: "user-1" } });
    profileFindUnique.mockResolvedValue(null);
    profileUpsert.mockResolvedValue({
      updatedAt: new Date("2026-07-02T00:00:00.000Z"),
      ageRange: null,
      city: null,
      state: null,
      country: null,
      dependents: null,
      occupation: null,
      employmentType: null,
      preferences: null,
      monthlyIncome: null,
      monthlyExpenses: null,
      emergencyFund: null,
      assets: null,
      liabilities: null,
      activeLoans: null,
      monthlyEmis: null,
      goals: null,
      riskProfile: null,
      investmentExperience: null,
      preferredCurrency: null,
      preferredLanguage: null,
    });

    const { PATCH } = await profileRoutePromise;
    const response = await PATCH(jsonRequest("http://localhost/api/profile", { monthlyIncome: 120000 }) as never);
    expect(response.status).toBe(200);
    expect(profileUpsert).toHaveBeenCalled();
  });

  it("requires auth for decision saves", async () => {
    const { POST } = await decisionsRoutePromise;
    const response = await POST(jsonRequest("http://localhost/api/decisions", { workflow: {}, plugin: {}, answers: {}, score: { value: 0, max: 100, percentage: 0, factors: [] } }) as never);
    expect(response.status).toBe(401);
  });

  it("requires auth for sync", async () => {
    const { POST } = await syncRoutePromise;
    const response = await POST(jsonRequest("http://localhost/api/sync", { decisions: [], favorites: [], history: [], profile: null }) as never);
    expect(response.status).toBe(401);
  });

  it("returns recommendations for anonymous users", async () => {
    const { GET } = await recommendationsRoutePromise;
    const response = await GET(nextRequest("http://localhost/api/recommendations"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ workflowRecommendations: expect.any(Array) });
  });

  it("returns 401 for unauthenticated decision detail reads", async () => {
    const { GET } = await decisionByIdRoutePromise;
    const response = await GET(jsonRequest("http://localhost/api/decisions/one") as never, { params: Promise.resolve({ id: "one" }) } as never);
    expect(response.status).toBe(401);
  });

  it("keeps legal status public and acceptance write-protected", async () => {
    const { GET: getStatus } = await legalAcceptanceStatusRoutePromise;
    const { POST } = await legalAcceptanceRoutePromise;

    const statusResponse = await getStatus(nextRequest("http://localhost/api/legal/acceptance/status"));
    expect(statusResponse.status).toBe(200);

    const postResponse = await POST(jsonRequest("http://localhost/api/legal/acceptance", {
      termsVersion: "terms-v1.0",
      privacyVersion: "privacy-v1.0",
      legalAcceptanceVersion: "legal-v1.0",
      acceptedAt: new Date().toISOString(),
    }) as never);
    expect(postResponse.status).toBe(401);
  });
});
