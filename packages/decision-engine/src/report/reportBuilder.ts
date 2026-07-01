import type { DecisionAnalysis, DecisionReport } from "../types";
import { formatAnswer } from "../utils/format";
import { decisionDisclaimer } from "../recommendation/recommendationTemplates";
export function buildReport(analysis: DecisionAnalysis, question = analysis.config.question, createdAt = new Date().toISOString()): DecisionReport {
  return { title: analysis.config.title, question, createdAt, inputs: analysis.config.questions.filter((item) => analysis.answers[item.id] !== undefined).map((item) => ({ label: item.label, value: formatAnswer(item, analysis.answers[item.id]!) })), score: analysis.score, factors: analysis.score.factors, risks: analysis.risk.risks, recommendation: analysis.recommendation, actionPlan: analysis.recommendation.actionPlan, assumptions: ["Inputs are accurate and remain broadly stable.", "Calculator projections are planning estimates, not guarantees.", "Taxes, fees, market conditions, and personal constraints can change the outcome."], disclaimer: decisionDisclaimer };
}
export const reportSummary = (report: DecisionReport) => `${report.title}\nScore: ${report.score.score}/100 — ${report.score.label}\nVerdict: ${report.recommendation.verdict}\n${report.recommendation.summary}\nNext step: ${report.recommendation.nextBestAction}\n\n${report.disclaimer}`;
