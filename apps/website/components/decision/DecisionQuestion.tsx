"use client";

import type { DecisionQuestion as Question, DecisionValue } from "@datastorified/decision-os";
import { QuestionRenderer } from "./QuestionRenderer";

export function DecisionQuestion({
  question,
  value,
  onChange,
  error,
  helperOverride,
  whyWeAsk,
  disabled,
}: {
  question: Question;
  value: DecisionValue | undefined;
  onChange: (value: DecisionValue) => void;
  error?: string;
  helperOverride?: string;
  whyWeAsk?: string;
  disabled?: boolean;
}) {
  return (
    <QuestionRenderer
      question={question}
      value={value}
      onChange={onChange}
      error={error}
      disabled={disabled}
      helperOverride={helperOverride}
      whyWeAsk={whyWeAsk}
    />
  );
}
