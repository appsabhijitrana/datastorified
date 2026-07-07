import type { DecisionAnswers, DecisionWorkflow } from "../../types";
import { clamp } from "../../utils/math";
import {
  actionPlanTemplates,
  calculatorResult,
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

const evChargingRisk = risk("ev-no-home-charging", "Home charging is unavailable", "Without dependable home charging, EV ownership can become inconvenient and expensive.", "high", "Verify home or workplace charging before committing to an EV.");
const evHighwayRisk = risk("ev-highway-frequency", "Frequent long highway trips", "Long highway trips reduce the convenience and energy advantage of an EV.", "medium", "Recheck route density, charging stops, and real-world range needs.");
const petrolRunningCostRisk = risk("petrol-running-cost", "Petrol running cost is high", "High monthly usage and fuel prices can make petrol ownership expensive over time.", "high", "Compare the monthly fuel bill against an EV charging plan.");
const evBudgetRisk = risk("ev-tight-budget", "Budget is very tight", "A tight budget can force compromises on model choice, charging, and ownership comfort.", "high", "Leave more budget headroom or wait for a safer purchase point.");

const usagePatternQuestion = selectQuestion("usagePattern", "City / highway usage", 2, [["Mostly city", 1], ["Mixed", 2], ["Mostly highway", 3]], "City driving usually favors EVs more than frequent highway travel.");
const homeChargingQuestion = selectQuestion("homeChargingAccess", "Charging access at home", 2, [["None", 0], ["Limited / shared", 1], ["Reliable", 2]], "Reliable home charging is the strongest EV convenience signal.");
const workChargingQuestion = selectQuestion("workChargingAccess", "Charging access near work", 1, [["None", 0], ["Occasional", 1], ["Reliable", 2]], "Work charging can reduce daily charging friction.");
const longTripQuestion = selectQuestion("longDistanceTravelFrequency", "Long-distance travel frequency", 2, [["Rarely", 1], ["Sometimes", 2], ["Often", 3]], "Frequent highway trips change the EV-versus-petrol trade-off.");

const evScenarioVariables = [
  { id: "ev-monthly-distance", questionId: "monthlyDistance", label: "Monthly distance", chips: [600, 1_200, 2_000] },
  { id: "ev-fuel-price", questionId: "petrolPrice", label: "Fuel price", chips: [95, 110, 130] },
  { id: "ev-electricity", questionId: "electricityCost", label: "Electricity cost", chips: [7, 9, 12] },
  { id: "ev-budget", questionId: "vehicleBudget", label: "Car budget", chips: [1_000_000, 1_500_000, 2_000_000] },
  { id: "ev-charging", questionId: "homeChargingAccess", label: "Charging availability", chips: [0, 1, 2] },
  { id: "ev-highway", questionId: "longDistanceTravelFrequency", label: "Highway trip frequency", chips: [1, 2, 3] },
] as const;

const lowUsageRisk = risk("car-low-usage", "Expected car use is low", "If the car will be used infrequently, the ownership cost may not feel worthwhile.", "medium", "Compare ownership against rental, taxi, or shared mobility for low-usage months.");

function evFacts(answers: Readonly<DecisionAnswers>) {
  const monthlyDistance = numberAnswer(answers, "monthlyDistance");
  const annualKm = monthlyDistance * 12;
  const vehicleBudget = numberAnswer(answers, "vehicleBudget");
  const homeChargingAccess = numberAnswer(answers, "homeChargingAccess");
  const workChargingAccess = numberAnswer(answers, "workChargingAccess");
  const longDistanceTravelFrequency = numberAnswer(answers, "longDistanceTravelFrequency");
  const usagePattern = numberAnswer(answers, "usagePattern");
  const petrolPrice = numberAnswer(answers, "petrolPrice", 110);
  const electricityCost = numberAnswer(answers, "electricityCost", 9);
  const annualFuelCost = calculatorResult("fuel-cost-calculator", { distance: annualKm, mileage: 15, fuelPrice: petrolPrice }).primaryResult.value;
  const evPremium = clamp(vehicleBudget * 0.18, 200_000, 900_000);
  const evRunningCost = calculatorResult("ev-vs-petrol-savings-calculator", { distance: annualKm, petrolMileage: 15, petrolPrice, evEfficiency: 6, electricityPrice: electricityCost, evPremium });
  const annualSaving = evRunningCost.error ? 0 : evRunningCost.primaryResult.value;
  const paybackYears = evRunningCost.error ? 99 : clamp(Number(evRunningCost.secondaryResults.find(({ label }) => label === "Premium payback")?.value ?? 99), 0, 99);
  const chargingAccessScore = clamp(homeChargingAccess * 2 + workChargingAccess, 0, 5);
  const budgetTight = vehicleBudget <= 1_200_000;
  return {
    monthlyDistance,
    annualKm,
    usagePattern,
    homeChargingAccess,
    workChargingAccess,
    vehicleBudget,
    resaleConcern: numberAnswer(answers, "resaleConcern"),
    runningCostPriority: numberAnswer(answers, "runningCostPriority"),
    longDistanceTravelFrequency,
    maintenanceConcern: numberAnswer(answers, "maintenanceConcern"),
    environmentalPriority: numberAnswer(answers, "environmentalPriority"),
    petrolPrice,
    electricityCost,
    annualFuelCost,
    annualSaving,
    paybackYears,
    chargingAccessScore,
    budgetTight,
    homeCharging: homeChargingAccess >= 2,
    workCharging: workChargingAccess >= 2,
  };
}

function evUpfrontAffordability(answers: Readonly<DecisionAnswers>): number {
  const budget = numberAnswer(answers, "vehicleBudget");
  return clamp(100 - (budget <= 1_200_000 ? 35 : 0) + (budget >= 1_800_000 ? 18 : 0), 0, 100);
}

function evRunningCostScore(answers: Readonly<DecisionAnswers>): number {
  const facts = evFacts(answers);
  return clamp(40 + (facts.monthlyDistance / 400) + (facts.runningCostPriority * 8) + (facts.petrolPrice >= 110 ? 18 : 0) - (facts.electricityCost >= 11 ? 10 : 0), 0, 100);
}

function evConvenienceScore(answers: Readonly<DecisionAnswers>): number {
  const facts = evFacts(answers);
  return clamp((facts.usagePattern <= 1 ? 88 : facts.usagePattern === 2 ? 68 : 42) + (facts.workChargingAccess * 6), 0, 100);
}

function evChargingPracticalityScore(answers: Readonly<DecisionAnswers>): number {
  const facts = evFacts(answers);
  return clamp((facts.homeChargingAccess * 35) + (facts.workChargingAccess * 12), 0, 100);
}

function evLongDistanceSuitabilityScore(answers: Readonly<DecisionAnswers>): number {
  const facts = evFacts(answers);
  return clamp(100 - (facts.longDistanceTravelFrequency * 22) - (facts.usagePattern === 3 ? 20 : 0), 0, 100);
}

function evMaintenanceScore(answers: Readonly<DecisionAnswers>): number {
  const facts = evFacts(answers);
  return clamp(60 + (facts.maintenanceConcern * 8), 0, 100);
}

function evResaleRiskScore(answers: Readonly<DecisionAnswers>): number {
  const facts = evFacts(answers);
  return clamp(70 - (facts.resaleConcern * 10), 0, 100);
}

function evEnvironmentalFitScore(answers: Readonly<DecisionAnswers>): number {
  const facts = evFacts(answers);
  return clamp(45 + (facts.environmentalPriority * 12), 0, 100);
}

function petrolUpfrontAffordability(answers: Readonly<DecisionAnswers>): number {
  const budget = numberAnswer(answers, "vehicleBudget");
  return clamp((budget <= 1_200_000 ? 90 : 55) + (budget >= 1_800_000 ? -10 : 0), 0, 100);
}

function petrolRunningCostScore(answers: Readonly<DecisionAnswers>): number {
  const facts = evFacts(answers);
  return clamp(100 - (facts.monthlyDistance / 350) - (facts.runningCostPriority * 4) + (facts.homeChargingAccess >= 2 ? -8 : 0), 0, 100);
}

function petrolConvenienceScore(answers: Readonly<DecisionAnswers>): number {
  const facts = evFacts(answers);
  return clamp((facts.usagePattern === 3 ? 90 : facts.usagePattern === 2 ? 72 : 50) + (facts.longDistanceTravelFrequency * 8), 0, 100);
}

function petrolChargingPracticalityScore(answers: Readonly<DecisionAnswers>): number {
  const facts = evFacts(answers);
  return clamp(85 - ((facts.homeChargingAccess * 20) + (facts.workChargingAccess * 10)), 0, 100);
}

function petrolLongDistanceSuitabilityScore(answers: Readonly<DecisionAnswers>): number {
  const facts = evFacts(answers);
  return clamp(55 + (facts.longDistanceTravelFrequency * 20) + (facts.usagePattern === 3 ? 15 : 0), 0, 100);
}

function petrolMaintenanceScore(answers: Readonly<DecisionAnswers>): number {
  const facts = evFacts(answers);
  return clamp(85 - (facts.maintenanceConcern * 8), 0, 100);
}

function petrolResaleRiskScore(answers: Readonly<DecisionAnswers>): number {
  const facts = evFacts(answers);
  return clamp(55 + (facts.resaleConcern * 8), 0, 100);
}

function petrolEnvironmentalFitScore(answers: Readonly<DecisionAnswers>): number {
  const facts = evFacts(answers);
  return clamp(100 - (facts.environmentalPriority * 12), 0, 100);
}

export const evVsPetrolWorkflow: DecisionWorkflow = {
  id: "ev-vs-petrol",
  slug: "ev-vs-petrol",
  pluginId: "automobile",
  version: "1.1.0",
  title: "EV or petrol car?",
  category: "automobile",
  description: "Compare an EV and petrol car using monthly driving, city or highway use, charging access, budget, resale concern, and environmental fit.",
  aliases: ["EV vs petrol", "electric or petrol car", "choose electric car", "should I buy an ev or petrol car"],
  intent: { keywords: ["ev", "electric", "petrol", "car", "charging", "fuel"], aliases: ["ev vs petrol", "electric or petrol car"], examples: ["Should I buy an EV or petrol car?"] },
  questions: [
    numberQuestion("monthlyDistance", "Monthly driving distance", 1_200, 0, 30_000, "Use the average month, not a peak month."),
    usagePatternQuestion,
    homeChargingQuestion,
    workChargingQuestion,
    currencyQuestion("vehicleBudget", "Vehicle budget", 1_500_000, "Use the total amount you are comfortable spending.", 20_000_000),
    sliderQuestion("resaleConcern", "How much do you care about resale risk?", 3, 1, 5, "Higher values mean resale value matters more."),
    sliderQuestion("runningCostPriority", "How important is low running cost?", 4, 1, 5, "Higher values mean monthly fuel savings matter more."),
    longTripQuestion,
    sliderQuestion("maintenanceConcern", "How concerned are you about maintenance?", 3, 1, 5, "Higher values mean lower maintenance is more important."),
    sliderQuestion("environmentalPriority", "How important is environmental fit?", 3, 1, 5, "Higher values mean lower emissions matter more."),
  ],
  deriveFacts: (answers) => {
    const facts = evFacts(answers);
    return facts;
  },
  weights: [
    { factorId: "affordability", label: "Upfront affordability", weight: 14, baselineScore: 50 },
    { factorId: "runningCost", label: "Running cost", weight: 18, baselineScore: 50 },
    { factorId: "convenience", label: "Convenience", weight: 14, baselineScore: 50 },
    { factorId: "chargingPracticality", label: "Charging practicality", weight: 14, baselineScore: 50 },
    { factorId: "longDistanceSuitability", label: "Long-distance suitability", weight: 14, baselineScore: 50 },
    { factorId: "maintenance", label: "Maintenance", weight: 10, baselineScore: 50 },
    { factorId: "resaleRisk", label: "Resale risk", weight: 8, baselineScore: 50 },
    { factorId: "environmentalFit", label: "Environmental fit", weight: 8, baselineScore: 50 },
  ],
  rules: [
    { id: "ev-high-usage", description: "High monthly usage and city driving support EV economics.", when: { all: [{ fact: "monthlyDistance", operator: "greater-than-or-equal", value: 1_500 }, { fact: "usagePattern", operator: "less-than-or-equal", value: 2 }] }, factorId: "runningCost", scoreEffect: { operation: "add", value: 26 } },
    { id: "ev-home-charge", description: "Reliable home charging supports the EV choice.", when: { all: [{ fact: "homeChargingAccess", operator: "greater-than-or-equal", value: 2 }] }, factorId: "chargingPracticality", scoreEffect: { operation: "add", value: 25 } },
    { id: "ev-work-charge", description: "Charging near work reduces daily friction.", when: { all: [{ fact: "workChargingAccess", operator: "greater-than-or-equal", value: 2 }] }, factorId: "convenience", scoreEffect: { operation: "add", value: 12 } },
    { id: "ev-city-driving", description: "City-heavy usage improves EV suitability.", when: { all: [{ fact: "usagePattern", operator: "equals", value: 1 }] }, factorId: "convenience", scoreEffect: { operation: "add", value: 18 } },
    { id: "ev-highway-penalty", description: "Frequent highway trips weaken EV suitability.", when: { all: [{ fact: "longDistanceTravelFrequency", operator: "greater-than-or-equal", value: 3 }] }, factorId: "longDistanceSuitability", scoreEffect: { operation: "subtract", value: 28 }, risk: evHighwayRisk },
    { id: "ev-budget-tight", description: "A very tight budget weakens the EV case.", when: { all: [{ fact: "budgetTight", operator: "equals", value: true }] }, factorId: "affordability", scoreEffect: { operation: "subtract", value: 30 }, risk: evBudgetRisk },
    { id: "petrol-high-running", description: "High running cost makes the EV case stronger.", when: { all: [{ fact: "annualFuelCost", operator: "greater-than", value: 180_000 }] }, factorId: "runningCost", scoreEffect: { operation: "add", value: 24 }, risk: petrolRunningCostRisk },
    { id: "ev-maintenance", description: "Higher maintenance concern supports EV ownership.", when: { all: [{ fact: "maintenanceConcern", operator: "greater-than-or-equal", value: 4 }] }, factorId: "maintenance", scoreEffect: { operation: "add", value: 12 } },
    { id: "ev-resale", description: "High resale concern weakens the EV case slightly.", when: { all: [{ fact: "resaleConcern", operator: "greater-than-or-equal", value: 4 }] }, factorId: "resaleRisk", scoreEffect: { operation: "subtract", value: 14 } },
    { id: "ev-environment", description: "Environmental priority supports EV ownership.", when: { all: [{ fact: "environmentalPriority", operator: "greater-than-or-equal", value: 4 }] }, factorId: "environmentalFit", scoreEffect: { operation: "add", value: 16 } },
    { id: "ev-payback-good", description: "The EV premium pays back within a reasonable period.", when: { all: [{ fact: "paybackYears", operator: "less-than-or-equal", value: 6 }] }, factorId: "runningCost", scoreEffect: { operation: "add", value: 18 } },
    { id: "ev-payback-long", description: "A long payback weakens the EV case.", when: { all: [{ fact: "paybackYears", operator: "greater-than", value: 10 }] }, factorId: "runningCost", scoreEffect: { operation: "subtract", value: 18 }, risk: evBudgetRisk },
  ],
  riskFactors: [evChargingRisk, evHighwayRisk, petrolRunningCostRisk, evBudgetRisk],
  recommendations: [
    {
      id: "petrol-aligned",
      minScore: 0,
      maxScore: 39.99,
      title: "A petrol vehicle is better aligned",
      summary: "Low usage, frequent highway travel, or charging constraints weaken the EV case.",
      actions: ["Compare efficient petrol options", "Revisit EVs when charging or usage changes"],
    },
    {
      id: "balanced",
      minScore: 40,
      maxScore: 64.99,
      title: "The EV-versus-petrol decision is balanced",
      summary: "Usage and infrastructure are mixed, so the exact model, route pattern, and charging plan matter more.",
      actions: ["Compare exact on-road quotes", "Test the real route and charging plan"],
    },
    {
      id: "ev-aligned",
      minScore: 65,
      maxScore: 100,
      title: "An electric vehicle is better aligned",
      summary: "High usage, reliable charging, and city driving support the EV case.",
      actions: ["Verify charger installation and warranty terms", "Compare insurance, range, and resale assumptions"],
    },
  ],
  actionPlanTemplates: [
    { id: "ev-checklist", minScore: 65, maxScore: 100, actions: ["Confirm home charging access", "Check real-world range on your route", "Compare charging installation costs", "Review warranty, service, and insurance details"] },
    { id: "petrol-checklist", minScore: 0, maxScore: 39.99, actions: ["Shortlist efficient petrol models", "Compare fuel and service bills", "Check resale and maintenance estimates", "Confirm the purchase only after full on-road quotes"] },
    { id: "compare-checklist", minScore: 40, maxScore: 64.99, actions: ["Compare both options with exact quotes", "Stress-test a long highway route", "Recheck charging availability at home and work", "Decide after the next real driving cycle"] },
  ],
  relatedCalculators: ["ev-vs-petrol-savings-calculator", "fuel-cost-calculator", "car-loan-calculator"],
  relatedTools: ["percentage-calculator"],
  assumptions: ["Running-cost savings come from the existing calculator engine.", "Battery health, insurance, maintenance, resale, and financing require model-specific checks.", "Fuel and electricity prices can change.", "This is educational decision support, not vehicle, legal, or financial advice."],
  faqs: [{ question: "Is battery replacement included?", answer: "No. Verify model-specific battery warranty, expected degradation, and replacement exposure." }, { question: "Can an EV work without home charging?", answer: "Possibly, but the workflow treats unreliable charging as a material risk." }],
  scenarios: [
    { id: "ev-high-usage", label: "High usage", description: "Higher driving usually improves EV economics.", overrides: { monthlyDistance: 2_000, usagePattern: 1, homeChargingAccess: 2, longDistanceTravelFrequency: 1 } },
    { id: "ev-cheap-charge", label: "Cheaper charging", description: "Test the impact of lower electricity cost.", overrides: { electricityCost: 7, homeChargingAccess: 2, workChargingAccess: 2 } },
    { id: "ev-big-budget", label: "Higher budget", description: "Stress-test a more comfortable purchase budget.", overrides: { vehicleBudget: 2_000_000, resaleConcern: 4, environmentalPriority: 5 } },
  ],
  scenarioVariables: evScenarioVariables,
  scoreBands: standardScoreBands,
  scoring: {
    options: [
      {
        id: "electric-vehicle",
        label: "Electric Vehicle",
        factors: [
          { id: "affordability", label: "Upfront affordability", weight: 14, direction: "higher_better", evaluate: evUpfrontAffordability, explanation: "How comfortably the budget supports an EV" },
          { id: "runningCost", label: "Running cost", weight: 18, direction: "higher_better", evaluate: evRunningCostScore, explanation: "How much EV charging saves on a monthly basis" },
          { id: "convenience", label: "Convenience", weight: 14, direction: "higher_better", evaluate: evConvenienceScore, explanation: "How easy EV ownership feels in daily use" },
          { id: "chargingPracticality", label: "Charging practicality", weight: 14, direction: "higher_better", evaluate: evChargingPracticalityScore, explanation: "How realistic charging is for this routine" },
          { id: "longDistanceSuitability", label: "Long-distance suitability", weight: 14, direction: "higher_better", evaluate: evLongDistanceSuitabilityScore, explanation: "How well the car fits longer highway trips" },
          { id: "maintenance", label: "Maintenance", weight: 10, direction: "higher_better", evaluate: evMaintenanceScore, explanation: "How much EV maintenance simplicity matters" },
          { id: "resaleRisk", label: "Resale risk", weight: 8, direction: "higher_better", evaluate: evResaleRiskScore, explanation: "How comfortable you are with resale uncertainty" },
          { id: "environmentalFit", label: "Environmental fit", weight: 8, direction: "higher_better", evaluate: evEnvironmentalFitScore, explanation: "How strongly environmental goals matter" },
        ],
      },
      {
        id: "petrol-vehicle",
        label: "Petrol Vehicle",
        factors: [
          { id: "affordability", label: "Upfront affordability", weight: 14, direction: "higher_better", evaluate: petrolUpfrontAffordability, explanation: "How comfortably the budget supports a petrol car" },
          { id: "runningCost", label: "Running cost", weight: 18, direction: "higher_better", evaluate: petrolRunningCostScore, explanation: "How affordable petrol fuel and upkeep are over time" },
          { id: "convenience", label: "Convenience", weight: 14, direction: "higher_better", evaluate: petrolConvenienceScore, explanation: "How easy the car feels for mixed or highway driving" },
          { id: "chargingPracticality", label: "Charging practicality", weight: 14, direction: "higher_better", evaluate: petrolChargingPracticalityScore, explanation: "How little charging infrastructure matters" },
          { id: "longDistanceSuitability", label: "Long-distance suitability", weight: 14, direction: "higher_better", evaluate: petrolLongDistanceSuitabilityScore, explanation: "How well the car handles long highway trips" },
          { id: "maintenance", label: "Maintenance", weight: 10, direction: "higher_better", evaluate: petrolMaintenanceScore, explanation: "How predictable petrol maintenance feels" },
          { id: "resaleRisk", label: "Resale risk", weight: 8, direction: "higher_better", evaluate: petrolResaleRiskScore, explanation: "How stable petrol resale feels relative to the EV choice" },
          { id: "environmentalFit", label: "Environmental fit", weight: 8, direction: "higher_better", evaluate: petrolEnvironmentalFitScore, explanation: "How well petrol aligns with environmental goals" },
        ],
      },
    ],
  },
};

const carAffordabilityRisk = risk("car-affordability", "Car payment is too high", "The estimated car payment consumes too much monthly income.", "high", "Choose a lower price, larger safe down payment, or delay the purchase.");
const carLiquidityRisk = risk("car-liquidity", "Emergency reserve is too thin", "Buying would leave inadequate savings for essential shocks.", "high", "Preserve at least the selected emergency buffer before purchase.");

export const buyCarWorkflow: DecisionWorkflow = {
  id: "buy-car",
  slug: "buy-car",
  pluginId: "automobile",
  version: "1.0.0",
  title: "Should I buy a car now?",
  category: "automobile",
  description: "Balance usefulness and calculator-estimated affordability against debt, liquidity, and ownership costs.",
  aliases: ["buy a car", "purchase a vehicle", "can I afford a car"],
  intent: { keywords: ["buy", "car", "vehicle", "loan", "afford", "purchase"], aliases: ["buy a car", "purchase a vehicle"], examples: ["Should I buy a car now?"] },
  questions: [
    currencyQuestion("monthlyIncome", "Monthly take-home income", 100_000, "Use stable recurring income."),
    currencyQuestion("carPrice", "On-road car price", 1_200_000, "Include registration and taxes."),
    currencyQuestion("downPayment", "Available down payment", 300_000, "Do not use emergency savings."),
    currencyQuestion("existingEmi", "Existing monthly debt payments", 10_000, "Include all current EMIs."),
    percentageQuestion("interestRate", "Expected car-loan rate", 9, "Use a current written quote.", 40),
    durationQuestion("tenure", "Loan tenure", 5, 1, 8, "Expected repayment period."),
    currencyQuestion("monthlyExpenses", "Essential monthly expenses", 50_000, "Core expenses excluding the new car."),
    currencyQuestion("emergencySavings", "Savings remaining after purchase", 400_000, "Accessible reserve after down payment."),
    numberQuestion("monthlyUseDays", "Expected meaningful use per month", 18, 0, 31, "Days when the car solves a real transport need."),
    sliderQuestion("needStrength", "Strength of the transport need", 3, 1, 5, "5 means the car solves an essential recurring need."),
    textQuestion("alternativeNotes", "Alternatives considered", "Optional notes on public transport, taxis, rental, or car sharing."),
  ],
  deriveFacts: (answers) => {
    const loan = Math.max(0, numberAnswer(answers, "carPrice") - numberAnswer(answers, "downPayment"));
    const emi = calculatorValue("car-loan-calculator", { principal: loan, rate: numberAnswer(answers, "interestRate"), years: numberAnswer(answers, "tenure") });
    const income = numberAnswer(answers, "monthlyIncome");
    return { emi, emiToIncomeRatio: ratio(emi, income), totalDebtRatio: ratio(emi + numberAnswer(answers, "existingEmi"), income), emergencyMonths: ratio(numberAnswer(answers, "emergencySavings"), numberAnswer(answers, "monthlyExpenses")), monthlyUseDays: numberAnswer(answers, "monthlyUseDays"), needStrength: numberAnswer(answers, "needStrength") };
  },
  weights: [
    { factorId: "affordability", label: "Affordability", weight: 35, baselineScore: 50 },
    { factorId: "liquidity", label: "Safety buffer", weight: 25, baselineScore: 50 },
    { factorId: "debt", label: "Debt burden", weight: 20, baselineScore: 50 },
    { factorId: "utility", label: "Expected utility", weight: 20, baselineScore: 50 },
  ],
  rules: [
    { id: "car-emi-high", description: "Car EMI exceeds 18% of income.", when: { all: [{ fact: "emiToIncomeRatio", operator: "greater-than", value: 0.18 }] }, factorId: "affordability", scoreEffect: { operation: "subtract", value: 35 }, risk: carAffordabilityRisk },
    { id: "car-emi-safe", description: "Car EMI is within a cautious share of income.", when: { all: [{ fact: "emiToIncomeRatio", operator: "less-than-or-equal", value: 0.12 }] }, factorId: "affordability", scoreEffect: { operation: "add", value: 25 } },
    { id: "car-debt-high", description: "Total debt payments exceed 40% of income.", when: { all: [{ fact: "totalDebtRatio", operator: "greater-than", value: 0.4 }] }, factorId: "debt", scoreEffect: { operation: "subtract", value: 35 }, risk: carAffordabilityRisk },
    { id: "car-buffer-low", description: "Post-purchase savings cover fewer than six months.", when: { all: [{ fact: "emergencyMonths", operator: "less-than", value: 6 }] }, factorId: "liquidity", scoreEffect: { operation: "subtract", value: 35 }, risk: carLiquidityRisk },
    { id: "car-use-high", description: "Frequent use improves ownership utility.", when: { all: [{ fact: "monthlyUseDays", operator: "greater-than-or-equal", value: 16 }] }, factorId: "utility", scoreEffect: { operation: "add", value: 22 } },
    { id: "car-need-strong", description: "The car solves a strong recurring need.", when: { all: [{ fact: "needStrength", operator: "greater-than-or-equal", value: 4 }] }, factorId: "utility", scoreEffect: { operation: "add", value: 18 } },
    { id: "car-use-low", description: "Low expected use weakens ownership value.", when: { all: [{ fact: "monthlyUseDays", operator: "less-than", value: 8 }] }, factorId: "utility", scoreEffect: { operation: "subtract", value: 25 }, risk: lowUsageRisk },
  ],
  riskFactors: [carAffordabilityRisk, carLiquidityRisk, lowUsageRisk],
  recommendations: recommendationTemplates("buy the car"),
  actionPlanTemplates: actionPlanTemplates("the car purchase"),
  relatedCalculators: ["car-loan-calculator", "fuel-cost-calculator", "road-trip-cost-calculator"],
  relatedTools: ["percentage-calculator"],
  assumptions: ["Loan payment comes from the existing car-loan calculator.", "Insurance, maintenance, parking, depreciation, and repairs need separate estimates.", "Expected use should reflect normal months."],
  faqs: [{ question: "Does the score include depreciation?", answer: "The decision treats depreciation as an ownership concern, while the score focuses on affordability, resilience, and usefulness." }, { question: "Should I use emergency savings for the down payment?", answer: "The workflow assumes the emergency reserve remains available after purchase." }],
  scenarios: [
    { id: "car-better-use", label: "Stronger use case", description: "See how regular usage changes the score.", overrides: { monthlyUseDays: 24, needStrength: 5 } },
    { id: "car-tight-budget", label: "Tighter budget", description: "Stress-test a smaller cash buffer.", overrides: { emergencySavings: 200_000, downPayment: 150_000 } },
    { id: "car-higher-emi", label: "Higher EMI", description: "See the impact of a more expensive car.", overrides: { carPrice: 1_600_000, interestRate: 10.5 } },
  ],
  scenarioVariables: [
    { id: "car-income", questionId: "monthlyIncome", label: "Monthly income", chips: [80_000, 100_000, 150_000] },
    { id: "car-price", questionId: "carPrice", label: "Car price", chips: [1_000_000, 1_200_000, 1_600_000] },
    { id: "car-rate", questionId: "interestRate", label: "Interest rate", chips: [8, 9, 11] },
    { id: "car-use", questionId: "monthlyUseDays", label: "Monthly use days", chips: [8, 18, 24] },
  ],
  scoreBands: standardScoreBands,
};

export const automobileDecisionWorkflows = [evVsPetrolWorkflow, buyCarWorkflow];
