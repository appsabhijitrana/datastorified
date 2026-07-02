import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlatformNoticeProvider } from "./PlatformNoticeProvider";
import { MaintenancePage } from "./MaintenancePage";
import { middleware } from "../../middleware";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

beforeEach(() => {
  vi.unstubAllEnvs();
  window.localStorage.clear();
});

describe("platform notices", () => {
  it("shows a maintenance banner when enabled", () => {
    vi.stubEnv("NEXT_PUBLIC_MAINTENANCE_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_MAINTENANCE_MODE", "banner");
    vi.stubEnv("NEXT_PUBLIC_MAINTENANCE_MESSAGE", "We’re making a small update.");

    render(
      <PlatformNoticeProvider>
        <div>Home</div>
      </PlatformNoticeProvider>,
    );

    expect(screen.getByText("A short pause is in progress")).toBeTruthy();
    expect(screen.getByText("We’re making a small update.")).toBeTruthy();
  });

  it("shows an outage banner when enabled", () => {
    vi.stubEnv("NEXT_PUBLIC_OUTAGE_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_OUTAGE_MESSAGE", "Thanks for your patience while we fix this.");

    render(
      <PlatformNoticeProvider>
        <div>Home</div>
      </PlatformNoticeProvider>,
    );

    expect(screen.getByText("We’re looking into a temporary issue")).toBeTruthy();
    expect(screen.getByText("Thanks for your patience while we fix this.")).toBeTruthy();
  });

  it("renders a minimal maintenance page without technical details", () => {
    render(<MaintenancePage maintenance={{ enabled: true, mode: "page", message: "We’ll be back soon." }} />);

    expect(screen.getByText("We’ll be back shortly")).toBeTruthy();
    expect(screen.getByText("We’ll be back soon.")).toBeTruthy();
    expect(screen.queryByText(/api/i)).toBeNull();
    expect(screen.queryByText(/database/i)).toBeNull();
    expect(screen.queryByText(/auth/i)).toBeNull();
    expect(screen.queryByText(/vercel/i)).toBeNull();
    expect(screen.queryByText(/neon/i)).toBeNull();
    expect(screen.queryByText(/Decision OS/i)).toBeNull();
  });

  it("blocks public pages in maintenance page mode but keeps admin accessible", async () => {
    vi.stubEnv("NEXT_PUBLIC_MAINTENANCE_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_MAINTENANCE_MODE", "page");

    const makeRequest = (href: string) =>
      ({
        nextUrl: Object.assign(new URL(href), {
          clone() {
            return new URL(href);
          },
        }),
      }) as never;

    const publicResponse = middleware(makeRequest("http://localhost/decision"));
    expect(publicResponse.status).toBe(307);
    expect(publicResponse.headers.get("location")).toContain("/maintenance");

    const adminResponse = middleware(makeRequest("http://localhost/admin"));
    expect(adminResponse.status).toBe(200);
  });
});
