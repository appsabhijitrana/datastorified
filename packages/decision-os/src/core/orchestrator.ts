import { buildDecisionReport } from "./reportEngine";
import { DecisionFlowEngine, createDecisionFlowEngine } from "./flowEngine";
import { ScoringEngine, scoringEngine } from "./scoringEngine";
import { RiskEngine, riskEngine } from "./riskEngine";
import { ActionPlanEngine, actionPlanEngine } from "./actionPlanEngine";
import { RecommendationEngine, recommendationEngine } from "./recommendationEngine";
import { ScenarioSimulator, scenarioSimulator } from "./scenarioSimulator";
import { createDefaultAnswers, getVisibleQuestions } from "./questionEngine";
import { decisionPluginRegistry } from "../plugins";
import type { DecisionSession } from "./foundation";
import type {
  DecisionActionPlanResult,
  DecisionAnswers,
  DecisionOptionScore,
  DecisionRecommendationResult,
  DecisionReport,
  DecisionRiskAssessment,
  DecisionQuestion,
  DecisionSimulationInputChange,
  DecisionSimulationResult,
  DecisionWorkflow,
  DecisionMemoryDraft,
  DecisionPlugin,
  DecisionRisk,
  DecisionScore,
} from "../types";

export type DecisionOrchestratorRepositoryDecision = {
  id: string;
  pluginId: string;
  workflowId: string;
  plugin: DecisionPlugin;
  workflow: DecisionWorkflow;
  question: string;
  answers: DecisionAnswers;
  score: DecisionScore;
  confidence: number;
  riskLevel: DecisionRisk["severity"];
  recommendation: NonNullable<DecisionReport["recommendation"]>;
  actionPlan: string[];
  assumptions: string[];
  report?: DecisionReport;
  createdAt: string;
  updatedAt: string;
};

export type DecisionOrchestratorState = {
  session: DecisionSession;
  workflow: DecisionWorkflow;
  currentQuestionId?: string;
  progress: number;
  preview: DecisionOrchestratorPreview;
};

export type DecisionOrchestratorPreview = {
  workflow: DecisionWorkflow;
  answers: DecisionAnswers;
  rankedScores: DecisionOptionScore[];
  risks: DecisionRiskAssessment[];
  recommendation: DecisionRecommendationResult;
  actionPlan: DecisionActionPlanResult;
  confidence: number;
  report: DecisionReport;
};

export type DecisionOrchestrationResult = DecisionOrchestratorPreview & {
  session: DecisionSession;
  completedAt: string;
};

export type DecisionOrchestratorRepository = {
  saveDraft(draft: DecisionMemoryDraft): Promise<unknown>;
  getDraft(id: string): Promise<DecisionMemoryDraft | undefined>;
  listDrafts(): Promise<DecisionMemoryDraft[]>;
  updateDraft?(draft: DecisionMemoryDraft): Promise<unknown>;
  deleteDraft(id: string): Promise<unknown>;
  saveDecisionResult?(decision: DecisionOrchestratorRepositoryDecision): Promise<unknown>;
  saveResult?(decision: DecisionOrchestratorRepositoryDecision): Promise<unknown>;
  saveDecision?(decision: DecisionOrchestratorRepositoryDecision): Promise<unknown>;
  saveRecentDecision?(decision: DecisionOrchestratorRepositoryDecision): Promise<unknown>;
  listDecisionResults?(): Promise<DecisionOrchestratorRepositoryDecision[]>;
  listDecisions?(): Promise<DecisionOrchestratorRepositoryDecision[]>;
  listRecentDecisions?(): Promise<DecisionOrchestratorRepositoryDecision[]>;
  getDecision?(id: string): Promise<DecisionOrchestratorRepositoryDecision | undefined>;
  deleteDecision?(id: string): Promise<unknown>;
  clearHistory?(): Promise<unknown>;
};

export type DecisionOrchestratorDependencies = {
  flowEngine?: DecisionFlowEngine;
  scoringEngine?: ScoringEngine;
  riskEngine?: RiskEngine;
  recommendationEngine?: RecommendationEngine;
  actionPlanEngine?: ActionPlanEngine;
  simulator?: ScenarioSimulator;
  repository: DecisionOrchestratorRepository;
};

type WorkflowSessionState = {
  workflow: DecisionWorkflow;
  session: DecisionSession;
};

function isAnswered(value: DecisionAnswers[string]): boolean {
  return value !== undefined && value !== null && value !== "" && (!Array.isArray(value) || value.length > 0);
}

function findWorkflow(workflowSlug: string): DecisionWorkflow {
  return decisionPluginRegistry.getWorkflowBySlug(workflowSlug) ?? decisionPluginRegistry.getWorkflow(workflowSlug) ?? (() => {
    throw new Error(`Unknown Decision OS workflow "${workflowSlug}".`);
  })();
}

