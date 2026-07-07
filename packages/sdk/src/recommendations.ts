import type { DataStorifiedClient, PersonalizationContext } from "./client";

export function listRecommendations(client: DataStorifiedClient, context: PersonalizationContext = {}) {
  return client.recommendations.list(context);
}
