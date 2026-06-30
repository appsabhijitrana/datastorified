import { compare } from "../rules/operators";
import type { DecisionAnswers, DecisionQuestion } from "../types";
export const isQuestionVisible = (question: DecisionQuestion, answers: DecisionAnswers) => !question.visibility || compare(answers[question.visibility.dependsOn], question.visibility.operator, question.visibility.value);
