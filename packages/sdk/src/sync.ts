import type { DataStorifiedClient, SyncPayload } from "./client";

export function syncLocalToCloud(client: DataStorifiedClient, payload: SyncPayload) {
  return client.sync.push(payload);
}
