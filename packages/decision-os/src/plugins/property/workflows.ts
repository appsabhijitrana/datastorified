import type { DecisionAnswers, DecisionWorkflow } from "../../types";
import { clamp } from "../../utils/math";
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
const houseScenarioVariables = [
  { id: "house-price", questionId: "propertyPrice", label: "Property price", chips: [7_500_000, 8_000_000, 9_500_000] },
  { id: "house-down-payment", questionId: "downPayment", label: "Down payment", chips: [1_000_000, 1_600_000, 2_500_000] },
  { id: "house-rate", questionId: "interestRate", label: "Interest rate", chips: [8, 9, 10.5] },
  { id: "house-tenure", questionId: "tenure", label: "Tenure", chips: [15, 20, 25] },
  { id: "house-income", questionId: "monthlyIncome", label: "Monthly income", chips: [120_000, 150_000, 250_000] },
] as const;

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
  scenarios: [
    { id: "house-price-up", label: "Higher price", description: "See how a pricier home changes the decision.", overrides: { propertyPrice: 9_500_000, downPayment: 1_600_000 } },
    { id: "house-rate-up", label: "Higher rate", description: "Stress-test the decision with a more expensive loan.", overrides: { interestRate: 10.5, tenure: 20 } },
    { id: "house-cash-strong", label: "Stronger cash position", description: "Explore a larger down payment and emergency buffer.", overrides: { propertyPrice: 7_000_000, downPayment: 4_000_000, emergencySavings: 1_500_000 } },
  ],
  scenarioVariables: houseScenarioVariables,
  scoreBands: standardScoreBands,
};

const rentBuyLocationType = selectQuestion("cityLocationType", "What best describes the city or location type?", 2, [["Metro / high-cost market", 1], ["Urban market", 2], ["Suburban market", 3], ["Smaller city or town", 4]], "Location pressure changes rent, resale, and lifestyle trade-offs.");
const rentBuyMonthlyRent = currencyQuestion("monthlyRent", "Current monthly rent", 25_000, "Use rent for a genuinely comparable home.");
const rentBuyPropertyPrice = currencyQuestion("propertyPrice", "Expected property price", 8_000_000, "Use the purchase price you are realistically considering.");
const rentBuyDownPayment = currencyQuestion("downPaymentAvailable", "Down payment available", 1_600_000, "Use money that is truly available without draining safety reserves.");
const rentBuyExpectedEmi = currencyQuestion("expectedLoanEmi", "Expected loan EMI", 55_000, "Use the EMI quoted or estimated for the home you want to buy.");
const rentBuyMonthlyIncome = currencyQuestion("monthlyIncome", "Monthly household income", 150_000, "Use stable recurring take-home income.");
const rentBuyMonthlyExpenses = currencyQuestion("monthlyExpenses", "Essential monthly expenses", 70_000, "Exclude the potential home payment itself.");
const rentBuyEmergencyFund = currencyQuestion("currentEmergencyFund", "Current emergency fund", 400_000, "Liquid money that remains available in a real emergency.");
const rentBuyIncomeStability = selectQuestion("incomeStability", "How stable is your income?", 2, [["Uncertain", 1], ["Reasonably stable", 2], ["Very stable", 3]], "A stable income can support a larger commitment.");
const rentBuyPlannedStay = durationQuestion("plannedStayDuration", "How long do you expect to stay in this home?", 7, 1, 25, "A short stay usually changes the answer.");
const rentBuyFamilyNeed = sliderQuestion("familyStabilityNeed", "How important is family stability and continuity?", 3, 1, 5, "Higher values mean staying put matters more.");
const rentBuyMaintenance = currencyQuestion("maintenanceCost", "Estimated monthly maintenance cost", 8_000, "Use repairs, upkeep, society fees, and routine ownership costs.");
const rentBuyOpportunityCost = percentageQuestion("investmentOpportunityCost", "Expected investment opportunity cost", 8, "What return could the down payment earn elsewhere?");
const rentBuyFlexibility = sliderQuestion("flexibilityPreference", "How important is flexibility?", 3, 1, 5, "Higher values mean you prefer to move more easily.");
const rentBuyDebtComfort = sliderQuestion("debtComfort", "How comfortable are you with long-term debt?", 3, 1, 5, "Higher values mean debt is less stressful for you.");
const rentBuyLoanPreapproval = booleanQuestion("hasLoanPreapproval", "Do you already have loan pre-approval?", false, "A written pre-approval improves certainty, but not affordability.");
const rentBuyNotes = textQuestion("locationNotes", "Location or family notes", "Optional notes about school needs, commute, landlord terms, or local risks.");

