import type { DecisionWorkflow } from "../../types";
import {
  booleanAnswer,
  booleanQuestion,
  calculatorValue,
  currencyQuestion,
  numberAnswer,
  numberQuestion,
  ratio,
  risk,
  selectQuestion,
  sliderQuestion,
  standardScoreBands,
  textQuestion,
} from "../workflowSupport";

const writtenOfferRisk = risk("no-written-offer", "No written offer", "Resigning without a verified written offer creates avoidable execution risk.", "critical", "Do not resign until material terms are documented and verified.");
const runwayRisk = risk("career-runway", "Thin transition runway", "Limited emergency coverage makes a failed or delayed transition harder to absorb.", "high", "Build additional runway or reduce transition uncertainty first.");
const companyRisk = risk("company-stability", "Company stability is uncertain", "The prospective employer or role may have material stability risk.", "high", "Verify runway, business quality, team history, and probation terms.");
const roleRisk = risk("role-mismatch", "Weak role fit", "The work may not align with the stated career direction.", "medium", "Clarify responsibilities, manager expectations, and success measures.");
const careerScenarioVariables = [
  { id: "career-salary", questionId: "offeredSalary", label: "Salary increase", relativeTo: "currentSalary", chips: [10, 20, 35] },
  { id: "career-commute", questionId: "commuteMinutes", label: "Commute time", chips: [20, 45, 75] },
  { id: "career-stability", questionId: "companyStability", label: "Job stability", chips: [1, 2, 3] },
  { id: "career-runway", questionId: "emergencyMonths", label: "Emergency fund months", chips: [3, 6, 12] },
] as const;

