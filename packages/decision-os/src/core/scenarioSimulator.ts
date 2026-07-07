import { formatDecisionValue } from "../utils/format";
import { calculateOptionScores } from "./scoringEngine";
import { calculateRisk } from "./riskEngine";
import { generateRecommendation, selectWinner } from "./recommendationEngine";
import { selectRecommendation } from "./recommendationEngine";
import { round } from "../utils/math";
import type {
  DecisionAnswers,
  DecisionFacts,
  DecisionOptionScore,
  DecisionRecommendationResult,
  DecisionRiskAssessment,
  DecisionSimulationChange,
  DecisionSimulationComparison,
  DecisionSimulationInputChange,
  DecisionSimulationResult,
  DecisionSimulationSnapshot,
  DecisionWorkflow,
} from "../types";
import type { DecisionSession } from "./foundation";

type ScenarioSession = DecisionSession & {
  workflow: DecisionWorkflow;
};

type SimulationState = {
  answers: DecisionAnswers;
  scores: DecisionOptionScore[];
  risks: DecisionRiskAssessment[];
  recommendation: DecisionRecommendationResult;
  winnerOptionId?: string;
  recommendationId?: string;
  confidence: number;
  score: number;
};

function cloneAnswers(answers: DecisionAnswers): DecisionAnswers {
  return Object.fromEntries(
    Object.entries(answers).map(([key, value]) => [
      key,
      Array.isArray(value) ? [...value] : value,
    ]),
  );
}

function buildFacts(workflow: Readonly<DecisionWorkflow>, answers: Readonly<DecisionAnswers>): DecisionFacts {
  return { ...answers, ...(workflow.deriveFacts?.(answers) ?? {}) };
}

function buildSnapshot(workflow: Readonly<DecisionWorkflow>, answers: DecisionAnswers): SimulationState {
  const scores = calculateOptionScores(workflow, answers);
  const risks = scores.map((score) => calculateRisk(workflow, score.optionId, answers, score));
  const winner = selectWinner(scores, risks);
  const recommendation = generateRecommendation(workflow, answers, scores, risks);
  const facts = buildFacts(workflow, answers);
  const recommendationBand = winner ? selectRecommendation(workflow.recommendations, winner.adjustedScore, facts) : undefined;
  return {
    answers,
    scores,
    risks,
    recommendation,
    winnerOptionId: winner?.optionId,
    recommendationId: recommendationBand?.id,
    confidence: recommendation.confidence,
    score: winner ? winner.adjustedScore : 0,
  };
}

function buildSimulationChange(
  questionId: string,
  beforeValue: DecisionAnswers[string],
  afterValue: DecisionAnswers[string],
): DecisionSimulationChange {
  return { questionId, beforeValue, afterValue };
}

export function detectRecommendationChange(beforeResult: DecisionSimulationSnapshot, afterResult: DecisionSimulationSnapshot): boolean {
  return beforeResult.winnerOptionId !== afterResult.winnerOptionId || beforeResult.recommendationId !== afterResult.recommendationId;
}

export function compareBeforeAfter(beforeResult: DecisionSimulationSnapshot, afterResult: DecisionSimulationSnapshot): DecisionSimulationComparison {
  return {
    changedInputs: [],
    beforeScore: beforeResult.score,
    afterScore: afterResult.score,
    scoreDelta: round(afterResult.score - beforeResult.score),
    beforeWinner: beforeResult.winnerOptionId,
    afterWinner: afterResult.winnerOptionId,
    recommendationChanged: detectRecommendationChange(beforeResult, afterResult),
    explanation: "",
  };
}

export function generateSimulationExplanation(
  beforeResult: DecisionSimulationSnapshot,
  afterResult: DecisionSimulationSnapshot,
  changedInputs: readonly DecisionSimulationChange[],
): string {
  const parts: string[] = [];
  if (changedInputs.length === 0) {
    parts.push("No inputs changed in the simulation.");
  } else {
    const changeText = changedInputs
      .map((change) => `${change.questionId} from ${formatDecisionValue(change.beforeValue)} to ${formatDecisionValue(change.afterValue)}`)
      .join(", ");
    parts.push(`Changed ${changeText}.`);
  }

  const scoreDelta = round(afterResult.score - beforeResult.score);
  const direction = scoreDelta > 0 ? "improved" : scoreDelta < 0 ? "declined" : "stayed the same";
  parts.push(`The selected score ${direction} by ${Math.abs(scoreDelta)} points.`);

  if (detectRecommendationChange(beforeResult, afterResult)) {
    if (beforeResult.winnerOptionId !== afterResult.winnerOptionId) {
      parts.push(`The winner changed from ${beforeResult.winnerOptionId ?? "none"} to ${afterResult.winnerOptionId ?? "none"}.`);
    }
    if (beforeResult.recommendationId !== afterResult.recommendationId) {
      parts.push("The recommendation band changed after the input update.");
    }
  } else {
    parts.push("The recommendation stayed consistent after the update.");
  }

  if (afterResult.confidence !== beforeResult.confidence) {
    parts.push(`Confidence moved from ${beforeResult.confidence}% to ${afterResult.confidence}%.`);
  }

  return parts.join(" ");
}

