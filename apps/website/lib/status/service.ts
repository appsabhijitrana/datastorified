import { defaultStatusServices, sampleIncidents } from "./config";
import type { BannerConfig, HealthResponse, HealthServiceStatus, MaintenanceConfig, ServiceState, ServiceStatus, SystemStatus } from "./types";

declare const process: {
  env: Record<string, string | undefined> & {
    MAINTENANCE_MODE?: string;
    MAINTENANCE_MESSAGE?: string;
    MAINTENANCE_ETA?: string;
    OUTAGE_BANNER_ENABLED?: string;
    OUTAGE_BANNER_LEVEL?: string;
    OUTAGE_BANNER_TITLE?: string;
    OUTAGE_BANNER_MESSAGE?: string;
    OUTAGE_BANNER_LINK?: string;
    OUTAGE_BANNER_VERSION?: string;
    NEXT_PUBLIC_APP_VERSION?: string;
  };
};

const readBool = (value: string | undefined) => value === "true";
const readBannerLevel = (value: string | undefined): BannerConfig["level"] => {
  if (value === "info" || value === "success" || value === "warning" || value === "critical") return value;
  return "warning";
};

const cloneServices = (state: ServiceState): ServiceStatus[] =>
  defaultStatusServices.map((service) => ({ ...service, state, updatedAt: new Date().toISOString() }));

const stateToHealth: Record<ServiceState, HealthServiceStatus> = {
  operational: "healthy",
  degraded: "degraded",
  maintenance: "maintenance",
  outage: "outage",
};

const startedAt = Date.now();

export const StatusService = {
  getMaintenance(): MaintenanceConfig {
    return {
      enabled: readBool(process.env.MAINTENANCE_MODE),
      message: process.env.MAINTENANCE_MESSAGE?.trim() || "We’re making improvements and will be back shortly.",
      eta: process.env.MAINTENANCE_ETA?.trim() || undefined,
    };
  },

  getBanner(): BannerConfig {
    const version = process.env.OUTAGE_BANNER_VERSION?.trim() || process.env.NEXT_PUBLIC_APP_VERSION?.trim() || "1";
    return {
      enabled: readBool(process.env.OUTAGE_BANNER_ENABLED),
      level: readBannerLevel(process.env.OUTAGE_BANNER_LEVEL),
      title: process.env.OUTAGE_BANNER_TITLE?.trim() || "Service notice",
      message: process.env.OUTAGE_BANNER_MESSAGE?.trim() || "We’re actively monitoring a service update.",
      link: process.env.OUTAGE_BANNER_LINK?.trim() || "/status",
      version,
    };
  },

  getServices(): ServiceStatus[] {
    const maintenance = this.getMaintenance();
    if (maintenance.enabled) {
      return cloneServices("maintenance");
    }
    return defaultStatusServices.map((service) => ({ ...service }));
  },

  getIncidents() {
    return sampleIncidents.map((incident) => ({ ...incident }));
  },

  getSystemStatus(): SystemStatus {
    const maintenance = this.getMaintenance();
    if (maintenance.enabled) return "maintenance";
    const services = this.getServices();
    if (services.some((service) => service.state === "outage")) return "major_outage";
    if (services.some((service) => service.state === "degraded")) return "degraded";
    if (services.some((service) => service.state === "maintenance")) return "maintenance";
    return "operational";
  },

  getHealth(): HealthResponse {
    const services = this.getServices();
    const systemStatus = this.getSystemStatus();
    const status: HealthResponse["status"] =
      systemStatus === "operational" ? "healthy" : systemStatus;
    return {
      status,
      systemStatus,
      version: process.env.NEXT_PUBLIC_APP_VERSION?.trim() || "1.0.0",
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startedAt) / 1000),
      services: Object.fromEntries(services.map((service) => [service.id, stateToHealth[service.state]])) as HealthResponse["services"],
    };
  },
};
