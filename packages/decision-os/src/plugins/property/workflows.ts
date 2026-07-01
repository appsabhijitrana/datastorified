import type { DecisionWorkflow } from "../../types";
import {
  actionPlanTemplates,
  booleanAnswer,
  booleanQuestion,
  calculatorValue,
  currencyQuestion,
  durationQuestion,
  numberAnswer,
  percentageQuestion,
  ratio,
  recommendationTemplates,
  risk,
  selectQuestion,
  sliderQuestion,
  standardScoreBands,
  textQuestion,
} from "../workflowSupport";

const affordabilityRisk = risk("housing-affordability", "Housing payment is too high", "The estimated housing payment consumes an unsafe share of income.", "high", "Reduce the budget, increase the down payment without draining reserves, or wait.");
const housingLiquidityRisk = risk("housing-liquidity", "Emergency reserve is too thin", "Buying would leave inadequate accessible savings.", "high", "Preserve closing costs and a suitable post-purchase emergency fund.");
const shortOwnershipRisk = risk("short-ownership", "Short expected ownership period", "Transaction costs and flexibility needs weaken the case for buying.", "medium", "Model the full cost of selling or continue renting.");
const titleRisk = risk("title-diligence", "Property diligence incomplete", "Legal title and physical-condition checks are not yet complete.", "critical", "Complete independent legal and technical due diligence before paying a non-refundable amount.");

const housingQuestions = [
  currencyQuestion("monthlyIncome", "Monthly household take-home income", 150_000, "Use stable recurring income."),
  currencyQuestion("propertyPrice", "Property purchase price", 8_000_000, "Use the negotiated all-cash price before ancillary costs."),
  currencyQuestion("downPayment", "Available down payment", 1_600_000, "Do not include money needed for emergencies or closing costs."),
  currencyQuestion("existingEmi", "Existing monthly debt payments", 15_000, "Include all required EMIs."),
  percentageQuestion("interestRate", "Expected home-loan rate", 8.5, "Use a current written quote where possible.", 30),
  durationQuestion("tenure", "Loan tenure", 20, 1, 30, "Expected repayment period."),
  currencyQuestion("monthlyExpenses", "Essential monthly expenses", 70_000, "Exclude the new home-loan payment."),
  currencyQuestion("emergencySavings", "Savings remaining after purchase", 600_000, "Accessible savings after down payment and closing costs."),
  selectQuestion("incomeStability", "Income stability", 2, [["Uncertain", 1], ["Reasonably stable", 2], ["Very stable", 3]], "Consider job and income-source concentration."),
  durationQuestion("stayYears", "Expected ownership period", 8, 1, 30, "How long you realistically expect to retain the home."),
  booleanQuestion("diligenceComplete", "Are legal and technical checks complete?", false, "Independent verification matters more than seller assurances."),
  textQuestion("propertyNotes", "Property-specific concerns", "Optional notes about location, condition, or legal status."),
];

function housingFacts(answers: Parameters<NonNullable<DecisionWorkflow["deriveFacts"]>>[0]) {
  const price = numberAnswer(answers, "propertyPrice");
  const downPayment = numberAnswer(answers, "downPayment");
  const rateValue = numberAnswer(answers, "interestRate");
  const years = numberAnswer(answers, "tenure");
  const income = numberAnswer(answers, "monthlyIncome");
  const loan = Math.max(0, price - downPayment);
  const emi = calculatorValue("emi-calculator", { principal: loan, rate: rateValue, years });
  return {
    emi,
    emiToIncomeRatio: ratio(emi, income),
    totalDebtRatio: ratio(emi + numberAnswer(answers, "existingEmi"), income),
    emergencyMonths: ratio(numberAnswer(answers, "emergencySavings"), numberAnswer(answers, "monthlyExpenses")),
    affordableBudget: calculatorValue("home-affordability-calculator", { income, savings: downPayment, obligations: numberAnswer(answers, "existingEmi"), rate: rateValue, years }),
    propertyPrice: price,
    stayYears: numberAnswer(answers, "stayYears"),
    incomeStability: numberAnswer(answers, "incomeStability"),
    diligenceComplete: booleanAnswer(answers, "diligenceComplete"),
  };
}

