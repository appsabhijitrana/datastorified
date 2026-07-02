import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@datastorified/auth";
import { prisma } from "@datastorified/database";
import { decisionPluginRegistry } from "@datastorified/decision-os";
import type { DecisionRepositoryDecision, DecisionRepositoryInput } from "@datastorified/decision-repository";

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
    answers: (row.answers as DecisionRepositoryInput["answers"]) ?? {},
    score: (row.score as DecisionRepositoryDecision["score"]) ?? { value: 0, max: 100, percentage: 0, factors: [] },
    confidence: row.confidence ?? Number((row.score as { percentage?: number } | null | undefined)?.percentage ?? 0),
    riskLevel: (row.riskLevel as DecisionRepositoryDecision["riskLevel"]) ?? "low",
    recommendation: (row.recommendation as DecisionRepositoryDecision["recommendation"]) ?? workflow?.recommendations[0] ?? {
      id: `${row.workflowId}:default`,
      minScore: 0,
      maxScore: 100,
      title: row.title,
      summary: row.question ?? row.title,
      actions: [],
    },
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

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (!session) return NextResponse.json({ error: "Anonymous users store decisions locally." }, { status: 401 });

  const rows = await prisma.decision.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ decisions: rows.map((row) => buildDecision(row)).filter(Boolean) });
}

export async function POST(request: NextRequest) {
  const session = await requireSession(request);
  if (!session) return NextResponse.json({ error: "Anonymous users store decisions locally." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Partial<DecisionRepositoryInput>;
  if (!body.workflow || !body.plugin || !body.answers || !body.score) {
    return NextResponse.json({ error: "Invalid decision payload." }, { status: 400 });
  }

  const id = body.id ?? `${body.workflowId}:${body.workflow.slug}:${Date.now()}`;
  const workflow = decisionPluginRegistry.getWorkflow(body.workflowId ?? body.workflow.id) ?? body.workflow;
  const plugin = decisionPluginRegistry.getPlugin(workflow.pluginId) ?? body.plugin;
  const now = new Date().toISOString();
  const saved = await prisma.decision.upsert({
    where: { id },
    create: {
      id,
      userId: session.user.id,
      pluginId: body.pluginId ?? plugin.id,
      pluginName: plugin.name ?? plugin.id,
      workflowId: body.workflowId ?? workflow.id,
      workflowSlug: workflow.slug,
      workflowVersion: workflow.version,
      title: workflow.title,
      category: workflow.category ?? null,
      question: body.question ?? body.workflow.title,
      answers: body.answers as object,
      score: body.score as object,
      confidence: body.confidence ?? null,
      riskLevel: body.riskLevel ?? null,
      recommendation: body.recommendation as object,
      actionPlan: body.actionPlan as object,
      assumptions: body.assumptions as object,
      status: "saved",
      source: "cloud",
      createdAt: body.createdAt ? new Date(body.createdAt) : new Date(now),
      updatedAt: body.updatedAt ? new Date(body.updatedAt) : new Date(now),
    },
    update: {
      userId: session.user.id,
      pluginId: body.pluginId ?? plugin.id,
      pluginName: plugin.name ?? plugin.id,
      workflowId: body.workflowId ?? workflow.id,
      workflowSlug: workflow.slug,
      workflowVersion: workflow.version,
      title: workflow.title,
      category: workflow.category ?? null,
      question: body.question ?? body.workflow.title,
      answers: body.answers as object,
      score: body.score as object,
      confidence: body.confidence ?? null,
      riskLevel: body.riskLevel ?? null,
      recommendation: body.recommendation as object,
      actionPlan: body.actionPlan as object,
      assumptions: body.assumptions as object,
      status: "saved",
      source: "cloud",
      updatedAt: body.updatedAt ? new Date(body.updatedAt) : new Date(now),
    },
  });

  const decision = buildDecision(saved);
  return NextResponse.json({ decision });
}
