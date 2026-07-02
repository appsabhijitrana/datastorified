import { createDecisionId } from "../utils/ids";
import { createDefaultAnswers, getVisibleQuestions, validateAnswers } from "./questionEngine";
import type { DecisionAnswers, DecisionFacts, DecisionQuestion, DecisionWorkflow } from "../types";
import type { DecisionSession } from "./foundation";

type FlowSession = DecisionSession & {
  metadata?: Record<string, unknown> & {
    validationErrors?: Record<string, string>;
  };
};

type SessionInput = DecisionSession | string;

function hasAnswer(value: DecisionAnswers[string]): boolean {
  return value !== undefined && value !== null && value !== "" && (!Array.isArray(value) || value.length > 0);
}

function isChoiceType(type: DecisionQuestion["type"]): boolean {
  return ["single_choice", "single-select", "select"].includes(type);
}

function isMultiChoiceType(type: DecisionQuestion["type"]): boolean {
  return ["multi_choice", "multi-select"].includes(type);
}

function isNumericType(type: DecisionQuestion["type"]): boolean {
  return ["number", "currency", "percentage", "slider"].includes(type);
}

function isCompatibleAnswer(question: DecisionQuestion, answer: DecisionAnswers[string]): boolean {
  if (!hasAnswer(answer)) return true;
  if (isMultiChoiceType(question.type)) return Array.isArray(answer);
  if (isChoiceType(question.type)) return !Array.isArray(answer);
  if (isNumericType(question.type)) return typeof answer === "number" && Number.isFinite(answer);
  if (question.type === "boolean") return typeof answer === "boolean";
  if (question.type === "text") return typeof answer === "string";
  return true;
}

function validateQuestionAnswer(question: DecisionQuestion, answer: DecisionAnswers[string]): string | undefined {
  if (question.required !== false && !hasAnswer(answer)) {
    return question.validation?.message ?? "This answer is required.";
  }
  if (!hasAnswer(answer)) return undefined;
  if (!isCompatibleAnswer(question, answer)) {
    return question.validation?.message ?? "Please provide a valid answer.";
  }
  if (typeof answer === "number") {
    if (question.validation?.min !== undefined && answer < question.validation.min) {
      return question.validation.message ?? `Value must be at least ${question.validation.min}.`;
    }
    if (question.validation?.max !== undefined && answer > question.validation.max) {
      return question.validation.message ?? `Value must be at most ${question.validation.max}.`;
    }
  }
  if (typeof answer === "string") {
    if (question.validation?.minLength !== undefined && answer.length < question.validation.minLength) {
      return question.validation.message ?? `Answer must contain at least ${question.validation.minLength} characters.`;
    }
    if (question.validation?.maxLength !== undefined && answer.length > question.validation.maxLength) {
      return question.validation.message ?? `Answer must contain at most ${question.validation.maxLength} characters.`;
    }
    if (question.validation?.pattern && !new RegExp(question.validation.pattern, "u").test(answer)) {
      return question.validation.message ?? "Answer is not in the expected format.";
    }
  }
  return undefined;
}

function shallowEqualAnswers(left: DecisionAnswers, right: DecisionAnswers): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every((key) => {
    const leftValue = left[key];
    const rightValue = right[key];
    return Array.isArray(leftValue) && Array.isArray(rightValue)
      ? leftValue.length === rightValue.length && leftValue.every((item, index) => Object.is(item, rightValue[index]))
      : Object.is(leftValue, rightValue);
  });
}

function resolveFacts(workflow: DecisionWorkflow, answers: DecisionAnswers): DecisionFacts {
  return workflow.deriveFacts?.(answers) ?? {};
}

function getVisibleQuestionsForWorkflow(workflow: DecisionWorkflow, answers: DecisionAnswers): DecisionQuestion[] {
  return getVisibleQuestions(workflow.questions, answers, resolveFacts(workflow, answers));
}

function normalizeVisibleAnswers(workflow: DecisionWorkflow, answers: DecisionAnswers): DecisionAnswers {
  let current = { ...answers };
  for (let iteration = 0; iteration < 10; iteration += 1) {
    const visibleIds = new Set(getVisibleQuestionsForWorkflow(workflow, current).map((question) => question.id));
    const next = Object.fromEntries(
      Object.entries(current).filter(([questionId, value]) => visibleIds.has(questionId) && hasAnswer(value)),
    ) as DecisionAnswers;
    if (shallowEqualAnswers(next, current)) return next;
    current = next;
  }
  return current;
}