function createSessionClone(session: ScenarioSession, answers: DecisionAnswers): ScenarioSession {
  return {
    ...session,
    answers: cloneAnswers(answers),
  };
}

function buildSnapshotFromSession(session: ScenarioSession): DecisionSimulationSnapshot & { state: SimulationState } {
  const workflow = session.workflow;
  const state = buildSnapshot(workflow, cloneAnswers(session.answers));
  return {
    score: state.score,
    winnerOptionId: state.winnerOptionId,
    recommendationId: state.recommendationId,
    recommendationChanged: false,
    confidence: state.confidence,
    state,
  };
}

export function simulateChange(
  session: ScenarioSession,
  changedInput: DecisionSimulationInputChange,
): DecisionSimulationResult {
  const before = buildSnapshotFromSession(createSessionClone(session, session.answers));
  const nextAnswers = cloneAnswers(session.answers);
  nextAnswers[changedInput.questionId] = Array.isArray(changedInput.value) ? [...changedInput.value] : changedInput.value;
  const after = buildSnapshotFromSession(createSessionClone(session, nextAnswers));
  const comparison = compareBeforeAfter(before, after);
  const changedInputs = [buildSimulationChange(changedInput.questionId, session.answers[changedInput.questionId], changedInput.value)];
  const explanation = generateSimulationExplanation(before, after, changedInputs);

  return {
    ...comparison,
    changedInputs,
    explanation,
    beforeResult: {
      score: before.score,
      winnerOptionId: before.winnerOptionId,
      recommendationId: before.recommendationId,
      confidence: before.confidence,
    },
    afterResult: {
      score: after.score,
      winnerOptionId: after.winnerOptionId,
      recommendationId: after.recommendationId,
      confidence: after.confidence,
    },
  };
}

export function simulateMultipleChanges(
  session: ScenarioSession,
  changedInputs: readonly DecisionSimulationInputChange[],
): DecisionSimulationResult {
  const before = buildSnapshotFromSession(createSessionClone(session, session.answers));
  const nextAnswers = cloneAnswers(session.answers);
  for (const change of changedInputs) {
    nextAnswers[change.questionId] = Array.isArray(change.value) ? [...change.value] : change.value;
  }
  const after = buildSnapshotFromSession(createSessionClone(session, nextAnswers));
  const comparison = compareBeforeAfter(before, after);
  const normalizedChanges = changedInputs.map((change) =>
    buildSimulationChange(change.questionId, session.answers[change.questionId], change.value),
  );
  const explanation = generateSimulationExplanation(before, after, normalizedChanges);

  return {
    ...comparison,
    changedInputs: normalizedChanges,
    explanation,
    beforeResult: {
      score: before.score,
      winnerOptionId: before.winnerOptionId,
      recommendationId: before.recommendationId,
      confidence: before.confidence,
    },
    afterResult: {
      score: after.score,
      winnerOptionId: after.winnerOptionId,
      recommendationId: after.recommendationId,
      confidence: after.confidence,
    },
  };
}

export class ScenarioSimulator {
  simulateChange(
    session: ScenarioSession,
    changedInput: DecisionSimulationInputChange,
  ): DecisionSimulationResult {
    return simulateChange(session, changedInput);
  }

  simulateMultipleChanges(
    session: ScenarioSession,
    changedInputs: readonly DecisionSimulationInputChange[],
  ): DecisionSimulationResult {
    return simulateMultipleChanges(session, changedInputs);
  }

  compareBeforeAfter(beforeResult: DecisionSimulationSnapshot, afterResult: DecisionSimulationSnapshot): DecisionSimulationComparison {
    return compareBeforeAfter(beforeResult, afterResult);
  }

  detectRecommendationChange(beforeResult: DecisionSimulationSnapshot, afterResult: DecisionSimulationSnapshot): boolean {
    return detectRecommendationChange(beforeResult, afterResult);
  }

  generateSimulationExplanation(
    beforeResult: DecisionSimulationSnapshot,
    afterResult: DecisionSimulationSnapshot,
    changedInputs: readonly DecisionSimulationChange[],
  ): string {
    return generateSimulationExplanation(beforeResult, afterResult, changedInputs);
  }
}

export const scenarioSimulator = new ScenarioSimulator();
