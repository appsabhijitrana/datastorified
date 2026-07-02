export type AuthSessionState = "anonymous" | "authenticated";

export type AuthUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export type AuthSession = {
  user: AuthUser;
  expiresAt?: Date | string | null;
  token?: string | null;
} | null;

export type AuthStatus = {
  state: AuthSessionState;
  session: AuthSession;
};

export type SocialProvider = "google";