const rentBuyScenarioVariables = [
  { id: "rent-buy-price", questionId: "propertyPrice", label: "Property price", chips: [7_000_000, 8_000_000, 10_000_000] },
  { id: "rent-buy-rent", questionId: "monthlyRent", label: "Monthly rent", chips: [20_000, 25_000, 40_000] },
  { id: "rent-buy-emi", questionId: "expectedLoanEmi", label: "Expected EMI", chips: [35_000, 55_000, 80_000] },
  { id: "rent-buy-stay", questionId: "plannedStayDuration", label: "Planned stay", chips: [2, 5, 10] },
  { id: "rent-buy-downpayment", questionId: "downPaymentAvailable", label: "Down payment", chips: [1_000_000, 1_600_000, 3_000_000] },
  { id: "rent-buy-income", questionId: "monthlyIncome", label: "Monthly income", chips: [100_000, 150_000, 250_000] },
] as const;

function rentBuyFacts(answers: Readonly<Parameters<NonNullable<DecisionWorkflow["deriveFacts"]>>[0]>) {
  const stayYears = numberAnswer(answers, "plannedStayDuration");
  const monthlyIncome = numberAnswer(answers, "monthlyIncome");
  const monthlyRent = numberAnswer(answers, "monthlyRent");
  const expectedLoanEmi = numberAnswer(answers, "expectedLoanEmi");
  const monthlyExpenses = numberAnswer(answers, "monthlyExpenses");
  const maintenanceCost = numberAnswer(answers, "maintenanceCost");
  const downPaymentAvailable = numberAnswer(answers, "downPaymentAvailable");
  const opportunityCost = numberAnswer(answers, "investmentOpportunityCost");
  const currentEmergencyFund = numberAnswer(answers, "currentEmergencyFund");
  const familyStabilityNeed = numberAnswer(answers, "familyStabilityNeed");
  const flexibilityPreference = numberAnswer(answers, "flexibilityPreference");
  const debtComfort = numberAnswer(answers, "debtComfort");
  const incomeStability = numberAnswer(answers, "incomeStability");
  const cityLocationType = numberAnswer(answers, "cityLocationType");
  const rentTotalCost = monthlyRent * 12 * stayYears;
  const buyTotalCost = (expectedLoanEmi * 12 * stayYears) + (maintenanceCost * 12 * stayYears) + (downPaymentAvailable * (opportunityCost / 100) * stayYears);
  const costGap = rentTotalCost - buyTotalCost;
  const denominator = Math.max(rentTotalCost, buyTotalCost, 1);
  const financialBalance = clamp(100 - (Math.abs(costGap) / denominator) * 100, 0, 100);
  return {
    cityLocationType,
    monthlyRent,
    expectedPropertyPrice: numberAnswer(answers, "propertyPrice"),
    downPaymentAvailable,
    expectedLoanEmi,
    monthlyIncome,
    monthlyExpenses,
    currentEmergencyFund,
    incomeStability,
    plannedStayDuration: stayYears,
    familyStabilityNeed,
    maintenanceCost,
    investmentOpportunityCost: opportunityCost,
    flexibilityPreference,
    debtComfort,
    hasLoanPreapproval: booleanAnswer(answers, "hasLoanPreapproval"),
    rentToIncomeRatio: ratio(monthlyRent, monthlyIncome),
    emiToIncomeRatio: ratio(expectedLoanEmi, monthlyIncome),
    maintenanceToIncomeRatio: ratio(maintenanceCost, monthlyIncome),
    emergencyMonths: ratio(currentEmergencyFund, monthlyExpenses),
    rentTotalCost,
    buyTotalCost,
    costGap,
    financialBalance,
    buyAdvantage: costGap,
    rentAdvantage: -costGap,
  };
}

