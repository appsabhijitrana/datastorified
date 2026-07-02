import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@datastorified/auth/server";
import { prisma } from "@datastorified/database";
import { decisionPluginRegistry } from "@datastorified/decision-os";
import type { DecisionRepositoryDecision } from "@datastorified/decision-repository";

function buildDecision(row: Awaited<ReturnType<typeof prisma.decision.findFirst>>): DecisionRepositoryDecision | undefined {
  if (!row) return undefined;
  const workflow = decisionPluginRegistry.getWorkflow(row.workflowId) ?? decisionPluginRegistry.getWorkflowBySlug(row.workflowSlug);
  const plugin = workflow ? decisionPluginRegistry.getPlugin(workflow.pluginId) : undefined;
  return {
    id: row.id,
    pluginId: row.pluginId,
    workflowId: row.workflowId,
    plugin: plugin ?? {
      id: row.pluginId,
      name: row.pluginName ?? row.pluginId,
      version: "0",
      categories: row.category ? [row.category] : [],
      keywords: [],
      relatedCalculators: [],
      relatedTools: [],
      knowledgeAssumptions: [],
      workflows: [],
    },
    workflow: workflow ?? {
      id: row.workflowId,
      slug: row.workflowSlug,
      title: row.title,
      version: row.workflowVersion,
      pluginId: row.pluginId,
      category: row.category ?? undefined,
      description: row.question ?? row.title,
      intent: { keywords: [] },
      questions: [],
      rules: [],
      weights: [],
      recommendations: [],
    },
    question: row.question ?? row.title,
    answers: row.answers as DecisionRepositoryDecision["answers"],
    score: row.score as DecisionRepositoryDecision["score"],
    confidence: row.confidence ?? Number((row.score as { percentage?: number } | null | undefined)?.percentage ?? 0),
    riskLevel: (row.riskLevel as DecisionRepositoryDecision["riskLevel"]) ?? "low",
    recommendation: row.recommendation as DecisionRepositoryDecision["recommendation"],
    actionPlan: (row.actionPlan as string[]) ?? [],
    assumptions: (row.assumptions as string[]) ?? workflow?.assumptions ?? [],
    report: undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function requireSession(request: NextRequest) {
  const session = await getAuthSession(request.headers);
  if (!session?.user?.id) return undefined;
  return session;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession(request);
  if (!session) return NextResponse.json({ error: "Anonymous users store decisions locally." }, { status: 401 });
  const { id } = await params;
  const row = await prisma.decision.findFirst({ where: { id, userId: session.user.id } });
  if (!row) return NextResponse.json({ error: "Decision not found." }, { status: 404 });
  const decision = buildDecision(row);
  return NextResponse.json({ decision });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession(request);
  if (!session) return NextResponse.json({ error: "Anonymous users store decisions locally." }, { status: 401 });
  const { id } = await params;
  await prisma.decision.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ deleted: true });
}
