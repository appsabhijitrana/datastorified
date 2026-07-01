import { describe, expect, it } from "vitest";
import { getVisibleQuestions, isQuestionVisible } from "../core/questionEngine";
import { workflow } from "./fixtures";

describe("question engine", () => {
  it("shows conditional questions only when configured conditions match", () => {
    const conditional = workflow.questions[1];
    expect(isQuestionVisible(conditional, { workStyle: "solo" })).toBe(false);
    expect(isQuestionVisible(conditional, { workStyle: "team" })).toBe(true);
    expect(getVisibleQuestions(workflow.questions, { workStyle: "solo" }).map(({ id }) => id)).not.toContain("collaboration");
  });
});
