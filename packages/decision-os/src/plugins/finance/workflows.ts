import type { DecisionAnswers, DecisionWorkflow } from "../../types";
import {
  actionPlanTemplates,
  booleanAnswer,
  booleanQuestion,
  calculatorValue,
  currencyQuestion,
  durationQuestion,
  numberAnswer,
  numberQuestion,
  percentageQuestion,
  ratio,
  recommendationTemplates,
  risk,
  selectQuestion,
  sliderQuestion,
  standardScoreBands,
  textQuestion,
} from "../workflowSupport";

const fdShortHorizonRisk = risk("fd-short-horizon", "Short investment horizon", "A fixed deposit usually fits short-term goals better than a market-linked approach.", "medium", "Use capital-stable money for near-term needs.");
const sipShortHorizonRisk = risk("sip-short-horizon", "Short investment horizon", "Market-linked returns may be unsuitable for money needed soon.", "high", "Use a capital-stable allocation for near-term needs.");
const sipLiquidityRisk = risk("liquidity-gap", "Emergency-fund gap", "Investing without an adequate liquid buffer can force an early withdrawal.", "high", "Build accessible emergency savings first.");
const sipVolatilityRisk = risk("volatility-mismatch", "Volatility mismatch", "Low tolerance for market falls weakens the fit of an equity-oriented SIP.", "medium", "Reduce market exposure or use a blended allocation.");
const fdInflationRisk = risk("fd-inflation", "Long-term inflation drag", "Fixed returns can lose real value over long periods if inflation runs ahead.", "high", "Use FD only for capital that is not meant for long-term growth.");
const fdTaxRisk = risk("fd-tax", "Tax drag", "Interest income can be less tax efficient at higher brackets.", "medium", "Compare the post-tax outcome with other suitable choices.");
const noEmergencyRisk = risk("no-emergency-fund", "No emergency buffer", "Investing without an emergency fund increases the chance of forced withdrawals or missed goals.", "high", "Build a liquid emergency fund before committing long-term money.");

function goalTypeLabel(answers: Readonly<DecisionAnswers>): string {
  if (typeof answers.goalType !== "string" || !answers.goalType) return "long-term growth";
  return answers.goalType.replace(/_/gu, " ");
}

const fdScenarioVariables = [
  { id: "fd-investment", questionId: "investmentAmount", label: "Investment amount", chips: [50_000, 250_000, 500_000] },
  { id: "fd-horizon", questionId: "timeHorizon", label: "Time horizon", chips: [1, 3, 5, 10] },
  { id: "fd-return", questionId: "returnExpectation", label: "Expected return", chips: [6, 8, 10, 12] },
  { id: "fd-risk", questionId: "riskAppetite", label: "Risk appetite", chips: [1, 2, 3] },
  { id: "fd-liquidity", questionId: "liquidityNeed", label: "Liquidity need", chips: [1, 2, 3] },
] as const;

function fdScoreForReturnPotential(answers: Readonly<DecisionAnswers>): number {
  const horizon = numberAnswer(answers, "timeHorizon");
  const expectedReturn = numberAnswer(answers, "returnExpectation");
  const liquidityNeed = numberAnswer(answers, "liquidityNeed");
  return 90 - (horizon * 8) - Math.max(0, expectedReturn - 7) * 6 + liquidityNeed * 4;
}

function sipScoreForReturnPotential(answers: Readonly<DecisionAnswers>): number {
  const horizon = numberAnswer(answers, "timeHorizon");
  const expectedReturn = numberAnswer(answers, "returnExpectation");
  const liquidityNeed = numberAnswer(answers, "liquidityNeed");
  return 35 + (horizon * 7) + Math.max(0, expectedReturn - 7) * 10 - liquidityNeed * 4;
}

function fdScoreForCapitalSafety(answers: Readonly<DecisionAnswers>): number {
  const riskAppetite = numberAnswer(answers, "riskAppetite");
  const emergencyReady = booleanAnswer(answers, "emergencyFundStatus");
  return 96 - (riskAppetite * 16) - (emergencyReady ? 0 : 15);
}

function sipScoreForCapitalSafety(answers: Readonly<DecisionAnswers>): number {
  const horizon = numberAnswer(answers, "timeHorizon");
  const emergencyReady = booleanAnswer(answers, "emergencyFundStatus");
  const riskAppetite = numberAnswer(answers, "riskAppetite");
  return 38 + (horizon * 2) + (emergencyReady ? 15 : 0) + (riskAppetite >= 3 ? 10 : 0);
}