const rentRiskHighFamilyNeed = risk("rent-family-stability-need", "Family stability need is high", "Renting can create more moving pressure when continuity, school access, and settled routines matter.", "high", "Consider buying or a long fixed-term rental if stability matters most.");
const buyRiskHighEmi = risk("buy-emi-pressure", "EMI pressure is too high", "The planned EMI takes too much of monthly income.", "high", "Reduce the budget, increase the down payment, or wait until the payment is safer.");
const buyRiskShortStay = risk("buy-short-stay", "Planned stay is short", "Ownership costs are harder to recover when the stay horizon is short.", "medium", "Wait until the stay plan is clearer or continue renting.");
const buyRiskWeakFund = risk("buy-emergency-fund-weak", "Emergency fund would be weak", "Buying may leave too little cash for surprises or job changes.", "high", "Keep a stronger liquid buffer before closing.");

function cityScoreAdjust(cityLocationType: number): number {
  if (cityLocationType <= 1) return -6;
  if (cityLocationType === 2) return 0;
  if (cityLocationType === 3) return 4;
  return 8;
}

function rentAffordabilityScore(answers: Readonly<DecisionAnswers>): number {
  const facts = rentBuyFacts(answers);
  return clamp(96 - (facts.rentToIncomeRatio * 200) + (facts.plannedStayDuration <= 3 ? 8 : 0) + cityScoreAdjust(facts.cityLocationType), 0, 100);
}

function buyAffordabilityScore(answers: Readonly<DecisionAnswers>): number {
  const facts = rentBuyFacts(answers);
  return clamp(96 - (facts.emiToIncomeRatio * 220) - (facts.maintenanceToIncomeRatio * 80) - (facts.debtComfort <= 2 ? 8 : 0), 0, 100);
}

function rentLongTermCostScore(answers: Readonly<DecisionAnswers>): number {
  const facts = rentBuyFacts(answers);
  return clamp(55 + (facts.costGap <= 0 ? 20 : -18) + (facts.plannedStayDuration <= 3 ? 14 : 0) - (facts.plannedStayDuration >= 8 ? 16 : 0), 0, 100);
}

function buyLongTermCostScore(answers: Readonly<DecisionAnswers>): number {
  const facts = rentBuyFacts(answers);
  return clamp(50 + (facts.costGap > 0 ? 22 : -18) + (facts.plannedStayDuration >= 7 ? 18 : 0) - (facts.plannedStayDuration <= 3 ? 18 : 0), 0, 100);
}

function rentFlexibilityScore(answers: Readonly<DecisionAnswers>): number {
  const facts = rentBuyFacts(answers);
  return clamp(60 + (facts.flexibilityPreference * 8) + (facts.plannedStayDuration <= 3 ? 10 : 0) - (facts.familyStabilityNeed * 4), 0, 100);
}

function buyFlexibilityScore(answers: Readonly<DecisionAnswers>): number {
  const facts = rentBuyFacts(answers);
  return clamp(70 - (facts.flexibilityPreference * 12) + (facts.plannedStayDuration >= 7 ? 10 : 0), 0, 100);
}

function rentStabilityScore(answers: Readonly<DecisionAnswers>): number {
  const facts = rentBuyFacts(answers);
  return clamp(75 + ((4 - facts.incomeStability) * 10) - (facts.familyStabilityNeed * 4), 0, 100);
}

function buyStabilityScore(answers: Readonly<DecisionAnswers>): number {
  const facts = rentBuyFacts(answers);
  return clamp(58 + (facts.incomeStability * 14) + (facts.familyStabilityNeed * 6), 0, 100);
}

function rentWealthScore(answers: Readonly<DecisionAnswers>): number {
  const facts = rentBuyFacts(answers);
  return clamp(52 + (facts.investmentOpportunityCost * 4) + (facts.costGap <= 0 ? 12 : -12) + (facts.plannedStayDuration <= 3 ? 8 : 0), 0, 100);
}

