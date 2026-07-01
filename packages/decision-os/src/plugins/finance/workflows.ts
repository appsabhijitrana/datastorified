import type { DecisionWorkflow } from "../../types";
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

const sipShortHorizonRisk = risk("short-horizon", "Short investment horizon", "Market-linked returns may be unsuitable for money needed soon.", "high", "Use a capital-stable allocation for near-term needs.");
const sipLiquidityRisk = risk("liquidity-gap", "Emergency-fund gap", "Investing without an adequate liquid buffer can force an early withdrawal.", "high", "Build accessible emergency savings first.");
const sipVolatilityRisk = risk("volatility-mismatch", "Volatility mismatch", "Low tolerance for market falls weakens the fit of an equity-oriented SIP.", "medium", "Reduce market exposure or use a blended allocation.");

export const sipVsFdWorkflow: DecisionWorkflow = {
  id: "sip-vs-fd",
  slug: "sip-vs-fd",
  pluginId: "finance",
  version: "1.0.0",
  title: "SIP or fixed deposit?",
  category: "investment",
  description: "Compare SIP and fixed-deposit paths using horizon, inflation, liquidity, risk tolerance, and calculator projections.",
  aliases: ["sip vs fd", "mutual fund or fixed deposit", "invest in SIP or FD"],
  intent: { keywords: ["sip", "fd", "fixed", "deposit", "mutual", "fund", "invest"], aliases: ["sip vs fd", "mutual fund or fixed deposit"], examples: ["Should I invest in SIP or FD?"] },
  questions: [
    currencyQuestion("investmentAmount", "Monthly amount available to invest", 20_000, "Use an amount you can sustain consistently."),
    durationQuestion("timeHorizon", "Investment horizon", 8, 1, 30, "Time before the money is expected to be used."),
    percentageQuestion("sipReturn", "Expected annual SIP return", 11, "Use a conservative planning assumption, not a promise.", 30),
    percentageQuestion("fdRate", "Offered annual FD rate", 7, "Use the stated pre-tax annual rate.", 20),
    percentageQuestion("inflationRate", "Expected inflation", 6, "Use a long-term planning assumption.", 20),
    sliderQuestion("riskTolerance", "Comfort with market volatility", 3, 1, 5, "1 means low tolerance; 5 means high tolerance."),
    numberQuestion("emergencyMonths", "Emergency-fund coverage", 6, 0, 36, "Months of essential expenses held in accessible savings."),
    textQuestion("goalNotes", "What is this investment for?", "Optional context for your own report."),
  ],
  deriveFacts: (answers) => {
    const monthly = numberAnswer(answers, "investmentAmount");
    const years = numberAnswer(answers, "timeHorizon");
    const sipReturn = numberAnswer(answers, "sipReturn");
    const fdRate = numberAnswer(answers, "fdRate");
    return {
      timeHorizon: years,
      riskTolerance: numberAnswer(answers, "riskTolerance"),
      emergencyMonths: numberAnswer(answers, "emergencyMonths"),
      realReturnGap: sipReturn - numberAnswer(answers, "inflationRate"),
      sipProjectedValue: calculatorValue("sip-calculator", { monthly, rate: sipReturn, years }),
      fdProjectedValue: calculatorValue("fd-calculator", { principal: monthly * 12, rate: fdRate, years }),
    };
  },
  weights: [
    { factorId: "horizon", label: "Time horizon", weight: 30, baselineScore: 50 },
    { factorId: "risk", label: "Risk fit", weight: 30, baselineScore: 50 },
    { factorId: "growth", label: "Inflation-adjusted growth", weight: 25, baselineScore: 50 },
    { factorId: "liquidity", label: "Liquidity", weight: 15, baselineScore: 50 },
  ],
  rules: [
    { id: "sip-long-horizon", description: "A longer horizon supports market-linked investing.", when: { all: [{ fact: "timeHorizon", operator: "greater-than-or-equal", value: 7 }] }, factorId: "horizon", scoreEffect: { operation: "add", value: 28 } },
    { id: "sip-short-horizon", description: "A short horizon favours capital stability.", when: { all: [{ fact: "timeHorizon", operator: "less-than", value: 3 }] }, factorId: "horizon", scoreEffect: { operation: "subtract", value: 35 }, risk: sipShortHorizonRisk },
    { id: "sip-risk-fit", description: "Higher volatility tolerance supports SIP exposure.", when: { all: [{ fact: "riskTolerance", operator: "greater-than-or-equal", value: 4 }] }, factorId: "risk", scoreEffect: { operation: "add", value: 25 } },
    { id: "sip-risk-mismatch", description: "Low volatility tolerance favours an FD-weighted path.", when: { all: [{ fact: "riskTolerance", operator: "less-than-or-equal", value: 2 }] }, factorId: "risk", scoreEffect: { operation: "subtract", value: 30 }, risk: sipVolatilityRisk },
    { id: "sip-real-growth", description: "The SIP assumption exceeds inflation by a useful margin.", when: { all: [{ fact: "realReturnGap", operator: "greater-than", value: 3 }] }, factorId: "growth", scoreEffect: { operation: "add", value: 22 } },
    { id: "sip-buffer-gap", description: "A thin emergency fund weakens investment readiness.", when: { all: [{ fact: "emergencyMonths", operator: "less-than", value: 6 }] }, factorId: "liquidity", scoreEffect: { operation: "subtract", value: 32 }, risk: sipLiquidityRisk },
  ],
  riskFactors: [sipShortHorizonRisk, sipLiquidityRisk, sipVolatilityRisk],
  recommendations: [
    { id: "fd-weighted", minScore: 0, maxScore: 39.99, title: "Prefer an FD-weighted approach", summary: "The current horizon, liquidity, or volatility tolerance favours capital stability.", actions: ["Protect near-term money", "Compare post-tax FD outcomes"] },
    { id: "blend", minScore: 40, maxScore: 64.99, title: "Consider a blended SIP and FD allocation", summary: "The inputs support balancing growth with stability rather than making an all-or-nothing choice.", actions: ["Assign near-term goals to stable assets", "Use SIP only for the longer-horizon portion"] },
    { id: "sip-aligned", minScore: 65, maxScore: 100, title: "A SIP-oriented allocation is better aligned", summary: "The horizon, buffer, and risk tolerance support greater market-linked exposure under the stated assumptions.", actions: ["Choose a diversified suitable fund", "Automate and review the SIP annually"] },
  ],
  actionPlanTemplates: [
    { id: "fd-plan", minScore: 0, maxScore: 39.99, actions: ["Ring-fence emergency savings", "Match FD tenure to the goal date", "Compare post-tax rates and premature-withdrawal terms", "Reassess SIP readiness later"] },
    { id: "blend-plan", minScore: 40, maxScore: 64.99, actions: ["Separate short- and long-term goals", "Set the FD allocation for stability", "Start a manageable SIP for long-term growth", "Review the allocation annually"] },
    { id: "sip-plan", minScore: 65, maxScore: 100, actions: ["Confirm the emergency fund remains untouched", "Select a diversified SIP appropriate to risk", "Automate monthly investing", "Review assumptions without reacting to short-term volatility"] },
  ],
  relatedCalculators: ["sip-calculator", "fd-calculator", "inflation-calculator"],
  relatedTools: ["percentage-calculator", "word-counter"],
  assumptions: ["SIP returns are scenarios, not guarantees.", "FD rates are treated as fixed only for their stated term.", "Taxes, fees, and product-specific restrictions are not fully modelled."],
  faqs: [{ question: "Are SIP returns guaranteed?", answer: "No. The calculator result is a planning scenario based on the return entered." }, { question: "Can I split money between SIP and FD?", answer: "Yes. A blended allocation is often more realistic when goals have different horizons." }],
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