function fdScoreForLiquidity(answers: Readonly<DecisionAnswers>): number {
  const liquidityNeed = numberAnswer(answers, "liquidityNeed");
  const horizon = numberAnswer(answers, "timeHorizon");
  return 92 - (liquidityNeed * 18) - (horizon * 2);
}

function sipScoreForLiquidity(answers: Readonly<DecisionAnswers>): number {
  const liquidityNeed = numberAnswer(answers, "liquidityNeed");
  const horizon = numberAnswer(answers, "timeHorizon");
  return 52 - (liquidityNeed * 12) + (horizon * 2);
}

function fdScoreForTaxEfficiency(answers: Readonly<DecisionAnswers>): number {
  const taxBracket = numberAnswer(answers, "taxBracket");
  return 88 - (taxBracket * 14);
}

function sipScoreForTaxEfficiency(answers: Readonly<DecisionAnswers>): number {
  const taxBracket = numberAnswer(answers, "taxBracket");
  const horizon = numberAnswer(answers, "timeHorizon");
  return 52 + (taxBracket * 9) + Math.min(horizon * 2, 20);
}

function fdScoreForGoalFit(answers: Readonly<DecisionAnswers>): number {
  const goalType = goalTypeLabel(answers);
  const shortTerm = goalType.includes("short") || goalType.includes("parking") || goalType.includes("emergency");
  const longTerm = goalType.includes("growth") || goalType.includes("retirement");
  return shortTerm ? 95 : longTerm ? 42 : 70;
}

function sipScoreForGoalFit(answers: Readonly<DecisionAnswers>): number {
  const goalType = goalTypeLabel(answers);
  const shortTerm = goalType.includes("short") || goalType.includes("parking") || goalType.includes("emergency");
  const longTerm = goalType.includes("growth") || goalType.includes("retirement");
  return longTerm ? 94 : shortTerm ? 36 : 68;
}

function fdScoreForInflationProtection(answers: Readonly<DecisionAnswers>): number {
  const horizon = numberAnswer(answers, "timeHorizon");
  const expectedReturn = numberAnswer(answers, "returnExpectation");
  return 78 - (horizon * 6) - Math.max(0, expectedReturn - 7) * 4;
}

function sipScoreForInflationProtection(answers: Readonly<DecisionAnswers>): number {
  const horizon = numberAnswer(answers, "timeHorizon");
  const expectedReturn = numberAnswer(answers, "returnExpectation");
  return 44 + (horizon * 6) + Math.max(0, expectedReturn - 7) * 8;
}

function fdScoreForRiskComfort(answers: Readonly<DecisionAnswers>): number {
  const riskAppetite = numberAnswer(answers, "riskAppetite");
  const volatilityComfort = numberAnswer(answers, "volatilityComfort");
  return 96 - (riskAppetite * 18) - (volatilityComfort * 6);
}

function sipScoreForRiskComfort(answers: Readonly<DecisionAnswers>): number {
  const riskAppetite = numberAnswer(answers, "riskAppetite");
  const volatilityComfort = numberAnswer(answers, "volatilityComfort");
  return 34 + (riskAppetite * 22) + (volatilityComfort * 8);
}