function resolveQuestion(workflow: DecisionWorkflow, questionId: string): DecisionQuestion | undefined {
  return workflow.questions.find((question) => question.id === questionId);
}

function getSessionOrder(session: FlowSession, workflow: DecisionWorkflow): DecisionQuestion[] {
  return getVisibleQuestionsForWorkflow(workflow, session.answers);
}

function getCurrentIndex(session: FlowSession, workflow: DecisionWorkflow): number {
  const visibleQuestions = getSessionOrder(session, workflow);
  if (!visibleQuestions.length) return -1;
  const currentIndex = session.currentQuestionId ? visibleQuestions.findIndex((question) => question.id === session.currentQuestionId) : -1;
  if (currentIndex >= 0) return currentIndex;
  const firstUnansweredIndex = visibleQuestions.findIndex((question) => !hasAnswer(session.answers[question.id]));
  return firstUnansweredIndex >= 0 ? firstUnansweredIndex : 0;
}

function getFirstUnansweredQuestion(session: FlowSession, workflow: DecisionWorkflow): DecisionQuestion | undefined {
  const visibleQuestions = getSessionOrder(session, workflow);
  return visibleQuestions.find((question) => !hasAnswer(session.answers[question.id]));
}

export class DecisionFlowEngine {
  private readonly sessions = new Map<string, FlowSession>();
  private readonly workflows = new Map<string, DecisionWorkflow>();

  startWorkflow(workflow: DecisionWorkflow): DecisionSession {
    this.workflows.set(workflow.id, workflow);
    const startedAt = new Date().toISOString();
    const session: FlowSession = {
      id: createDecisionId("session"),
      workflowId: workflow.id,
      pluginId: workflow.pluginId,
      status: "draft",
      answers: normalizeVisibleAnswers(workflow, createDefaultAnswers(workflow.questions)),
      currentQuestionId: undefined,
      startedAt,
      updatedAt: startedAt,
    };
    session.currentQuestionId = getFirstUnansweredQuestion(session, workflow)?.id ?? getSessionOrder(session, workflow)[0]?.id;
    this.sessions.set(session.id, session);
    return session;
  }

  answerQuestion(sessionId: string, questionId: string, answer: DecisionAnswers[string]): DecisionSession {
    const resolved = this.resolveSession(sessionId);
    const workflow = this.requireWorkflow(resolved.session);
    const question = resolveQuestion(workflow, questionId);

    if (!question) {
      throw new Error(`Question "${questionId}" was not found in workflow "${workflow.id}".`);
    }

    const visibleQuestions = getSessionOrder(resolved.session, workflow);
    if (!visibleQuestions.some((item) => item.id === questionId)) {
      throw new Error(`Question "${questionId}" is not visible in the current workflow state.`);
    }

    const nextAnswers = normalizeVisibleAnswers(workflow, {
      ...resolved.session.answers,
      [questionId]: answer,
    });
    const validationErrors = validateAnswers(workflow.questions, nextAnswers, resolveFacts(workflow, nextAnswers));
    const questionError = validateQuestionAnswer(question, answer);
    const nextQuestion = questionError ? undefined : this.findNextQuestionFromAnswers(workflow, nextAnswers, questionId);
    const updatedAt = new Date().toISOString();
    const nextSession: FlowSession = {
      ...resolved.session,
      answers: nextAnswers,
      status: "in_progress",
      currentQuestionId: nextQuestion?.id ?? questionId,
      updatedAt,
      metadata: {
        ...(resolved.session.metadata ?? {}),
        validationErrors: Object.keys(validationErrors).length ? validationErrors : undefined,
      },
    };

    this.sessions.set(sessionId, nextSession);
    return nextSession;
  }

  getCurrentQuestion(session: SessionInput): DecisionQuestion | undefined {
    const resolved = this.resolveSession(session);
    const workflow = this.requireWorkflow(resolved.session);
    const visibleQuestions = getSessionOrder(resolved.session, workflow);
    if (!visibleQuestions.length) return undefined;
    const currentIndex = getCurrentIndex(resolved.session, workflow);
    return currentIndex >= 0 ? visibleQuestions[currentIndex] : visibleQuestions[0];
  }

  getNextQuestion(session: SessionInput): DecisionQuestion | undefined {
    const resolved = this.resolveSession(session);
    const workflow = this.requireWorkflow(resolved.session);
    const visibleQuestions = getSessionOrder(resolved.session, workflow);
    if (!visibleQuestions.length) return undefined;
    const currentIndex = getCurrentIndex(resolved.session, workflow);
    if (currentIndex < 0) return visibleQuestions[0];
    return visibleQuestions[currentIndex + 1];
  }