export const buyHouseWorkflow: DecisionWorkflow = {
  id: "buy-house", slug: "buy-house", pluginId: "property", version: "1.0.0",
  title: "Should I buy a house?", category: "property",
  description: "Test home affordability, liquidity, debt load, stability, ownership horizon, and diligence before buying.",
  aliases: ["buy a house", "purchase a home", "can I afford a home"],
  intent: { keywords: ["buy", "house", "home", "property", "mortgage", "afford"], aliases: ["buy a house", "purchase a home"], examples: ["Should I buy this house?"] },
  questions: housingQuestions,
  deriveFacts: housingFacts,
  weights: [{ factorId: "affordability", label: "Affordability", weight: 35, baselineScore: 50 }, { factorId: "liquidity", label: "Liquidity", weight: 25, baselineScore: 50 }, { factorId: "stability", label: "Stability", weight: 20, baselineScore: 50 }, { factorId: "horizon", label: "Ownership horizon", weight: 10, baselineScore: 50 }, { factorId: "diligence", label: "Diligence", weight: 10, baselineScore: 50 }],
  rules: [
    { id: "house-emi-high", description: "The estimated EMI is above 30% of income.", when: { all: [{ fact: "emiToIncomeRatio", operator: "greater-than", value: 0.3 }] }, factorId: "affordability", scoreEffect: { operation: "subtract", value: 35 }, risk: affordabilityRisk },
    { id: "house-debt-high", description: "Total debt payments exceed 40% of income.", when: { all: [{ fact: "totalDebtRatio", operator: "greater-than", value: 0.4 }] }, factorId: "affordability", scoreEffect: { operation: "subtract", value: 25 }, risk: affordabilityRisk },
    { id: "house-buffer-low", description: "Post-purchase savings cover fewer than six months.", when: { all: [{ fact: "emergencyMonths", operator: "less-than", value: 6 }] }, factorId: "liquidity", scoreEffect: { operation: "subtract", value: 35 }, risk: housingLiquidityRisk },
    { id: "house-stable-income", description: "Income stability supports a long commitment.", when: { all: [{ fact: "incomeStability", operator: "equals", value: 3 }] }, factorId: "stability", scoreEffect: { operation: "add", value: 22 } },
    { id: "house-unstable-income", description: "Uncertain income weakens a leveraged purchase.", when: { all: [{ fact: "incomeStability", operator: "equals", value: 1 }] }, factorId: "stability", scoreEffect: { operation: "subtract", value: 30 } },
    { id: "house-short-horizon", description: "A short expected holding period weakens ownership economics.", when: { all: [{ fact: "stayYears", operator: "less-than", value: 5 }] }, factorId: "horizon", scoreEffect: { operation: "subtract", value: 28 }, risk: shortOwnershipRisk },
    { id: "house-diligence", description: "Legal and technical diligence is complete.", when: { all: [{ fact: "diligenceComplete", operator: "equals", value: true }] }, factorId: "diligence", scoreEffect: { operation: "add", value: 30 } },
    { id: "house-no-diligence", description: "Property diligence is incomplete.", when: { all: [{ fact: "diligenceComplete", operator: "equals", value: false }] }, factorId: "diligence", scoreEffect: { operation: "subtract", value: 40 }, risk: titleRisk },
  ],
  riskFactors: [affordabilityRisk, housingLiquidityRisk, shortOwnershipRisk, titleRisk],
  recommendations: recommendationTemplates("buy the house"), actionPlanTemplates: actionPlanTemplates("the home purchase"),
  relatedCalculators: ["home-affordability-calculator", "emi-calculator", "stamp-duty-calculator"], relatedTools: ["pdf-merge", "percentage-calculator"],
  assumptions: ["EMI and affordability metrics come from the existing calculator engine.", "Registration, furnishing, maintenance, taxes, and repairs require separate estimates.", "Property value growth is not guaranteed."],
  faqs: [{ question: "Does a high score guarantee I should buy?", answer: "No. It indicates the entered affordability and resilience assumptions are supportive, subject to diligence." }, { question: "Are registration and maintenance included?", answer: "No. Model local fees, maintenance, furnishing, and repairs separately." }],
  scoreBands: standardScoreBands,
};

const rentFlexibilityRisk = risk("rent-flexibility", "Buying reduces needed flexibility", "The expected stay is too short to comfortably absorb transaction costs and reduced mobility.", "medium", "Continue renting or choose a lower-commitment option.");

