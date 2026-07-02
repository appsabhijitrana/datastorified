import type { PrismaClient } from "@prisma/client";

type DecisionCreateData = Parameters<PrismaClient["decision"]["create"]>[0]["data"];
type ProfileCreateData = Omit<Parameters<PrismaClient["profile"]["create"]>[0]["data"], "user" | "userId">;
type ProfileUpdateData = Omit<Parameters<PrismaClient["profile"]["update"]>[0]["data"], "user" | "userId">;
type ProfileUpsertData = Partial<ProfileCreateData> & Partial<ProfileUpdateData>;
type HistoryItemCreateData = Parameters<PrismaClient["historyItem"]["create"]>[0]["data"];
type SyncLogCreateData = Parameters<PrismaClient["syncLog"]["create"]>[0]["data"];

export type RepositoryContext = {
  prisma: PrismaClient;
};

export class DecisionRepository {
  constructor(private readonly context: RepositoryContext) {}

  create(data: DecisionCreateData) {
    return this.context.prisma.decision.create({ data });
  }

  findById(id: string) {
    return this.context.prisma.decision.findUnique({ where: { id }, include: { answersRows: true, favorites: true, historyItems: true } });
  }

  listByUser(userId: string) {
    return this.context.prisma.decision.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
  }
}

export class ProfileRepository {
  constructor(private readonly context: RepositoryContext) {}

  upsertForUser(userId: string, data: ProfileUpsertData) {
    return this.context.prisma.profile.upsert({
      where: { userId },
      create: { ...data, userId },
      update: { ...data, userId },
    });
  }

  findByUserId(userId: string) {
    return this.context.prisma.profile.findFirst({ where: { userId } });
  }
}

export class HistoryRepository {
  constructor(private readonly context: RepositoryContext) {}

  listByUser(userId: string) {
    return this.context.prisma.historyItem.findMany({ where: { userId }, orderBy: { openedAt: "desc" } });
  }

  create(data: HistoryItemCreateData) {
    return this.context.prisma.historyItem.create({ data });
  }
}

export class SyncLogRepository {
  constructor(private readonly context: RepositoryContext) {}

  create(data: SyncLogCreateData) {
    return this.context.prisma.syncLog.create({ data });
  }

  listByDecision(decisionId: string) {
    return this.context.prisma.syncLog.findMany({ where: { decisionId }, orderBy: { createdAt: "desc" } });
  }
}

export const createRepositories = (prisma: PrismaClient) => ({
  decisions: new DecisionRepository({ prisma }),
  profiles: new ProfileRepository({ prisma }),
  history: new HistoryRepository({ prisma }),
  syncLogs: new SyncLogRepository({ prisma }),
});
