import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@datastorified/database";

declare const require: {
  (id: string): {
    existsSync: (path: string) => boolean;
    readFileSync: (path: string, encoding: string) => string;
    join: (...parts: string[]) => string;
    resolve: (...parts: string[]) => string;
  };
};

declare const process: {
  env: Record<string, string | undefined> & {
    NODE_ENV?: "development" | "production" | "test";
    BETTER_AUTH_SECRET?: string;
    BETTER_AUTH_URL?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
  };
  cwd?: () => string;
};

const fs = require("fs");
const path = require("path");

const loadWorkspaceEnv = () => {
  const candidates = [
    process.cwd?.() ?? ".",
    path.resolve(process.cwd?.() ?? ".", ".."),
    path.resolve(process.cwd?.() ?? ".", "../.."),
  ];
  const filenames = [".env.local", ".env.development", ".env"];
  for (const directory of candidates) {
    for (const filename of filenames) {
      const envPath = path.join(directory, filename);
      if (!fs.existsSync(envPath)) continue;
      const contents = fs.readFileSync(envPath, "utf8");
      for (const line of contents.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const separatorIndex = trimmed.indexOf("=");
        if (separatorIndex <= 0) continue;
        const key = trimmed.slice(0, separatorIndex).trim();
        if (!key || process.env[key] !== undefined) continue;
        let value = trimmed.slice(separatorIndex + 1).trim();
        if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
      return;
    }
  }
};

loadWorkspaceEnv();

const secret = process.env.BETTER_AUTH_SECRET ?? "datastorified-development-secret-key-change-me";
const normalizeOrigin = (value: string | undefined) => {
  if (!value) return undefined;
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
};
const previewOrigin = normalizeOrigin(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
const configuredOrigin = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL) ?? normalizeOrigin(process.env.BETTER_AUTH_URL);
const baseURL = configuredOrigin ?? previewOrigin ?? "http://localhost:3000";
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const trustedOrigins = [...new Set([
  baseURL,
  previewOrigin,
  normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL),
  normalizeOrigin(process.env.BETTER_AUTH_URL),
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://datastorified.com",
  "https://www.datastorified.com",
])].filter((origin): origin is string => Boolean(origin));

export const auth = betterAuth({
  baseURL,
  secret,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  trustedOrigins,
  socialProviders: googleClientId && googleClientSecret ? {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      redirectURI: `${baseURL}/api/auth/callback/google`,
    },
  } : undefined,
  advanced: {
    cookiePrefix: "ds",
  },
});