export const rentVsBuyWorkflow: DecisionWorkflow = {
  ...buyHouseWorkflow,
  id: "rent-vs-buy", slug: "rent-vs-buy", title: "Should I rent or buy a home?",
  description: "Compare renting and buying using calculator-estimated ownership economics, affordability, flexibility, and time horizon.",
  aliases: ["rent vs buy", "rent or buy a house", "keep renting or buy", "buy or rent a house"],
  intent: { keywords: ["rent", "buy", "home", "house", "compare"], aliases: ["rent vs buy", "rent or buy a house", "keep renting or buy"], examples: ["Should I keep renting or buy a house?"] },
  questions: [
    ...housingQuestions.filter(({ id }) => id !== "diligenceComplete"),
    currencyQuestion("monthlyRent", "Current monthly rent", 25_000, "Use the rent for a genuinely comparable home."),
    sliderQuestion("flexibilityNeed", "Need for location flexibility", 3, 1, 5, "5 means you may need to move easily."),
  ],
  deriveFacts: (answers) => {
    const facts = housingFacts(answers);
    const years = numberAnswer(answers, "stayYears");
    return { ...facts, flexibilityNeed: numberAnswer(answers, "flexibilityNeed"), buyAdvantage: calculatorValue("rent-vs-buy-calculator", { property: numberAnswer(answers, "propertyPrice"), downPayment: numberAnswer(answers, "downPayment"), rate: numberAnswer(answers, "interestRate"), years, rent: numberAnswer(answers, "monthlyRent"), rentGrowth: 5, appreciation: 4 }) };
  },
  weights: [{ factorId: "economics", label: "Ownership economics", weight: 30, baselineScore: 50 }, { factorId: "affordability", label: "Affordability", weight: 25, baselineScore: 50 }, { factorId: "liquidity", label: "Liquidity", weight: 20, baselineScore: 50 }, { factorId: "horizon", label: "Time horizon", weight: 15, baselineScore: 50 }, { factorId: "flexibility", label: "Flexibility", weight: 10, baselineScore: 50 }],
  rules: [
    { id: "rent-buy-advantage", description: "The existing calculator estimates a buying cost advantage.", when: { all: [{ fact: "buyAdvantage", operator: "greater-than", value: 0 }] }, factorId: "economics", scoreEffect: { operation: "add", value: 28 } },
    { id: "rent-emi-high", description: "The estimated EMI is too high relative to income.", when: { all: [{ fact: "emiToIncomeRatio", operator: "greater-than", value: 0.3 }] }, factorId: "affordability", scoreEffect: { operation: "subtract", value: 35 }, risk: affordabilityRisk },
    { id: "rent-buffer-low", description: "Buying would leave a thin reserve.", when: { all: [{ fact: "emergencyMonths", operator: "less-than", value: 6 }] }, factorId: "liquidity", scoreEffect: { operation: "subtract", value: 35 }, risk: housingLiquidityRisk },
    { id: "rent-long-stay", description: "A long expected stay supports buying.", when: { all: [{ fact: "stayYears", operator: "greater-than-or-equal", value: 7 }] }, factorId: "horizon", scoreEffect: { operation: "add", value: 28 } },
    { id: "rent-short-stay", description: "A short expected stay favours renting.", when: { all: [{ fact: "stayYears", operator: "less-than", value: 5 }] }, factorId: "horizon", scoreEffect: { operation: "subtract", value: 30 }, risk: rentFlexibilityRisk },
    { id: "rent-flexibility-high", description: "A high need for mobility favours renting.", when: { all: [{ fact: "flexibilityNeed", operator: "greater-than-or-equal", value: 4 }] }, factorId: "flexibility", scoreEffect: { operation: "subtract", value: 25 }, risk: rentFlexibilityRisk },
  ],
  riskFactors: [affordabilityRisk, housingLiquidityRisk, rentFlexibilityRisk],
  recommendations: [
    { id: "rent", minScore: 0, maxScore: 39.99, title: "Renting is better aligned for now", summary: "Affordability, liquidity, horizon, or flexibility weaken the case for buying.", actions: ["Continue renting", "Build the purchase buffer", "Review again when the horizon is clearer"] },
    { id: "compare", minScore: 40, maxScore: 64.99, title: "The choice is finely balanced", summary: "Small changes in costs or time horizon could change the answer.", actions: ["Compare full cash flows", "Get current loan and rent quotes"] },
    { id: "buy", minScore: 65, maxScore: 100, title: "Buying is better aligned", summary: "The current economics, affordability, and expected stay support ownership.", actions: ["Complete legal and technical diligence", "Protect post-purchase liquidity"] },
  ],
  actionPlanTemplates: actionPlanTemplates("the rent-versus-buy choice"),
  relatedCalculators: ["rent-vs-buy-calculator", "home-affordability-calculator", "rental-yield-calculator"],
  assumptions: ["The rent-versus-buy result uses the existing calculator engine.", "Rent growth and property appreciation are planning assumptions, not forecasts.", "Lifestyle and mobility needs may outweigh a small modelled cost difference."],
  faqs: [{ question: "Does the model predict property prices?", answer: "No. It uses planning assumptions and exposes horizon and affordability risk." }, { question: "Can renting be right even if buying looks cheaper?", answer: "Yes. Flexibility, liquidity, and execution risk can outweigh a modest projected advantage." }],
};

export const propertyDecisionWorkflows = [buyHouseWorkflow, rentVsBuyWorkflow];
