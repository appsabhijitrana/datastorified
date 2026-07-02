export type MaintenanceConfig = {
  enabled: boolean;
  message: string;
  eta?: string;
};

export type BannerLevel = "info" | "success" | "warning" | "critical";

export type BannerConfig = {
  enabled: boolean;
  level: BannerLevel;
  title: string;
  message: string;
  link: string;
  version: string;
};

export type ServiceState = "operational" | "degraded" | "maintenance" | "outage";

export type ServiceStatus = {
  id: string;
  name: string;
  description: string;
  state: ServiceState;
  updatedAt: string;
};

export type IncidentStatus = "investigating" | "identified" | "monitoring" | "resolved" | "completed";

export type Incident = {
  id: string;
  title: string;
  status: IncidentStatus;
  service: string;
  message: string;
  timestamp: string;
};

export type SystemStatus = "operational" | "degraded" | "partial_outage" | "major_outage" | "maintenance";

export type HealthServiceStatus = "healthy" | "degraded" | "maintenance" | "outage";

export type HealthResponse = {
  status: "healthy" | "degraded" | "partial_outage" | "major_outage" | "maintenance";
  systemStatus: SystemStatus;
  version: string;
  timestamp: string;
  uptime: number;
  services: Record<string, HealthServiceStatus>;
};
