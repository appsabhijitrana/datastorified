import { type DecisionOSStatus, type DecisionOSMaintenanceState } from "./types";

export class DecisionOSStatusService {
  static getStatus(): DecisionOSStatus {
    const state = (process.env.NEXT_PUBLIC_DECISION_OS_MAINTENANCE_STATE?.toLowerCase() ?? "normal") as DecisionOSMaintenanceState;
    const message = process.env.NEXT_PUBLIC_DECISION_OS_MAINTENANCE_MESSAGE;

    return { state, message };
  }
}