export const sipVsFdWorkflow: DecisionWorkflow = {
  id: "fd-vs-sip",
  slug: "fd-vs-sip",
  pluginId: "finance",
  version: "1.1.0",
  title: "FD vs SIP",
  category: "investment",
  description: "Compare Fixed Deposit and SIP / Mutual Fund choices using horizon, risk appetite, liquidity, tax bracket, goal fit, and inflation protection.",
  aliases: ["sip-vs-fd", "sip vs fd", "fd vs sip", "fixed deposit or sip", "mutual fund or fixed deposit"],
  intent: {
    keywords: ["fd", "fixed", "deposit", "sip", "mutual", "fund", "invest", "growth", "savings"],
    aliases: ["sip-vs-fd", "sip vs fd", "fd vs sip", "should I choose fd or sip"],
    examples: ["Should I invest in FD or SIP?", "FD vs SIP for my goal"],
  },
  questions: [
    currencyQuestion("investmentAmount", "How much money are you allocating?", 200_000, "Use the amount you are actually deciding on."),
    durationQuestion("timeHorizon", "How long will this money stay invested?", 5, 1, 30, "A near-term goal usually changes the answer."),
    selectQuestion("riskAppetite", "What is your risk appetite?", 2, [[ "Low", 1 ], [ "Moderate", 2 ], [ "High", 3 ]], "Use the option that reflects how you react to losses."),
    selectQuestion("liquidityNeed", "How important is liquidity?", 2, [[ "Low", 1 ], [ "Medium", 2 ], [ "High", 3 ]], "High liquidity need means you may need access to the money sooner."),
    booleanQuestion("emergencyFundStatus", "Do you already have an emergency fund?", true, "A separate cash buffer improves decision quality."),
    selectQuestion("taxBracket", "Which tax bracket do you fall into?", 2, [[ "Low / nil", 1 ], [ "Moderate", 2 ], [ "High", 3 ], [ "Very high", 4 ]], "Use your effective marginal bracket."),
    selectQuestion("goalType", "What is the goal type?", "growth", [[ "Short-term goal", "short_term" ], [ "Capital preservation", "capital_preservation" ], [ "Long-term growth", "growth" ], [ "Retirement or future wealth", "retirement" ]], "Choose the goal that best matches the money."),
    percentageQuestion("returnExpectation", "What annual return do you expect?", 9, "Use a cautious planning assumption."),
    sliderQuestion("volatilityComfort", "How comfortable are you with market volatility?", 3, 1, 5, "1 means uncomfortable; 5 means very comfortable."),
  ],
  deriveFacts: (answers) => {
    const investmentAmount = numberAnswer(answers, "investmentAmount");
    const timeHorizon = numberAnswer(answers, "timeHorizon");
    const returnExpectation = numberAnswer(answers, "returnExpectation");
    const liquidityNeed = numberAnswer(answers, "liquidityNeed");
    const emergencyFundStatus = booleanAnswer(answers, "emergencyFundStatus");
    const taxBracket = numberAnswer(answers, "taxBracket");
    const riskAppetite = numberAnswer(answers, "riskAppetite");
    const volatilityComfort = numberAnswer(answers, "volatilityComfort");
    const goalType = typeof answers.goalType === "string" ? answers.goalType : "growth";
    return {
      investmentAmount,
      timeHorizon,
      returnExpectation,
      liquidityNeed,
      emergencyFundStatus,
      taxBracket,
      riskAppetite,
      volatilityComfort,
      goalType,
      fdBenchmarkReturn: 7,
      inflationAssumption: 6,
      realGrowthMargin: returnExpectation - 6,
      sipProjectedValue: calculatorValue("sip-calculator", { monthly: investmentAmount, rate: returnExpectation, years: timeHorizon }),
      fdProjectedValue: calculatorValue("fd-calculator", { principal: investmentAmount, rate: 7, years: timeHorizon }),
      goalTypeShortTerm: goalType === "short_term",
      goalTypeGrowth: goalType === "growth" || goalType === "retirement",
    };
  },
  weights: [
    { factorId: "returnPotential", label: "Return potential", weight: 18, baselineScore: 50 },
    { factorId: "capitalSafety", label: "Capital safety", weight: 18, baselineScore: 50 },
    { factorId: "liquidity", label: "Liquidity", weight: 14, baselineScore: 50 },
    { factorId: "taxEfficiency", label: "Tax efficiency", weight: 12, baselineScore: 50 },
    { factorId: "goalFit", label: "Goal fit", weight: 18, baselineScore: 50 },
    { factorId: "inflationProtection", label: "Inflation protection", weight: 10, baselineScore: 50 },
    { factorId: "riskComfort", label: "Risk comfort", weight: 10, baselineScore: 50 },
  ],
  rules: [
    { id: "fd-short-term-fit", description: "Short-term goals favour a fixed deposit.", when: { all: [{ fact: "timeHorizon", operator: "less-than-or-equal", value: 3 }] }, factorId: "goalFit", scoreEffect: { operation: "subtract", value: 24 } },
    { id: "fd-liquidity-fit", description: "Higher liquidity needs favour a fixed deposit.", when: { all: [{ fact: "liquidityNeed", operator: "greater-than-or-equal", value: 3 }] }, factorId: "liquidity", scoreEffect: { operation: "subtract", value: 20 } },
    { id: "fd-low-risk-fit", description: "Low risk appetite favours capital stability.", when: { all: [{ fact: "riskAppetite", operator: "less-than-or-equal", value: 2 }] }, factorId: "capitalSafety", scoreEffect: { operation: "subtract", value: 22 } },
    { id: "fd-tax-drag", description: "Higher tax brackets make SIPs relatively more attractive.", when: { all: [{ fact: "taxBracket", operator: "greater-than-or-equal", value: 3 }] }, factorId: "taxEfficiency", scoreEffect: { operation: "add", value: 18 }, risk: fdTaxRisk },
    { id: "fd-long-term-inflation-risk", description: "Long horizons weaken FD inflation-adjusted growth.", when: { all: [{ fact: "timeHorizon", operator: "greater-than-or-equal", value: 7 }] }, factorId: "inflationProtection", scoreEffect: { operation: "add", value: 26 }, risk: fdInflationRisk },
    { id: "sip-long-horizon", description: "Long horizons support market-linked growth.", when: { all: [{ fact: "timeHorizon", operator: "greater-than-or-equal", value: 7 }] }, factorId: "returnPotential", scoreEffect: { operation: "add", value: 28 } },
    { id: "sip-growth-goal", description: "Long-term growth goals fit SIPs well.", when: { any: [{ fact: "goalType", operator: "equals", value: "growth" }, { fact: "goalType", operator: "equals", value: "retirement" }] }, factorId: "goalFit", scoreEffect: { operation: "add", value: 24 } },
    { id: "sip-high-risk-appetite", description: "Higher risk appetite supports SIP exposure.", when: { all: [{ fact: "riskAppetite", operator: "greater-than-or-equal", value: 3 }] }, factorId: "riskComfort", scoreEffect: { operation: "add", value: 22 } },
    { id: "sip-short-horizon-penalty", description: "Short horizons weaken the SIP case.", when: { all: [{ fact: "timeHorizon", operator: "less-than", value: 3 }] }, factorId: "returnPotential", scoreEffect: { operation: "subtract", value: 30 }, risk: sipShortHorizonRisk },
    { id: "sip-low-risk-penalty", description: "Low risk appetite weakens the SIP case.", when: { all: [{ fact: "riskAppetite", operator: "less-than-or-equal", value: 2 }] }, factorId: "riskComfort", scoreEffect: { operation: "subtract", value: 26 }, risk: sipVolatilityRisk },
    { id: "sip-no-buffer", description: "No emergency fund weakens both choices.", when: { all: [{ fact: "emergencyFundStatus", operator: "equals", value: false }] }, factorId: "capitalSafety", scoreEffect: { operation: "subtract", value: 24 }, risk: noEmergencyRisk },
    { id: "sip-no-buffer-liquidity", description: "Without an emergency buffer, liquidity is more important.", when: { all: [{ fact: "emergencyFundStatus", operator: "equals", value: false }] }, factorId: "liquidity", scoreEffect: { operation: "subtract", value: 16 }, risk: noEmergencyRisk },
    { id: "sip-tax-efficiency", description: "Higher tax brackets can make SIPs relatively more efficient.", when: { all: [{ fact: "taxBracket", operator: "greater-than-or-equal", value: 3 }] }, factorId: "taxEfficiency", scoreEffect: { operation: "add", value: 20 } },
    { id: "sip-inflation-hedge", description: "Long-term growth can better protect purchasing power.", when: { all: [{ fact: "timeHorizon", operator: "greater-than-or-equal", value: 5 }] }, factorId: "inflationProtection", scoreEffect: { operation: "add", value: 22 } },
    { id: "sip-goal-short-term", description: "Short-term goals do not suit market volatility.", when: { all: [{ fact: "goalType", operator: "equals", value: "short_term" }] }, factorId: "goalFit", scoreEffect: { operation: "subtract", value: 24 }, risk: fdShortHorizonRisk },
  ],
  riskFactors: [fdShortHorizonRisk, sipShortHorizonRisk, sipLiquidityRisk, sipVolatilityRisk, fdInflationRisk, fdTaxRisk, noEmergencyRisk],
  recommendations: [
    { id: "fd-preferred", minScore: 0, maxScore: 39.99, title: "Fixed Deposit is the stronger fit", summary: "The current horizon, liquidity need, and risk profile favour capital stability over market-linked growth.", actions: ["Choose an FD tenure that matches the goal date", "Compare post-tax returns and premature withdrawal terms", "Keep the emergency fund separate"] },
    { id: "balanced", minScore: 40, maxScore: 64.99, title: "A balanced FD and SIP mix makes sense", summary: "The inputs are close enough that a split allocation can protect near-term needs while still seeking growth.", actions: ["Assign near-term money to FD", "Use SIP only for the long-term portion", "Review the split again after your buffer is stronger"] },
    { id: "sip-preferred", minScore: 65, maxScore: 100, title: "SIP / Mutual Fund is the stronger fit", summary: "The horizon, growth goal, and risk comfort support a market-linked approach under the stated assumptions.", actions: ["Choose a diversified SIP suited to the goal", "Automate monthly investing", "Review the plan after major life changes"] },
  ],
  scenarios: [
    { id: "sip-longer-horizon", label: "Longer horizon", description: "See how a longer horizon changes the result.", overrides: { timeHorizon: 10 } },
    { id: "sip-higher-return", label: "Higher expected return", description: "Stress-test the result with stronger return expectations.", overrides: { returnExpectation: 12 } },
    { id: "sip-safer", label: "Safer setup", description: "See how stronger safety inputs affect the case.", overrides: { riskAppetite: 1, liquidityNeed: 3, emergencyFundStatus: true } },
  ],
  scenarioVariables: fdScenarioVariables,
  scoring: {
    options: [
      {
        id: "fixed-deposit",
        label: "Fixed Deposit",
        factors: [
          { id: "returnPotential", label: "Return potential", weight: 18, direction: "higher_better", evaluate: (answers) => fdScoreForReturnPotential(answers), explanation: "How well FD meets the expected return need" },
          { id: "capitalSafety", label: "Capital safety", weight: 18, direction: "higher_better", evaluate: (answers) => fdScoreForCapitalSafety(answers), explanation: "How stable the capital is for this goal" },
          { id: "liquidity", label: "Liquidity", weight: 14, direction: "higher_better", evaluate: (answers) => fdScoreForLiquidity(answers), explanation: "How well FD serves the liquidity need" },
          { id: "taxEfficiency", label: "Tax efficiency", weight: 12, direction: "higher_better", evaluate: (answers) => fdScoreForTaxEfficiency(answers), explanation: "How tax drag affects FD suitability" },
          { id: "goalFit", label: "Goal fit", weight: 18, direction: "higher_better", evaluate: (answers) => fdScoreForGoalFit(answers), explanation: "How well the goal matches an FD" },
          { id: "inflationProtection", label: "Inflation protection", weight: 10, direction: "higher_better", evaluate: (answers) => fdScoreForInflationProtection(answers), explanation: "How well FD protects purchasing power" },
          { id: "riskComfort", label: "Risk comfort", weight: 10, direction: "higher_better", evaluate: (answers) => fdScoreForRiskComfort(answers), explanation: "How comfortable the option is for this risk profile" },
        ],
      },
      {
        id: "sip-mutual-fund",
        label: "SIP / Mutual Fund",
        factors: [
          { id: "returnPotential", label: "Return potential", weight: 18, direction: "higher_better", evaluate: (answers) => sipScoreForReturnPotential(answers), explanation: "How well SIPs meet longer-term growth needs" },
          { id: "capitalSafety", label: "Capital safety", weight: 18, direction: "higher_better", evaluate: (answers) => sipScoreForCapitalSafety(answers), explanation: "How much stability the option offers for this situation" },
          { id: "liquidity", label: "Liquidity", weight: 14, direction: "higher_better", evaluate: (answers) => sipScoreForLiquidity(answers), explanation: "How well SIPs fit the liquidity need" },
          { id: "taxEfficiency", label: "Tax efficiency", weight: 12, direction: "higher_better", evaluate: (answers) => sipScoreForTaxEfficiency(answers), explanation: "How tax treatment affects SIP suitability" },
          { id: "goalFit", label: "Goal fit", weight: 18, direction: "higher_better", evaluate: (answers) => sipScoreForGoalFit(answers), explanation: "How well SIPs fit the goal type" },
          { id: "inflationProtection", label: "Inflation protection", weight: 10, direction: "higher_better", evaluate: (answers) => sipScoreForInflationProtection(answers), explanation: "How well SIPs protect long-term purchasing power" },
          { id: "riskComfort", label: "Risk comfort", weight: 10, direction: "higher_better", evaluate: (answers) => sipScoreForRiskComfort(answers), explanation: "How well the option fits the user’s volatility comfort" },
        ],
      },
    ],
  },
  actionPlanTemplates: [
    { id: "fd-plan", minScore: 0, maxScore: 39.99, actions: ["Keep the money in a capital-stable FD", "Match the tenure to the goal date", "Check post-tax maturity value", "Keep your emergency fund separate"] },
    { id: "balanced-plan", minScore: 40, maxScore: 64.99, actions: ["Use FD for the near-term portion", "Start a SIP only for the longer-term portion", "Revisit the allocation when your buffer improves", "Document the assumptions you may want to revisit"] },
    { id: "sip-plan", minScore: 65, maxScore: 100, actions: ["Build or preserve the emergency fund first", "Choose a diversified SIP aligned to the goal", "Automate the investment", "Review the plan after major life changes"] },
  ],
  relatedCalculators: ["sip-calculator", "fd-calculator", "inflation-calculator"],
  relatedTools: ["percentage-calculator", "word-counter"],
  assumptions: ["SIP returns are scenario-based and not guaranteed.", "FD rates are treated as fixed only for the stated term.", "This is educational decision support, not financial advice.", "Taxes, fees, and product-specific restrictions are not fully modelled."],
  faqs: [{ question: "Is this financial advice?", answer: "No. This is educational decision support, not financial advice." }, { question: "Can I split money between FD and SIP?", answer: "Yes. A balanced allocation is often more realistic when goals have different horizons." }],
  scoreBands: standardScoreBands,
};

