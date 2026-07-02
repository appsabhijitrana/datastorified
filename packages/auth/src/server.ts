import { auth } from "./auth";
import type { AuthSession } from "./types";

export async function getAuthSession(requestHeaders?: Headers): Promise<AuthSession> {
  if (!requestHeaders) throw new Error("Request headers are required to read the auth session.");
  return auth.api.getSession({ headers: requestHeaders });
}

export async function isAuthenticated(requestHeaders?: Headers): Promise<boolean> {
  return Boolean(await getAuthSession(requestHeaders));
}