function firstDefined<T>(...values: Array<T | undefined>): T | undefined {
  return values.find((value) => value !== undefined);
}

function cloneAnswers(answers: DecisionAnswers): DecisionAnswers {
  return Object.fromEntries(Object.entries(answers).map(([key, value]) => [key, Array.isArray(value) ? [...value] : value])) as DecisionAnswers;
}

function buildDecisionRecord(input: {
  workflow: DecisionWorkflow;
  report: DecisionReport;
  session: DecisionSession;
}): DecisionOrchestratorRepositoryDecision {
  const recommendation = input.report.recommendation ?? input.workflow.recommendations[0];
  if (!recommendation) {
    throw new Error(`Workflow "${input.workflow.slug}" does not define a recommendation template.`);
  }
  return {
    id: input.report.id,
    pluginId: input.workflow.pluginId,
    workflowId: input.workflow.id,
    plugin: decisionPluginRegistry.getPlugin(input.workflow.pluginId) ?? {
      id: input.workflow.pluginId,
      name: input.workflow.pluginId,
      version: "0",
      categories: input.workflow.category ? [input.workflow.category] : [],
      keywords: input.workflow.intent.keywords,
      relatedCalculators: input.workflow.relatedCalculators ?? [],
      relatedTools: input.workflow.relatedTools ?? [],
      knowledgeAssumptions: (input.workflow.assumptions ?? []).map((description, index) => ({ id: `${input.workflow.pluginId}:assumption:${index}`, description })),
      workflows: [input.workflow],
    },
    workflow: input.workflow,
    question: input.workflow.title,
    answers: cloneAnswers(input.report.answers),
    score: input.report.score,
    confidence: Math.round(input.report.score.percentage),
    riskLevel: input.report.risks.reduce<DecisionRisk["severity"]>((current, risk) => {
      const rank: Record<DecisionRisk["severity"], number> = { low: 0, medium: 1, high: 2, critical: 3 };
      return rank[risk.severity] > rank[current] ? risk.severity : current;
    }, "low"),
    recommendation,
    actionPlan: [...input.report.actionPlan],
    assumptions: [...(input.workflow.assumptions ?? [])],
    report: input.report,
    createdAt: input.report.generatedAt,
    updatedAt: input.session.updatedAt,
  };
}

export class DecisionOrchestrator {
  private readonly flowEngine: DecisionFlowEngine;
  private readonly scoringEngine: ScoringEngine;
  private readonly riskEngine: RiskEngine;
  private readonly recommendationEngine: RecommendationEngine;
  private readonly actionPlanEngine: ActionPlanEngine;
  private readonly simulator: ScenarioSimulator;
  private readonly repository: DecisionOrchestratorRepository;
  private readonly sessions = new Map<string, WorkflowSessionState>();
  private readonly results = new Map<string, DecisionOrchestrationResult>();

  constructor(dependencies: DecisionOrchestratorDependencies) {
    this.flowEngine = dependencies.flowEngine ?? createDecisionFlowEngine();
    this.scoringEngine = dependencies.scoringEngine ?? scoringEngine;
    this.riskEngine = dependencies.riskEngine ?? riskEngine;
    this.recommendationEngine = dependencies.recommendationEngine ?? recommendationEngine;
    this.actionPlanEngine = dependencies.actionPlanEngine ?? actionPlanEngine;
    this.simulator = dependencies.simulator ?? scenarioSimulator;
    this.repository = dependencies.repository;
  }

  private requireSession(sessionId: string): WorkflowSessionState {
    const state = this.sessions.get(sessionId);
    if (!state) throw new Error(`Decision session "${sessionId}" was not started by this orchestrator.`);
    return state;
  }

  private analyze(session: DecisionSession, workflow: DecisionWorkflow): DecisionOrchestratorPreview {
    const answers = cloneAnswers(session.answers);
    const scores = this.scoringEngine.calculateOptionScores(workflow, answers);
    const rankedScores = this.scoringEngine.rankOptions(scores);
    const risks = rankedScores.map((score) => this.riskEngine.calculateRisk(workflow, score.optionId, answers, score));
    const recommendation = this.recommendationEngine.generateRecommendation(workflow, answers, rankedScores, risks);
    const actionPlan = this.actionPlanEngine.generateActionPlan(workflow, answers, recommendation, risks);
    const report = buildDecisionReport(workflow, answers, { id: session.id, generatedAt: session.updatedAt });
    return {
      workflow,
      answers,
      rankedScores,
      risks,
      recommendation,
      actionPlan,
      confidence: recommendation.confidence,
      report,
    };
  }

