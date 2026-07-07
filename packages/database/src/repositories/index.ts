import type { PrismaClient } from "@prisma/client";

type DecisionCreateData = Record<string, unknown>;
type ProfileUpsertData = Record<string, unknown>;
type HistoryItemCreateData = Record<string, unknown>;
type SyncLogCreateData = Record<string, unknown>;

export type RepositoryContext = {
  prisma: PrismaClient;
};

export class DecisionRepository {
  constructor(private readonly context: RepositoryContext) {}

  create(data: DecisionCreateData) {
    return this.context.prisma.decision.create({ data: data as never });
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
      create: { ...data, userId } as never,
      update: { ...data, userId } as never,
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
    return this.context.prisma.historyItem.create({ data: data as never });
  }
}

export class SyncLogRepository {
  constructor(private readonly context: RepositoryContext) {}

  create(data: SyncLogCreateData) {
    return this.context.prisma.syncLog.create({ data: data as never });
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
