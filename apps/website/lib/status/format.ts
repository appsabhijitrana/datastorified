import type { BannerVariant } from "./types";

export function getBannerTone(variant: BannerVariant): "info" | "warning" | "neutral" {
  switch (variant) {
    case "outage":
      return "warning";
    case "scheduled":
      return "neutral";
    case "maintenance":
      return "info";
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