const fundGapRisk = risk("fund-gap", "Insufficient emergency coverage", "Current liquid savings cover too few months of essentials.", "high", "Build the buffer before taking avoidable financial risk.");
const incomeRisk = risk("income-instability", "Income uncertainty", "Variable or concentrated income increases the required buffer.", "high", "Use a larger target and diversify income where practical.");
const insuranceRisk = risk("insurance-gap", "Protection gap", "A major health event could overwhelm the cash buffer.", "medium", "Review suitable insurance protection separately.");

export const emergencyFundWorkflow: DecisionWorkflow = {
  id: "emergency-fund", slug: "emergency-fund", pluginId: "finance", version: "1.0.0",
  title: "How much emergency fund do I need?", category: "financial-safety",
  description: "Set a cash-buffer target using expenses, current savings, dependants, income stability, and protection.",
  aliases: ["emergency savings", "rainy day fund", "cash buffer"],
  intent: { keywords: ["emergency", "fund", "savings", "buffer", "rainy"], aliases: ["emergency fund", "cash buffer"], examples: ["How much emergency savings do I need?"] },
  questions: [
    currencyQuestion("monthlyExpenses", "Essential monthly expenses", 50_000, "Include housing, food, utilities, insurance, and required debt payments."),
    currencyQuestion("currentFund", "Current emergency savings", 200_000, "Count accessible, low-risk money only."),
    numberQuestion("dependants", "Financial dependants", 2, 0, 12, "People relying materially on this income."),
    selectQuestion("incomeStability", "Income stability", 2, [["Variable or uncertain", 1], ["Reasonably stable", 2], ["Very stable", 3]], "Variable income usually needs more coverage."),
    booleanQuestion("singleIncome", "Is this a single-income household?", true, "Income concentration increases resilience needs."),
    booleanQuestion("adequateInsurance", "Do you have adequate health insurance?", true, "Insurance reduces—but does not remove—cash-shock risk."),
    textQuestion("riskNotes", "Known upcoming risks", "Optional notes about job, health, or family risks."),
  ],
  deriveFacts: (answers) => {
    const expenses = numberAnswer(answers, "monthlyExpenses");
    const stability = numberAnswer(answers, "incomeStability");
    const targetMonths = Math.min(12, 6 + (stability === 1 ? 3 : 0) + (booleanAnswer(answers, "singleIncome") ? 1 : 0) + (numberAnswer(answers, "dependants") >= 3 ? 1 : 0));
    const targetFund = calculatorValue("emergency-fund-calculator", { expense: expenses, months: targetMonths });
    const currentFund = numberAnswer(answers, "currentFund");
    return { emergencyMonths: ratio(currentFund, expenses), targetMonths, targetFund, fundingGap: Math.max(0, targetFund - currentFund), incomeStability: stability, singleIncome: booleanAnswer(answers, "singleIncome"), adequateInsurance: booleanAnswer(answers, "adequateInsurance"), dependants: numberAnswer(answers, "dependants") };
  },
  weights: [{ factorId: "coverage", label: "Current coverage", weight: 45, baselineScore: 50 }, { factorId: "stability", label: "Income stability", weight: 25, baselineScore: 50 }, { factorId: "responsibility", label: "Household responsibility", weight: 15, baselineScore: 50 }, { factorId: "protection", label: "Insurance protection", weight: 15, baselineScore: 50 }],
  rules: [
    { id: "fund-six-months", description: "At least six months are covered.", when: { all: [{ fact: "emergencyMonths", operator: "greater-than-or-equal", value: 6 }] }, factorId: "coverage", scoreEffect: { operation: "add", value: 30 } },
    { id: "fund-under-three", description: "Less than three months are covered.", when: { all: [{ fact: "emergencyMonths", operator: "less-than", value: 3 }] }, factorId: "coverage", scoreEffect: { operation: "subtract", value: 40 }, risk: fundGapRisk },
    { id: "fund-variable-income", description: "Variable income requires a larger buffer.", when: { all: [{ fact: "incomeStability", operator: "equals", value: 1 }] }, factorId: "stability", scoreEffect: { operation: "subtract", value: 30 }, risk: incomeRisk },
    { id: "fund-stable-income", description: "Stable income supports the base target.", when: { all: [{ fact: "incomeStability", operator: "equals", value: 3 }] }, factorId: "stability", scoreEffect: { operation: "add", value: 20 } },
    { id: "fund-single-income", description: "A single income source increases responsibility.", when: { all: [{ fact: "singleIncome", operator: "equals", value: true }] }, factorId: "responsibility", scoreEffect: { operation: "subtract", value: 18 } },
    { id: "fund-insurance-gap", description: "Insurance protection is inadequate.", when: { all: [{ fact: "adequateInsurance", operator: "equals", value: false }] }, factorId: "protection", scoreEffect: { operation: "subtract", value: 28 }, risk: insuranceRisk },
    { id: "fund-insured", description: "Health insurance reduces major shock exposure.", when: { all: [{ fact: "adequateInsurance", operator: "equals", value: true }] }, factorId: "protection", scoreEffect: { operation: "add", value: 15 } },
  ],
  riskFactors: [fundGapRisk, incomeRisk, insuranceRisk],
  recommendations: recommendationTemplates("complete your emergency fund"),
  actionPlanTemplates: actionPlanTemplates("building the emergency fund"),
  relatedCalculators: ["emergency-fund-calculator", "net-worth-calculator"], relatedTools: ["percentage-calculator"],
  assumptions: ["Only accessible, low-risk savings count toward the fund.", "The target is a planning range, not a universal rule.", "Insurance and emergency savings solve different risks."],
  faqs: [{ question: "Where should I keep an emergency fund?", answer: "Prioritise accessibility and capital stability using suitable liquid accounts or low-risk instruments." }, { question: "Is six months always enough?", answer: "No. Variable income, dependants, or concentrated household income can justify a larger target." }],
  scoreBands: standardScoreBands,
};

