export type DecisionOSMaintenanceState = "normal" | "maintenance_banner" | "scheduled_maintenance" | "outage_blocking";

export interface DecisionOSStatus {
  state: DecisionOSMaintenanceState;
  message?: string;
}
