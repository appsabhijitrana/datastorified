import type { auth } from "./auth";

export type AuthInstance = typeof auth;
export type AuthSession = Awaited<ReturnType<AuthInstance["api"]["getSession"]>>;
export type AuthUser = NonNullable<AuthSession>["user"];
export type AuthSessionState = "anonymous" | "authenticated";

export type AuthStatus = {
  state: AuthSessionState;
  session: AuthSession;
};

export type SocialProvider = "google";