const prepayLiquidityRisk = risk("prepay-liquidity", "Liquidity would become too thin", "Extra repayment may leave too little accessible cash.", "high", "Preserve a suitable emergency buffer before prepaying.");
const prepayPenaltyRisk = risk("prepay-penalty", "Prepayment charge", "A lender charge can reduce the benefit of early repayment.", "medium", "Obtain the exact charge and updated amortisation schedule.");

export const loanPrepaymentWorkflow: DecisionWorkflow = {
  id: "loan-prepayment", slug: "loan-prepayment", pluginId: "finance", version: "1.0.0",
  title: "Should I prepay my loan?", category: "debt",
  description: "Compare calculator-estimated interest savings with liquidity, remaining tenure, charges, and alternative returns.",
  aliases: ["pay loan early", "extra EMI", "prepay debt"],
  intent: { keywords: ["loan", "prepay", "debt", "early", "emi", "interest"], aliases: ["prepay my loan", "pay loan early"], examples: ["Should I make extra loan payments?"] },
  questions: [
    currencyQuestion("loanBalance", "Outstanding loan balance", 2_000_000, "Current principal outstanding."),
    percentageQuestion("interestRate", "Annual loan interest rate", 9, "Use the current lender rate.", 50),
    durationQuestion("remainingYears", "Remaining loan tenure", 10, 1, 40, "Years remaining on the current schedule."),
    currencyQuestion("extraMonthly", "Extra monthly payment", 10_000, "Use an amount that is sustainable."),
    currencyQuestion("monthlyExpenses", "Essential monthly expenses", 60_000, "Core spending including required debt payments."),
    currencyQuestion("emergencySavings", "Emergency savings before prepayment", 500_000, "Accessible savings available today."),
    percentageQuestion("alternativeReturn", "Conservative post-tax alternative return", 7, "Use a cautious comparable return assumption.", 30),
    booleanQuestion("hasPrepaymentCharge", "Does the lender charge for prepayment?", false, "Confirm this from the loan agreement."),
    textQuestion("lenderTerms", "Relevant lender terms", "Optional notes from the loan agreement."),
  ],
  deriveFacts: (answers) => {
    const principal = numberAnswer(answers, "loanBalance");
    const rateValue = numberAnswer(answers, "interestRate");
    const years = numberAnswer(answers, "remainingYears");
    const extra = numberAnswer(answers, "extraMonthly");
    return { interestSaved: calculatorValue("loan-prepayment-calculator", { principal, rate: rateValue, years, extra }), emergencyMonths: ratio(numberAnswer(answers, "emergencySavings"), numberAnswer(answers, "monthlyExpenses")), rateGap: rateValue - numberAnswer(answers, "alternativeReturn"), remainingYears: years, hasPrepaymentCharge: booleanAnswer(answers, "hasPrepaymentCharge") };
  },
  weights: [{ factorId: "savings", label: "Interest savings", weight: 35, baselineScore: 50 }, { factorId: "liquidity", label: "Liquidity", weight: 30, baselineScore: 50 }, { factorId: "returnGap", label: "Return comparison", weight: 20, baselineScore: 50 }, { factorId: "tenure", label: "Remaining tenure", weight: 15, baselineScore: 50 }],
  rules: [
    { id: "prepay-saving", description: "The calculator estimates meaningful interest savings.", when: { all: [{ fact: "interestSaved", operator: "greater-than", value: 100_000 }] }, factorId: "savings", scoreEffect: { operation: "add", value: 28 } },
    { id: "prepay-buffer", description: "Emergency liquidity is below six months.", when: { all: [{ fact: "emergencyMonths", operator: "less-than", value: 6 }] }, factorId: "liquidity", scoreEffect: { operation: "subtract", value: 38 }, risk: prepayLiquidityRisk },
    { id: "prepay-rate-gap", description: "The loan rate exceeds the alternative return.", when: { all: [{ fact: "rateGap", operator: "greater-than", value: 1 }] }, factorId: "returnGap", scoreEffect: { operation: "add", value: 25 } },
    { id: "prepay-short-tenure", description: "Little tenure remains for interest to accrue.", when: { all: [{ fact: "remainingYears", operator: "less-than", value: 2 }] }, factorId: "tenure", scoreEffect: { operation: "subtract", value: 20 } },
    { id: "prepay-charge", description: "A prepayment charge reduces the benefit.", when: { all: [{ fact: "hasPrepaymentCharge", operator: "equals", value: true }] }, factorId: "savings", scoreEffect: { operation: "subtract", value: 18 }, risk: prepayPenaltyRisk },
  ],
  riskFactors: [prepayLiquidityRisk, prepayPenaltyRisk],
  recommendations: recommendationTemplates("prepay the loan"), actionPlanTemplates: actionPlanTemplates("loan prepayment"),
  relatedCalculators: ["loan-prepayment-calculator", "debt-payoff-calculator", "emi-calculator"], relatedTools: ["percentage-calculator", "pdf-merge"],
  assumptions: ["The calculator uses the current balance, rate, tenure, and extra payment entered.", "Alternative returns are uncertain while avoided loan interest is contractual, subject to lender terms.", "Tax effects and lender-specific charges require separate verification."],
  faqs: [{ question: "Should I use my emergency fund to prepay?", answer: "Usually preserve an appropriate liquid buffer first; the workflow penalises inadequate coverage." }, { question: "Does the workflow include lender charges?", answer: "It flags whether a charge exists, but you must verify its exact amount with the lender." }],
  scoreBands: standardScoreBands,
};

export const financeDecisionWorkflows = [sipVsFdWorkflow, emergencyFundWorkflow, loanPrepaymentWorkflow];