function buyWealthScore(answers: Readonly<DecisionAnswers>): number {
  const facts = rentBuyFacts(answers);
  return clamp(52 + (facts.costGap > 0 ? 18 : -14) + (facts.plannedStayDuration >= 7 ? 12 : 0) + cityScoreAdjust(facts.cityLocationType), 0, 100);
}

function rentLiquidityScore(answers: Readonly<DecisionAnswers>): number {
  const facts = rentBuyFacts(answers);
  return clamp(90 - (facts.downPaymentAvailable / Math.max(facts.monthlyIncome, 1) * 18) + (facts.emergencyMonths < 6 ? 10 : 0), 0, 100);
}

function buyLiquidityScore(answers: Readonly<DecisionAnswers>): number {
  const facts = rentBuyFacts(answers);
  return clamp(88 - (facts.emergencyMonths * 10) - (facts.downPaymentAvailable / Math.max(facts.monthlyIncome, 1) * 28), 0, 100);
}

function rentDebtScore(answers: Readonly<DecisionAnswers>): number {
  const facts = rentBuyFacts(answers);
  return clamp(92 - (facts.emiToIncomeRatio * 180) + (facts.debtComfort * 2), 0, 100);
}

function buyDebtScore(answers: Readonly<DecisionAnswers>): number {
  const facts = rentBuyFacts(answers);
  return clamp(92 - (facts.emiToIncomeRatio * 220) + (facts.debtComfort * 4), 0, 100);
}

function rentLifestyleScore(answers: Readonly<DecisionAnswers>): number {
  const facts = rentBuyFacts(answers);
  return clamp(70 + (facts.flexibilityPreference * 8) - (facts.familyStabilityNeed * 7) + (facts.cityLocationType <= 2 ? 6 : 0), 0, 100);
}

function buyLifestyleScore(answers: Readonly<DecisionAnswers>): number {
  const facts = rentBuyFacts(answers);
  return clamp(62 + (facts.familyStabilityNeed * 8) - (facts.flexibilityPreference * 6) + (facts.plannedStayDuration >= 7 ? 10 : 0), 0, 100);
}

