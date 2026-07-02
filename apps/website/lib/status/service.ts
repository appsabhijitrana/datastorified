import type { BannerConfig, HealthResponse, MaintenanceConfig, PublicState } from "./types";

declare const process: {
  env: Record<string, string | undefined> & {
    NEXT_PUBLIC_MAINTENANCE_ENABLED?: string;
    NEXT_PUBLIC_MAINTENANCE_MODE?: string;
    NEXT_PUBLIC_MAINTENANCE_MESSAGE?: string;
    NEXT_PUBLIC_MAINTENANCE_START?: string;
    NEXT_PUBLIC_MAINTENANCE_END?: string;
    NEXT_PUBLIC_OUTAGE_ENABLED?: string;
    NEXT_PUBLIC_OUTAGE_MESSAGE?: string;
    NEXT_PUBLIC_SCHEDULED_MAINTENANCE_ENABLED?: string;
    NEXT_PUBLIC_SCHEDULED_MAINTENANCE_MESSAGE?: string;
    NEXT_PUBLIC_APP_VERSION?: string;
  };
};

const readBool = (value: string | undefined) => value === "true";
const readMode = (value: string | undefined): MaintenanceConfig["mode"] => (value === "page" ? "page" : "banner");

const getVersion = () => process.env.NEXT_PUBLIC_APP_VERSION?.trim() || "1.0.0";

export const StatusService = {
  getMaintenance(): MaintenanceConfig {
    return {
      enabled: readBool(process.env.NEXT_PUBLIC_MAINTENANCE_ENABLED),
      mode: readMode(process.env.NEXT_PUBLIC_MAINTENANCE_MODE),
      message: process.env.NEXT_PUBLIC_MAINTENANCE_MESSAGE?.trim() || "We’re taking a short pause to make things better.",
      start: process.env.NEXT_PUBLIC_MAINTENANCE_START?.trim() || undefined,
      end: process.env.NEXT_PUBLIC_MAINTENANCE_END?.trim() || undefined,
    };
  },

  getOutageBanner(): BannerConfig {
    return {
      enabled: readBool(process.env.NEXT_PUBLIC_OUTAGE_ENABLED),
      variant: "outage",
      message: process.env.NEXT_PUBLIC_OUTAGE_MESSAGE?.trim() || "We’re experiencing a temporary issue right now. We know this can be inconvenient, and we appreciate your patience while we get everything back to normal.",
    };
  },

  getScheduledMaintenanceBanner(): BannerConfig {
    return {
      enabled: readBool(process.env.NEXT_PUBLIC_SCHEDULED_MAINTENANCE_ENABLED),
      variant: "scheduled",
      message: process.env.NEXT_PUBLIC_SCHEDULED_MAINTENANCE_MESSAGE?.trim() || "A short maintenance window is planned soon. We’ll keep it brief and restore access as quickly as we can.",
    };
  },

  getMaintenanceBanner(): BannerConfig {
    const maintenance = this.getMaintenance();
    return {
      enabled: maintenance.enabled && maintenance.mode === "banner",
      variant: "maintenance",
      message: maintenance.message,
    };
  },

  getHealth(): HealthResponse {
    const maintenance = this.getMaintenance();
    const banner = this.getMaintenanceBanner();
    const outage = this.getOutageBanner();
    const scheduled = this.getScheduledMaintenanceBanner();
    const status: HealthResponse["status"] = outage.enabled || (maintenance.enabled && maintenance.mode === "page") ? "maintenance" : banner.enabled || scheduled.enabled ? "notice" : "operational";

    return {
      status,
      message: outage.enabled ? outage.message : maintenance.enabled ? maintenance.message : scheduled.enabled ? scheduled.message : undefined,
      version: getVersion(),
      timestamp: new Date().toISOString(),
    };
  },

  getPublicState(): PublicState {
    const maintenance = this.getMaintenance();
    const outage = this.getOutageBanner();
    return {
      outageActive: outage.enabled,
      maintenanceActive: maintenance.enabled,
      maintenanceMode: maintenance.mode,
    };
  },

  shouldBlockPublicPath(pathname: string): boolean {
    const maintenance = this.getMaintenance();
    const outage = this.getOutageBanner();
    if (!outage.enabled && (!maintenance.enabled || maintenance.mode !== "page")) return false;
    if (pathname === "/admin" || pathname.startsWith("/admin/")) return false;
    if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.startsWith("/favicon") || pathname.startsWith("/brand") || pathname.startsWith("/manifest") || pathname.startsWith("/robots") || pathname.startsWith("/sitemap")) return false;
    return pathname !== "/maintenance";
  },
};
