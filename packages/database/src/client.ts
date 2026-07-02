import { PrismaClient } from "@prisma/client";

declare const process: {
  env: Record<string, string | undefined> & {
    NODE_ENV?: "development" | "production" | "test";
  };
};

declare global {
  // eslint-disable-next-line no-var
  var __datastorifiedPrisma: PrismaClient | undefined;
}

const createClient = () =>
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

export const prisma = globalThis.__datastorifiedPrisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalThis.__datastorifiedPrisma = prisma;