export const jobSwitchWorkflow: DecisionWorkflow = {
  id: "job-switch", slug: "job-switch", pluginId: "career", version: "1.0.0",
  title: "Should I switch jobs?", category: "career",
  description: "Compare compensation, role fit, career growth, company stability, written terms, and transition runway.",
  aliases: ["change jobs", "accept job offer", "leave my current job"],
  intent: { keywords: ["job", "switch", "career", "offer", "salary", "role", "resign"], aliases: ["switch jobs", "accept a job offer", "leave my job"], examples: ["Should I switch jobs for this offer?"] },
  questions: [
    currencyQuestion("currentSalary", "Current annual gross compensation", 1_200_000, "Use comparable fixed and realistic variable pay."),
    currencyQuestion("offeredSalary", "Offered annual gross compensation", 1_500_000, "Use the written offer amount."),
    booleanQuestion("hasOffer", "Do you have a written offer?", true, "A written offer materially reduces execution risk."),
    numberQuestion("emergencyMonths", "Emergency-fund coverage", 6, 0, 36, "Months of essential expenses available during transition."),
    numberQuestion("commuteMinutes", "Expected commute time", 45, 0, 180, "Average one-way commute in minutes."),
    selectQuestion("growthPotential", "Growth potential in the new role", 2, [["Lower", 1], ["Similar", 2], ["Much better", 3]], "Consider learning, scope, mentorship, and future options."),
    sliderQuestion("roleFit", "Fit with your career direction", 3, 1, 5, "1 means weak fit; 5 means excellent fit."),
    selectQuestion("companyStability", "Prospective company stability", 2, [["Uncertain", 1], ["Reasonable", 2], ["Strong", 3]], "Assess business quality, funding, customers, and team stability."),
    numberQuestion("noticeRisk", "Months of transition uncertainty", 0, 0, 12, "Include gaps, probation, or delayed joining risk."),
    textQuestion("roleNotes", "What matters beyond compensation?", "Optional notes about manager, culture, flexibility, or mission."),
  ],
  deriveFacts: (answers) => {
    const currentSalary = numberAnswer(answers, "currentSalary");
    const offeredSalary = numberAnswer(answers, "offeredSalary");
    const currentTakeHome = calculatorValue("salary-in-hand-calculator", { gross: currentSalary, basicPercent: 40, employeePf: 12, otherDeductions: 0 });
    const offeredTakeHome = calculatorValue("salary-in-hand-calculator", { gross: offeredSalary, basicPercent: 40, employeePf: 12, otherDeductions: 0 });
    return { salaryIncrease: ratio(offeredSalary - currentSalary, currentSalary), takeHomeIncrease: ratio(offeredTakeHome - currentTakeHome, currentTakeHome), currentTakeHome, offeredTakeHome, hasOffer: booleanAnswer(answers, "hasOffer"), emergencyMonths: numberAnswer(answers, "emergencyMonths"), commuteMinutes: numberAnswer(answers, "commuteMinutes"), growthPotential: numberAnswer(answers, "growthPotential"), roleFit: numberAnswer(answers, "roleFit"), companyStability: numberAnswer(answers, "companyStability"), noticeRisk: numberAnswer(answers, "noticeRisk") };
  },
  weights: [{ factorId: "compensation", label: "Compensation", weight: 25, baselineScore: 50 }, { factorId: "growth", label: "Career growth", weight: 25, baselineScore: 50 }, { factorId: "fit", label: "Role fit", weight: 20, baselineScore: 50 }, { factorId: "stability", label: "Stability", weight: 15, baselineScore: 50 }, { factorId: "runway", label: "Financial runway", weight: 15, baselineScore: 50 }],
  rules: [
    { id: "job-raise", description: "The offer improves gross compensation by at least 15%.", when: { all: [{ fact: "salaryIncrease", operator: "greater-than-or-equal", value: 0.15 }] }, factorId: "compensation", scoreEffect: { operation: "add", value: 25 } },
    { id: "job-pay-cut", description: "The offer reduces gross compensation.", when: { all: [{ fact: "salaryIncrease", operator: "less-than", value: 0 }] }, factorId: "compensation", scoreEffect: { operation: "subtract", value: 25 } },
    { id: "job-growth", description: "The new role offers materially better growth.", when: { all: [{ fact: "growthPotential", operator: "equals", value: 3 }] }, factorId: "growth", scoreEffect: { operation: "add", value: 25 } },
    { id: "job-fit", description: "The role strongly fits the stated direction.", when: { all: [{ fact: "roleFit", operator: "greater-than-or-equal", value: 4 }] }, factorId: "fit", scoreEffect: { operation: "add", value: 25 } },
    { id: "job-fit-low", description: "Role fit is weak.", when: { all: [{ fact: "roleFit", operator: "less-than-or-equal", value: 2 }] }, factorId: "fit", scoreEffect: { operation: "subtract", value: 30 }, risk: roleRisk },
    { id: "job-commute-short", description: "A short commute supports the move.", when: { all: [{ fact: "commuteMinutes", operator: "less-than-or-equal", value: 30 }] }, factorId: "fit", scoreEffect: { operation: "add", value: 10 } },
    { id: "job-commute-long", description: "A long commute weakens the practical fit.", when: { all: [{ fact: "commuteMinutes", operator: "greater-than", value: 60 }] }, factorId: "fit", scoreEffect: { operation: "subtract", value: 15 } },
    { id: "job-no-offer", description: "There is no written offer.", when: { all: [{ fact: "hasOffer", operator: "equals", value: false }] }, factorId: "stability", scoreEffect: { operation: "subtract", value: 45 }, risk: writtenOfferRisk },
    { id: "job-unstable", description: "Company stability is uncertain.", when: { all: [{ fact: "companyStability", operator: "equals", value: 1 }] }, factorId: "stability", scoreEffect: { operation: "subtract", value: 35 }, risk: companyRisk },
    { id: "job-runway-low", description: "Transition runway is below four months.", when: { all: [{ fact: "emergencyMonths", operator: "less-than", value: 4 }] }, factorId: "runway", scoreEffect: { operation: "subtract", value: 35 }, risk: runwayRisk },
    { id: "job-runway-good", description: "Transition runway is at least six months.", when: { all: [{ fact: "emergencyMonths", operator: "greater-than-or-equal", value: 6 }] }, factorId: "runway", scoreEffect: { operation: "add", value: 20 } },
  ],
  riskFactors: [writtenOfferRisk, runwayRisk, companyRisk, roleRisk],
  recommendations: [
    { id: "stay", minScore: 0, maxScore: 39.99, title: "Stay for now", summary: "The offer or transition has material gaps that should be resolved before resigning.", actions: ["Do not resign yet", "Clarify the weakest offer terms"] },
    { id: "diligence", minScore: 40, maxScore: 64.99, title: "Continue diligence before deciding", summary: "The move has promise but remains sensitive to role, stability, or runway assumptions.", actions: ["Speak with the future manager", "Verify written role and probation terms"] },
    { id: "switch", minScore: 65, maxScore: 100, title: "The job switch is supported", summary: "Compensation, growth, fit, stability, and runway are supportive under the current inputs.", actions: ["Verify the final written offer", "Plan notice and transition carefully"] },
  ],
  actionPlanTemplates: [
    { id: "stay-plan", minScore: 0, maxScore: 39.99, actions: ["Keep the current role while resolving gaps", "Request complete written terms", "Build financial runway", "Reassess after diligence"] },
    { id: "diligence-plan", minScore: 40, maxScore: 64.99, actions: ["Validate manager and team expectations", "Compare take-home estimates and benefits", "Check probation and notice clauses", "Set a final decision date"] },
    { id: "switch-plan", minScore: 65, maxScore: 100, actions: ["Accept only the verified written offer", "Confirm start date before resigning", "Prepare a notice and handover plan", "Review the move after 90 days"] },
  ],
  relatedCalculators: ["salary-in-hand-calculator", "emergency-fund-calculator", "percentage-calculator"], relatedTools: ["word-counter", "text-diff"],
  assumptions: ["Take-home comparisons use the existing salary calculator with common planning defaults.", "Benefits, equity, bonuses, taxes, and payroll structures require offer-specific review.", "Qualitative inputs reflect the user's evidence and judgement."],
  faqs: [{ question: "Can a lower-paying move still be right?", answer: "Yes. Strong fit and growth can justify a pay cut when the financial runway and risks are acceptable." }, { question: "Should I resign on a verbal offer?", answer: "No. The workflow treats the absence of a written offer as a critical risk." }],
  scenarios: [
    { id: "job-raise", label: "Salary bump", description: "Test the impact of a stronger offer.", overrides: { offeredSalary: 1_700_000, growthPotential: 3 } },
    { id: "job-commute", label: "Long commute", description: "See whether the move still works with a tougher commute.", overrides: { commuteMinutes: 75, roleFit: 3 } },
    { id: "job-runway", label: "Thin runway", description: "Stress-test the move with lower savings.", overrides: { emergencyMonths: 3, companyStability: 1 } },
  ],
  scenarioVariables: careerScenarioVariables,
  scoreBands: standardScoreBands,
};

export const careerDecisionWorkflows = [jobSwitchWorkflow];
