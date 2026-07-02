import type { BannerLevel, ServiceState, SystemStatus } from "./types";

export function formatServiceState(state: ServiceState): string {
  switch (state) {
    case "operational":
      return "Operational";
    case "degraded":
      return "Degraded";
    case "maintenance":
      return "Maintenance";
    case "outage":
      return "Outage";
    default:
      return state;
  }
}

export function formatSystemStatus(status: SystemStatus): string {
  switch (status) {
    case "operational":
      return "All Systems Operational";
    case "degraded":
      return "Some Systems Degraded";
    case "partial_outage":
      return "Partial Outage";
    case "major_outage":
      return "Major Outage";
    case "maintenance":
      return "Scheduled Maintenance";
    default:
      return status;
  }
}

export function getStatusTone(state: ServiceState | SystemStatus | BannerLevel): "success" | "info" | "warning" | "critical" {
  switch (state) {
    case "operational":
    case "success":
      return "success";
    case "info":
      return "info";
    case "degraded":
    case "warning":
    case "partial_outage":
      return "warning";
    case "maintenance":
      return "info";
    case "outage":
    case "critical":
    case "major_outage":
      return "critical";
    default:
      return "info";
  }
}

export function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s remaining`;
}