  private toState(state: WorkflowSessionState): DecisionOrchestratorState {
    const currentQuestionId = this.flowEngine.getCurrentQuestion(state.session)?.id;
    const preview = this.analyze(state.session, state.workflow);
    return {
      session: state.session,
      workflow: state.workflow,
      currentQuestionId,
      progress: this.flowEngine.calculateProgress(state.session),
      preview,
    };
  }

  startDecision(workflowSlug: string): DecisionOrchestratorState {
    const workflow = findWorkflow(workflowSlug);
    const session = this.flowEngine.startWorkflow(workflow);
    const state = { workflow, session };
    this.sessions.set(session.id, state);
    return this.toState(state);
  }

  setAnswer(sessionId: string, questionId: string, answer: DecisionAnswers[string], options: { advance?: boolean } = {}): DecisionOrchestratorState {
    const state = this.requireSession(sessionId);
    const currentQuestion = this.flowEngine.getCurrentQuestion(state.session);
    if (!currentQuestion) {
      return this.toState(state);
    }
    state.session = this.flowEngine.answerQuestion(sessionId, questionId, answer);
    if (!options.advance) {
      state.session.currentQuestionId = state.session.currentQuestionId ?? questionId;
    }
    this.sessions.set(sessionId, state);
    return this.toState(state);
  }

  answerCurrentQuestion(sessionId: string, answer: DecisionAnswers[string], options: { advance?: boolean } = {}): DecisionOrchestratorState {
    const state = this.requireSession(sessionId);
    const currentQuestion = this.flowEngine.getCurrentQuestion(state.session);
    if (!currentQuestion) {
      return this.toState(state);
    }
    return this.setAnswer(sessionId, currentQuestion.id, answer, options);
  }

  advanceCurrentQuestion(sessionId: string): DecisionOrchestratorState {
    const state = this.requireSession(sessionId);
    const nextQuestion = this.flowEngine.getNextQuestion(state.session);
    if (!nextQuestion) return this.toState(state);
    state.session = {
      ...state.session,
      currentQuestionId: nextQuestion.id,
      updatedAt: new Date().toISOString(),
    };
    this.sessions.set(sessionId, state);
    return this.toState(state);
  }

  goBackCurrentQuestion(sessionId: string): DecisionOrchestratorState {
    const state = this.requireSession(sessionId);
    const previousQuestion = this.flowEngine.getPreviousQuestion(state.session);
    if (!previousQuestion) return this.toState(state);
    state.session = {
      ...state.session,
      currentQuestionId: previousQuestion.id,
      updatedAt: new Date().toISOString(),
    };
    this.sessions.set(sessionId, state);
    return this.toState(state);
  }

  getDecisionState(sessionId: string): DecisionOrchestratorState {
    return this.toState(this.requireSession(sessionId));
  }

  getCurrentQuestion(sessionId: string): DecisionQuestion | undefined {
    const state = this.requireSession(sessionId);
    return this.flowEngine.getCurrentQuestion(state.session);
  }

  getNextQuestion(sessionId: string): DecisionQuestion | undefined {
    const state = this.requireSession(sessionId);
    return this.flowEngine.getNextQuestion(state.session);
  }

  getPreviousQuestion(sessionId: string): DecisionQuestion | undefined {
    const state = this.requireSession(sessionId);
    return this.flowEngine.getPreviousQuestion(state.session);
  }

  canGoNext(sessionId: string): boolean {
    const state = this.requireSession(sessionId);
    return this.flowEngine.canGoNext(state.session);
  }

  canGoBack(sessionId: string): boolean {
    const state = this.requireSession(sessionId);
    return this.flowEngine.canGoBack(state.session);
  }

  calculateProgress(sessionId: string): number {
    const state = this.requireSession(sessionId);
    return this.flowEngine.calculateProgress(state.session);
  }

  calculateLivePreview(sessionId: string): DecisionOrchestratorPreview {
    const state = this.requireSession(sessionId);
    return this.analyze(state.session, state.workflow);
  }

  completeDecision(sessionId: string): DecisionOrchestrationResult {
    const state = this.requireSession(sessionId);
    const completedSession = this.flowEngine.completeWorkflow(sessionId);
    state.session = completedSession;
    this.sessions.set(sessionId, state);

    const preview = this.analyze(completedSession, state.workflow);
    const completedAt = completedSession.completedAt ?? completedSession.updatedAt;
    const result: DecisionOrchestrationResult = {
      ...preview,
      session: completedSession,
      completedAt,
    };
    this.results.set(sessionId, result);
    return result;
  }

  async saveDraft(session: DecisionSession): Promise<DecisionMemoryDraft> {
    const state = this.requireSession(session.id);
    const currentQuestion = this.flowEngine.getCurrentQuestion(session)?.id ?? session.currentQuestionId;
    const currentStep = currentQuestion ? Math.max(0, state.workflow.questions.findIndex((question) => question.id === currentQuestion)) : undefined;
    const draft: DecisionMemoryDraft = {
      workflowId: state.workflow.id,
      pluginId: state.workflow.pluginId,
      slug: state.workflow.slug,
      answers: cloneAnswers(session.answers),
      currentStep,
      step: currentStep,
      updatedAt: new Date().toISOString(),
    };
    await this.repository.saveDraft(draft);
    return draft;
  }