  getPreviousQuestion(session: SessionInput): DecisionQuestion | undefined {
    const resolved = this.resolveSession(session);
    const workflow = this.requireWorkflow(resolved.session);
    const visibleQuestions = getSessionOrder(resolved.session, workflow);
    if (!visibleQuestions.length) return undefined;
    const currentIndex = getCurrentIndex(resolved.session, workflow);
    if (currentIndex <= 0) return undefined;
    return visibleQuestions[currentIndex - 1];
  }

  canGoNext(session: SessionInput): boolean {
    return Boolean(this.getNextQuestion(session));
  }

  canGoBack(session: SessionInput): boolean {
    return Boolean(this.getPreviousQuestion(session));
  }

  calculateProgress(session: SessionInput): number {
    const resolved = this.resolveSession(session);
    const workflow = this.requireWorkflow(resolved.session);
    const visibleQuestions = getSessionOrder(resolved.session, workflow);
    const requiredQuestions = visibleQuestions.filter((question) => question.required !== false);
    if (!requiredQuestions.length) return 100;
    const answered = requiredQuestions.filter((question) => hasAnswer(resolved.session.answers[question.id])).length;
    return Math.round((answered / requiredQuestions.length) * 100);
  }

  completeWorkflow(session: SessionInput): DecisionSession {
    const resolved = this.resolveSession(session);
    const workflow = this.requireWorkflow(resolved.session);
    const answers = normalizeVisibleAnswers(workflow, resolved.session.answers);
    const errors = validateAnswers(workflow.questions, answers, resolveFacts(workflow, answers));
    const updatedAt = new Date().toISOString();

    if (Object.keys(errors).length > 0) {
      const firstInvalidQuestion = getSessionOrder({ ...resolved.session, answers }, workflow).find((question) => errors[question.id]);
      const incompleteSession: FlowSession = {
        ...resolved.session,
        answers,
        status: "in_progress",
        currentQuestionId: firstInvalidQuestion?.id ?? this.getNextRequiredQuestionId(workflow, answers),
        updatedAt,
        metadata: {
          ...(resolved.session.metadata ?? {}),
          validationErrors: errors,
        },
      };
      this.sessions.set(resolved.session.id, incompleteSession);
      return incompleteSession;
    }

    const completedSession: FlowSession = {
      ...resolved.session,
      answers,
      status: "completed",
      currentQuestionId: this.getLastVisibleQuestionId(workflow, answers),
      completedAt: updatedAt,
      updatedAt,
      metadata: {
        ...(resolved.session.metadata ?? {}),
        validationErrors: undefined,
      },
    };
    this.sessions.set(resolved.session.id, completedSession);
    return completedSession;
  }

  private findNextQuestionFromAnswers(workflow: DecisionWorkflow, answers: DecisionAnswers, questionId: string): DecisionQuestion | undefined {
    const visibleQuestions = getVisibleQuestionsForWorkflow(workflow, answers);
    const currentIndex = visibleQuestions.findIndex((question) => question.id === questionId);
    if (currentIndex < 0) return visibleQuestions[0];
    return visibleQuestions[currentIndex + 1];
  }

  private getLastVisibleQuestionId(workflow: DecisionWorkflow, answers: DecisionAnswers): string | undefined {
    const visibleQuestions = getVisibleQuestionsForWorkflow(workflow, answers);
    return visibleQuestions[visibleQuestions.length - 1]?.id;
  }

  private getNextRequiredQuestionId(workflow: DecisionWorkflow, answers: DecisionAnswers): string | undefined {
    const visibleQuestions = getVisibleQuestionsForWorkflow(workflow, answers);
    return visibleQuestions.find((question) => question.required !== false && !hasAnswer(answers[question.id]))?.id;
  }

  private resolveSession(session: SessionInput): { session: FlowSession } {
    if (typeof session === "string") {
      const found = this.sessions.get(session);
      if (!found) throw new Error(`Decision session "${session}" was not found.`);
      return { session: found };
    }

    const cached = this.sessions.get(session.id);
    if (cached) return { session: cached };
    return { session: session as FlowSession };
  }

  private requireWorkflow(session: FlowSession): DecisionWorkflow {
    const workflow = this.workflows.get(session.workflowId);
    if (!workflow) {
      throw new Error(`Workflow "${session.workflowId}" is not registered with this flow engine.`);
    }
    return workflow;
  }
}

export const createDecisionFlowEngine = () => new DecisionFlowEngine();
