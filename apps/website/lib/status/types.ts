export type MaintenanceConfig = {
  enabled: boolean;
  mode: "banner" | "page";
  message: string;
  start?: string;
  end?: string;
};

export type BannerVariant = "maintenance" | "outage" | "scheduled";

export type BannerConfig = {
  enabled: boolean;
  variant: BannerVariant;
  message: string;
};

export type HealthResponse = {
  status: "operational" | "notice" | "maintenance";
  message?: string;
  version: string;
  timestamp: string;
};

export type PublicState = {
  outageActive: boolean;
  maintenanceActive: boolean;
  maintenanceMode: "banner" | "page";
};