  async clearDraft(workflowId: string): Promise<void> {
    await this.repository.deleteDraft(workflowId);
  }

  async listDrafts(): Promise<DecisionMemoryDraft[]> {
    return this.repository.listDrafts();
  }

  async loadDraft(draftId: string): Promise<DecisionOrchestratorState | undefined> {
    const draft = await this.repository.getDraft(draftId);
    if (!draft) return undefined;
    const workflow = findWorkflow(draft.slug ?? draft.workflowId);
    const session = this.flowEngine.startWorkflow(workflow);
    session.answers = { ...createDefaultAnswers(workflow.questions), ...cloneAnswers(draft.answers) };
    const facts = workflow.deriveFacts?.(session.answers) ?? {};
    const visibleQuestions = getVisibleQuestions(workflow.questions, session.answers, facts);
    const savedStep = typeof draft.currentStep === "number" ? draft.currentStep : draft.step;
    const restoredQuestionId =
      typeof savedStep === "number" && savedStep >= 0 && savedStep < workflow.questions.length
        ? workflow.questions[savedStep]?.id
        : undefined;
    session.currentQuestionId = firstDefined(
      restoredQuestionId && visibleQuestions.some((question) => question.id === restoredQuestionId)
        ? restoredQuestionId
        : undefined,
      visibleQuestions.find((question) => !isAnswered(session.answers[question.id]))?.id,
      visibleQuestions[0]?.id,
      workflow.questions[0]?.id,
    );
    session.status = "in_progress";
    session.updatedAt = draft.updatedAt;
    this.sessions.set(session.id, { workflow, session });
    return this.toState(this.sessions.get(session.id)!);
  }

  async saveResult(result: DecisionOrchestrationResult): Promise<DecisionOrchestratorRepositoryDecision> {
    const record = buildDecisionRecord({ workflow: result.workflow, report: result.report, session: result.session });
    const saver = this.repository.saveDecisionResult ?? this.repository.saveResult ?? this.repository.saveDecision;
    if (!saver) {
      throw new Error("The configured repository does not support saving decision results.");
    }
    await saver.call(this.repository, record);
    if (this.repository.saveRecentDecision) {
      await this.repository.saveRecentDecision(record);
    }
    return record;
  }

  async saveDecisionRecord(decision: DecisionOrchestratorRepositoryDecision): Promise<DecisionOrchestratorRepositoryDecision> {
    const saver = this.repository.saveDecisionResult ?? this.repository.saveResult ?? this.repository.saveDecision;
    if (!saver) {
      throw new Error("The configured repository does not support saving decision records.");
    }
    await saver.call(this.repository, decision);
    if (this.repository.saveRecentDecision) {
      await this.repository.saveRecentDecision(decision);
    }
    return decision;
  }

  async listRecentDecisions(): Promise<DecisionOrchestratorRepositoryDecision[]> {
    if (this.repository.listRecentDecisions) return this.repository.listRecentDecisions();
    if (this.repository.listDecisions) return this.repository.listDecisions();
    return [];
  }

  async listSavedDecisions(): Promise<DecisionOrchestratorRepositoryDecision[]> {
    if (this.repository.listDecisions) return this.repository.listDecisions();
    if (this.repository.listDecisionResults) return this.repository.listDecisionResults();
    return [];
  }

  async getDecision(id: string): Promise<DecisionOrchestratorRepositoryDecision | undefined> {
    if (this.repository.getDecision) return this.repository.getDecision(id);
    const saved = await this.listSavedDecisions();
    return saved.find((decision) => decision.id === id);
  }

  async deleteDecision(id: string): Promise<void> {
    if (this.repository.deleteDecision) {
      await this.repository.deleteDecision(id);
    }
  }

  simulate(sessionId: string, changes: readonly DecisionSimulationInputChange[]): DecisionSimulationResult {
    const state = this.requireSession(sessionId);
    const session = { ...state.session, workflow: state.workflow, answers: cloneAnswers(state.session.answers) } as DecisionSession & { workflow: DecisionWorkflow };
    if (changes.length === 1) {
      return this.simulator.simulateChange(session, changes[0]);
    }
    return this.simulator.simulateMultipleChanges(session, changes);
  }

  getCompletedResult(sessionId: string): DecisionOrchestrationResult | undefined {
    return this.results.get(sessionId);
  }
}

export function createDecisionOrchestrator(dependencies: DecisionOrchestratorDependencies): DecisionOrchestrator {
  return new DecisionOrchestrator(dependencies);
}
