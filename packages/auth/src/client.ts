import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export const signInWithGoogle = async () => authClient.signIn.social({ provider: "google", callbackURL: "/" });
export const signOut = async () => authClient.signOut();
export const useAuthSession = () => authClient.useSession();