export const rentVsBuyWorkflow: DecisionWorkflow = {
  id: "rent-vs-buy", slug: "rent-vs-buy", pluginId: "property", version: "1.1.0",
  title: "Should I rent or buy a home?",
  category: "property",
  description: "Compare rent versus ownership using affordability, long-term cost, flexibility, liquidity, and lifestyle fit.",
  aliases: ["rent vs buy", "rent or buy", "buy or rent", "buy vs rent", "renting or buying"],
  intent: { keywords: ["rent", "buy", "home", "house", "housing", "mortgage", "lease"], aliases: ["rent vs buy", "rent or buy a home", "rent or buy a house", "better to rent or buy a house", "is it better to rent or buy a house"], examples: ["Should I rent or buy a house?", "Is it better to rent or buy a home?", "Is it better to rent or buy a house?"] },
  questions: [
    rentBuyLocationType,
    rentBuyMonthlyRent,
    rentBuyPropertyPrice,
    rentBuyDownPayment,
    rentBuyExpectedEmi,
    rentBuyMonthlyIncome,
    rentBuyMonthlyExpenses,
    rentBuyEmergencyFund,
    rentBuyIncomeStability,
    rentBuyPlannedStay,
    rentBuyFamilyNeed,
    rentBuyMaintenance,
    rentBuyOpportunityCost,
    rentBuyFlexibility,
    rentBuyDebtComfort,
    rentBuyLoanPreapproval,
    rentBuyNotes,
  ],
  deriveFacts: rentBuyFacts,
  weights: [
    { factorId: "affordability", label: "Affordability", weight: 16, baselineScore: 50 },
    { factorId: "longTermCost", label: "Long-term cost", weight: 16, baselineScore: 50 },
    { factorId: "flexibility", label: "Flexibility", weight: 13, baselineScore: 50 },
    { factorId: "stability", label: "Stability", weight: 13, baselineScore: 50 },
    { factorId: "wealthBuildingPotential", label: "Wealth-building potential", weight: 14, baselineScore: 50 },
    { factorId: "liquidityPressure", label: "Liquidity pressure", weight: 12, baselineScore: 50 },
    { factorId: "debtBurden", label: "Debt burden", weight: 8, baselineScore: 50 },
    { factorId: "lifestyleFit", label: "Lifestyle fit", weight: 8, baselineScore: 50 },
  ],
  rules: [
    { id: "rent-affordability", description: "Rent is the easier cash-flow fit when a mortgage EMI would be stretched.", when: { all: [{ fact: "emiToIncomeRatio", operator: "greater-than", value: 0.32 }] }, factorId: "affordability", scoreEffect: { operation: "subtract", value: 24 }, risk: buyRiskHighEmi },
    { id: "buy-affordability", description: "An affordable EMI supports buying.", when: { all: [{ fact: "emiToIncomeRatio", operator: "less-than-or-equal", value: 0.28 }] }, factorId: "affordability", scoreEffect: { operation: "add", value: 22 } },
    { id: "rent-short-stay", description: "A short stay favours renting.", when: { all: [{ fact: "plannedStayDuration", operator: "less-than", value: 5 }] }, factorId: "longTermCost", scoreEffect: { operation: "add", value: 24 }, risk: buyRiskShortStay },
    { id: "buy-long-stay", description: "A long stay supports buying.", when: { all: [{ fact: "plannedStayDuration", operator: "greater-than-or-equal", value: 7 }] }, factorId: "longTermCost", scoreEffect: { operation: "add", value: 24 } },
    { id: "rent-flexibility", description: "Flexibility preference supports renting.", when: { all: [{ fact: "flexibilityPreference", operator: "greater-than-or-equal", value: 4 }] }, factorId: "flexibility", scoreEffect: { operation: "add", value: 22 } },
    { id: "buy-stability", description: "Family stability need supports ownership.", when: { all: [{ fact: "familyStabilityNeed", operator: "greater-than-or-equal", value: 4 }] }, factorId: "stability", scoreEffect: { operation: "add", value: 20 } },
    { id: "buy-emergency-fund-weak", description: "A weak emergency fund weakens the buy case.", when: { all: [{ fact: "emergencyMonths", operator: "less-than", value: 6 }] }, factorId: "liquidityPressure", scoreEffect: { operation: "subtract", value: 30 }, risk: buyRiskWeakFund },
    { id: "buy-debt-pressure", description: "High EMI pressure weakens the buy case.", when: { all: [{ fact: "emiToIncomeRatio", operator: "greater-than", value: 0.32 }] }, factorId: "debtBurden", scoreEffect: { operation: "subtract", value: 28 }, risk: buyRiskHighEmi },
    { id: "rent-family-need", description: "High family stability need weakens renting.", when: { all: [{ fact: "familyStabilityNeed", operator: "greater-than-or-equal", value: 4 }] }, factorId: "lifestyleFit", scoreEffect: { operation: "subtract", value: 24 }, risk: rentRiskHighFamilyNeed },
    { id: "buy-wealth", description: "A longer stay can help ownership build more value.", when: { all: [{ fact: "plannedStayDuration", operator: "greater-than-or-equal", value: 7 }] }, factorId: "wealthBuildingPotential", scoreEffect: { operation: "add", value: 18 } },
    { id: "rent-wealth", description: "High opportunity cost can favour renting and investing the gap.", when: { all: [{ fact: "investmentOpportunityCost", operator: "greater-than-or-equal", value: 8 }] }, factorId: "wealthBuildingPotential", scoreEffect: { operation: "add", value: 18 } },
    { id: "buy-preapproval", description: "Pre-approval reduces execution uncertainty.", when: { all: [{ fact: "hasLoanPreapproval", operator: "equals", value: true }] }, factorId: "stability", scoreEffect: { operation: "add", value: 10 } },
    { id: "rent-location", description: "Metro or high-cost markets can favour renting for flexibility.", when: { all: [{ fact: "cityLocationType", operator: "equals", value: 1 }] }, factorId: "flexibility", scoreEffect: { operation: "add", value: 8 } },
  ],
  riskFactors: [buyRiskHighEmi, buyRiskShortStay, rentRiskHighFamilyNeed, buyRiskWeakFund],
  recommendations: [
    {
      id: "balanced",
      minScore: 0,
      maxScore: 100,
      when: { all: [{ fact: "financialBalance", operator: "greater-than-or-equal", value: 90 }] },
      title: "The rent-versus-buy decision is balanced",
      summary: "The financial and lifestyle trade-offs are close enough that a split or wait-and-prepare approach can make sense.",
      actions: ["Compare a full five-year cost picture", "Protect liquidity before committing", "Revisit once the stay horizon is clearer"],
    },
    { id: "rent", minScore: 0, maxScore: 100, when: { any: [{ fact: "plannedStayDuration", operator: "less-than", value: 5 }, { fact: "flexibilityPreference", operator: "greater-than-or-equal", value: 4 }, { fact: "emiToIncomeRatio", operator: "greater-than", value: 0.32 }, { fact: "emergencyMonths", operator: "less-than", value: 6 }] }, title: "Rent is the stronger fit", summary: "Flexibility, shorter stay plans, or affordability pressure currently favour renting.", actions: ["Keep renting", "Build the down-payment and emergency buffer", "Review again when the stay horizon is clearer"] },
    { id: "buy", minScore: 0, maxScore: 100, when: { all: [{ fact: "plannedStayDuration", operator: "greater-than-or-equal", value: 7 }, { fact: "incomeStability", operator: "greater-than-or-equal", value: 2 }, { fact: "emiToIncomeRatio", operator: "less-than-or-equal", value: 0.32 }, { fact: "emergencyMonths", operator: "greater-than-or-equal", value: 6 }] }, title: "Buying is the stronger fit", summary: "The current income stability, stay plan, and affordability support ownership.", actions: ["Get a written loan quote", "Keep a six-month emergency buffer", "Include maintenance and closing costs in the plan"] },
  ],
  actionPlanTemplates: [
    { id: "rent-action", minScore: 0, maxScore: 100, when: { any: [{ fact: "plannedStayDuration", operator: "less-than", value: 5 }, { fact: "flexibilityPreference", operator: "greater-than-or-equal", value: 4 }, { fact: "emiToIncomeRatio", operator: "greater-than", value: 0.32 }, { fact: "emergencyMonths", operator: "less-than", value: 6 }] }, actions: ["Keep your monthly housing commitment flexible", "Save the gap between rent and a potential EMI", "Track rent reviews and relocation timing", "Reassess if the stay horizon becomes longer"] },
    { id: "buy-action", minScore: 0, maxScore: 100, when: { all: [{ fact: "plannedStayDuration", operator: "greater-than-or-equal", value: 7 }, { fact: "incomeStability", operator: "greater-than-or-equal", value: 2 }, { fact: "emiToIncomeRatio", operator: "less-than-or-equal", value: 0.32 }, { fact: "emergencyMonths", operator: "greater-than-or-equal", value: 6 }] }, actions: ["Get the final loan quote in writing", "Budget for maintenance, taxes, and closing costs", "Keep a separate emergency fund after purchase", "Review title, society, and local legal checks carefully"] },
    { id: "wait-action", minScore: 0, maxScore: 100, when: { all: [{ fact: "financialBalance", operator: "greater-than-or-equal", value: 90 }] }, actions: ["Pause until the numbers are less sensitive", "Strengthen the emergency fund", "Compare rent and buy again after a few months", "Keep the decision reversible for now"] },
  ],
  relatedCalculators: ["rent-vs-buy-calculator", "home-affordability-calculator", "rental-yield-calculator", "emi-calculator"],
  relatedTools: ["percentage-calculator", "word-counter"],
  assumptions: ["This is educational decision support, not legal, real-estate, or financial advice.", "Rent growth, property appreciation, and opportunity cost are planning assumptions, not guarantees.", "Local taxes, transfer fees, maintenance, and vacancy risk can materially change the answer."],
  faqs: [
    { question: "Can renting be right even if buying looks cheaper?", answer: "Yes. Flexibility, relocation risk, and liquidity can outweigh a modest projected advantage." },
    { question: "Does a high score guarantee I should buy?", answer: "No. It means the current cash-flow, stay horizon, and lifestyle inputs look more supportive." },
  ],
  scenarios: [
    { id: "rent-longer-stay", label: "Longer stay", description: "See how a longer stay changes the result.", overrides: { plannedStayDuration: 10, flexibilityPreference: 2 } },
    { id: "rent-rent-pressure", label: "Higher rent", description: "Test the decision if rent rises.", overrides: { monthlyRent: 40_000 } },
    { id: "rent-buy-stronger", label: "Stronger buy case", description: "See how a stronger income and buffer affect the decision.", overrides: { monthlyIncome: 250_000, currentEmergencyFund: 1_500_000, downPaymentAvailable: 3_000_000, expectedLoanEmi: 45_000, plannedStayDuration: 12 } },
  ],
  scenarioVariables: rentBuyScenarioVariables,
  scoring: {
    options: [
      {
        id: "rent",
        label: "Rent",
        factors: [
          { id: "affordability", label: "Affordability", weight: 16, direction: "higher_better", evaluate: (answers) => rentAffordabilityScore(answers), explanation: "How comfortably renting fits the current income" },
          { id: "longTermCost", label: "Long-term cost", weight: 16, direction: "higher_better", evaluate: (answers) => rentLongTermCostScore(answers), explanation: "How rent compares with the longer ownership cost" },
          { id: "flexibility", label: "Flexibility", weight: 13, direction: "higher_better", evaluate: (answers) => rentFlexibilityScore(answers), explanation: "How much mobility the current plan needs" },
          { id: "stability", label: "Stability", weight: 13, direction: "higher_better", evaluate: (answers) => rentStabilityScore(answers), explanation: "How well renting fits the household stability picture" },
          { id: "wealthBuildingPotential", label: "Wealth-building potential", weight: 14, direction: "higher_better", evaluate: (answers) => rentWealthScore(answers), explanation: "How well renting leaves room to invest elsewhere" },
          { id: "liquidityPressure", label: "Liquidity pressure", weight: 12, direction: "higher_better", evaluate: (answers) => rentLiquidityScore(answers), explanation: "How much liquidity pressure the option avoids" },
          { id: "debtBurden", label: "Debt burden", weight: 8, direction: "higher_better", evaluate: (answers) => rentDebtScore(answers), explanation: "How much debt burden renting avoids" },
          { id: "lifestyleFit", label: "Lifestyle fit", weight: 8, direction: "higher_better", evaluate: (answers) => rentLifestyleScore(answers), explanation: "How well renting fits the current lifestyle need" },
        ],
      },
      {
        id: "buy",
        label: "Buy",
        factors: [
          { id: "affordability", label: "Affordability", weight: 16, direction: "higher_better", evaluate: (answers) => buyAffordabilityScore(answers), explanation: "How comfortably the EMI fits the current income" },
          { id: "longTermCost", label: "Long-term cost", weight: 16, direction: "higher_better", evaluate: (answers) => buyLongTermCostScore(answers), explanation: "How ownership compares over the planned stay" },
          { id: "flexibility", label: "Flexibility", weight: 13, direction: "higher_better", evaluate: (answers) => buyFlexibilityScore(answers), explanation: "How acceptable the reduced mobility is" },
          { id: "stability", label: "Stability", weight: 13, direction: "higher_better", evaluate: (answers) => buyStabilityScore(answers), explanation: "How well buying fits the household stability picture" },
          { id: "wealthBuildingPotential", label: "Wealth-building potential", weight: 14, direction: "higher_better", evaluate: (answers) => buyWealthScore(answers), explanation: "How well buying can build equity over time" },
          { id: "liquidityPressure", label: "Liquidity pressure", weight: 12, direction: "higher_better", evaluate: (answers) => buyLiquidityScore(answers), explanation: "How much liquidity remains after purchase" },
          { id: "debtBurden", label: "Debt burden", weight: 8, direction: "higher_better", evaluate: (answers) => buyDebtScore(answers), explanation: "How comfortable the debt load feels" },
          { id: "lifestyleFit", label: "Lifestyle fit", weight: 8, direction: "higher_better", evaluate: (answers) => buyLifestyleScore(answers), explanation: "How well ownership fits the lifestyle need" },
        ],
      },
    ],
  },
};

export const propertyDecisionWorkflows = [buyHouseWorkflow, rentVsBuyWorkflow];
