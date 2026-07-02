import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@datastorified/database";

declare const process: {
  env: Record<string, string | undefined> & {
    NODE_ENV?: "development" | "production" | "test";
    BETTER_AUTH_SECRET?: string;
    BETTER_AUTH_URL?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
  };
};

const secret = process.env.BETTER_AUTH_SECRET ?? "datastorified-development-secret-key-change-me";
const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

export const auth = betterAuth({
  baseURL,
  secret,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  socialProviders: googleClientId && googleClientSecret ? {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    },
  } : undefined,
  advanced: {
    cookiePrefix: "ds",
  },
});
