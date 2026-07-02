import type { DecisionWorkflow } from "../../types";
import {
  actionPlanTemplates,
  booleanAnswer,
  booleanQuestion,
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
  sliderQuestion,
  standardScoreBands,
  textQuestion,
} from "../workflowSupport";

const chargingRisk = risk("charging-access", "Charging access is unreliable", "Lack of dependable charging can add cost and daily friction.", "high", "Verify home, work, and nearby charging before choosing an EV.");
const evPaybackRisk = risk("long-ev-payback", "Long EV premium payback", "Expected energy savings may not recover the upfront premium during ownership.", "medium", "Compare current on-road prices and total ownership costs for both cars.");
const lowUsageRisk = risk("low-vehicle-use", "Low expected usage", "Low driving reduces the value and economic advantage of ownership.", "medium", "Compare taxis, rentals, subscriptions, or public transport first.");
const evScenarioVariables = [
  { id: "ev-usage", questionId: "monthlyKm", label: "Monthly kilometers", chips: [800, 1_250, 1_800] },
  { id: "ev-fuel", questionId: "petrolPrice", label: "Fuel price", chips: [95, 105, 125] },
  { id: "ev-electricity", questionId: "electricityPrice", label: "Electricity cost", chips: [7, 9, 12] },
  { id: "ev-premium", questionId: "evPremium", label: "Vehicle price difference", chips: [200_000, 300_000, 500_000] },
] as const;
const carScenarioVariables = [
  { id: "car-income", questionId: "monthlyIncome", label: "Monthly income", chips: [80_000, 100_000, 150_000] },
  { id: "car-price", questionId: "carPrice", label: "Car price", chips: [1_000_000, 1_200_000, 1_600_000] },
  { id: "car-rate", questionId: "interestRate", label: "Interest rate", chips: [8, 9, 11] },
  { id: "car-use", questionId: "monthlyUseDays", label: "Monthly use days", chips: [8, 18, 24] },
] as const;

export const evVsPetrolWorkflow: DecisionWorkflow = {
  id: "ev-vs-petrol", slug: "ev-vs-petrol", pluginId: "automobile", version: "1.0.0",
  title: "EV or petrol car?", category: "automobile",
  description: "Compare an EV and petrol car using existing running-cost calculations, charging access, usage, and ownership period.",
  aliases: ["EV vs petrol", "electric or petrol car", "choose electric car"],
  intent: { keywords: ["ev", "electric", "petrol", "car", "charging", "fuel"], aliases: ["ev vs petrol", "electric or petrol car"], examples: ["Should I buy an EV or petrol car?"] },
  questions: [
    currencyQuestion("evPremium", "EV price premium", 300_000, "Extra on-road cost versus the comparable petrol car."),
    numberQuestion("monthlyKm", "Expected driving per month", 1_250, 0, 10_000, "Use realistic annualised driving, not an exceptional month."),
    currencyQuestion("petrolPrice", "Petrol price per litre", 105, "Use a current local price.", 500),
    currencyQuestion("electricityPrice", "Electricity price per kWh", 9, "Use the expected blended home and public charging price.", 100),
    numberQuestion("petrolMileage", "Real-world petrol mileage", 15, 1, 100, "Use kilometres per litre."),
    numberQuestion("evEfficiency", "Real-world EV efficiency", 6, 1, 20, "Use kilometres per kWh."),
    durationQuestion("holdingYears", "Expected ownership period", 7, 1, 15, "Years you expect to retain the vehicle."),
    booleanQuestion("homeCharging", "Is reliable home charging available?", true, "Home charging usually improves cost and convenience."),
    sliderQuestion("chargingConfidence", "Confidence in charging access", 4, 1, 5, "Consider home, work, and regular routes."),
    textQuestion("vehicleNotes", "Vehicle or route constraints", "Optional notes about parking, range, or regular trips."),
  ],
  deriveFacts: (answers) => {
    const annualKm = numberAnswer(answers, "monthlyKm") * 12;
    const evPremium = numberAnswer(answers, "evPremium");
    const calculation = calculatorResult("ev-vs-petrol-savings-calculator", { distance: annualKm, petrolMileage: numberAnswer(answers, "petrolMileage"), petrolPrice: numberAnswer(answers, "petrolPrice"), evEfficiency: numberAnswer(answers, "evEfficiency"), electricityPrice: numberAnswer(answers, "electricityPrice"), evPremium });
    const paybackYears = calculation.secondaryResults.find(({ label }) => label === "Premium payback")?.value ?? 99;
    return { annualKm, annualSaving: calculation.error ? 0 : calculation.primaryResult.value, paybackYears: paybackYears > 0 ? paybackYears : 99, holdingYears: numberAnswer(answers, "holdingYears"), homeCharging: booleanAnswer(answers, "homeCharging"), chargingConfidence: numberAnswer(answers, "chargingConfidence") };
  },
  weights: [{ factorId: "economics", label: "Lifetime economics", weight: 40, baselineScore: 50 }, { factorId: "usage", label: "Driving intensity", weight: 20, baselineScore: 50 }, { factorId: "charging", label: "Charging fit", weight: 25, baselineScore: 50 }, { factorId: "horizon", label: "Ownership horizon", weight: 15, baselineScore: 50 }],
  rules: [
    { id: "ev-payback-good", description: "The EV premium pays back within six years.", when: { all: [{ fact: "paybackYears", operator: "less-than-or-equal", value: 6 }] }, factorId: "economics", scoreEffect: { operation: "add", value: 30 } },
    { id: "ev-payback-long", description: "The premium payback exceeds ten years.", when: { all: [{ fact: "paybackYears", operator: "greater-than", value: 10 }] }, factorId: "economics", scoreEffect: { operation: "subtract", value: 35 }, risk: evPaybackRisk },
    { id: "ev-use-high", description: "Higher annual driving improves EV economics.", when: { all: [{ fact: "annualKm", operator: "greater-than-or-equal", value: 12_000 }] }, factorId: "usage", scoreEffect: { operation: "add", value: 22 } },
    { id: "ev-use-low", description: "Low annual driving weakens EV payback.", when: { all: [{ fact: "annualKm", operator: "less-than", value: 8_000 }] }, factorId: "usage", scoreEffect: { operation: "subtract", value: 25 }, risk: lowUsageRisk },
    { id: "ev-home-charge", description: "Reliable home charging supports the EV choice.", when: { all: [{ fact: "homeCharging", operator: "equals", value: true }] }, factorId: "charging", scoreEffect: { operation: "add", value: 25 } },
    { id: "ev-no-home-charge", description: "No reliable home charging adds friction.", when: { all: [{ fact: "homeCharging", operator: "equals", value: false }] }, factorId: "charging", scoreEffect: { operation: "subtract", value: 30 }, risk: chargingRisk },
    { id: "ev-low-charge-confidence", description: "Charging availability is uncertain.", when: { all: [{ fact: "chargingConfidence", operator: "less-than-or-equal", value: 2 }] }, factorId: "charging", scoreEffect: { operation: "subtract", value: 20 }, risk: chargingRisk },
    { id: "ev-hold-long", description: "A long holding period gives more time to recover the premium.", when: { all: [{ fact: "holdingYears", operator: "greater-than-or-equal", value: 7 }] }, factorId: "horizon", scoreEffect: { operation: "add", value: 20 } },
  ],
  riskFactors: [chargingRisk, evPaybackRisk, lowUsageRisk],
  recommendations: [
    { id: "petrol-aligned", minScore: 0, maxScore: 39.99, title: "A petrol car is better aligned", summary: "Low usage, long premium payback, or charging constraints weaken the EV case.", actions: ["Compare efficient petrol options", "Revisit EVs when charging or usage changes"] },
    { id: "model-dependent", minScore: 40, maxScore: 64.99, title: "The answer depends on the exact models", summary: "The EV case is plausible but sensitive to price, charging, and actual driving.", actions: ["Get current on-road quotes", "Test the real route and charging plan"] },
    { id: "ev-aligned", minScore: 65, maxScore: 100, title: "An EV is better aligned", summary: "Usage, payback, charging access, and holding period support the EV option.", actions: ["Verify warranty and charging installation", "Compare insurance and resale assumptions"] },
  ],
  actionPlanTemplates: actionPlanTemplates("the EV-versus-petrol choice"),
  relatedCalculators: ["ev-vs-petrol-savings-calculator", "fuel-cost-calculator", "car-loan-calculator"], relatedTools: ["percentage-calculator"],
  assumptions: ["Running-cost savings come from the existing calculator engine.", "Battery health, insurance, maintenance, resale, and financing require model-specific checks.", "Fuel and electricity prices can change."],
  faqs: [{ question: "Is battery replacement included?", answer: "No. Verify model-specific battery warranty, expected degradation, and replacement exposure." }, { question: "Can an EV work without home charging?", answer: "Possibly, but the workflow treats unreliable charging as a material risk." }],
  scenarios: [
    { id: "ev-high-usage", label: "High usage", description: "Higher driving usually improves EV economics.", overrides: { monthlyKm: 1_800, holdingYears: 7 } },
    { id: "ev-cheap-charge", label: "Cheaper charging", description: "Test the impact of lower electricity cost.", overrides: { electricityPrice: 7, homeCharging: true } },
    { id: "ev-big-premium", label: "Higher premium", description: "Stress-test a more expensive EV model.", overrides: { evPremium: 500_000, chargingConfidence: 3 } },
  ],
  scenarioVariables: evScenarioVariables,
  scoreBands: standardScoreBands,
};

const carAffordabilityRisk = risk("car-affordability", "Car payment is too high", "The estimated car payment consumes too much monthly income.", "high", "Choose a lower price, larger safe down payment, or delay the purchase.");
const carLiquidityRisk = risk("car-liquidity", "Emergency reserve is too thin", "Buying would leave inadequate savings for essential shocks.", "high", "Preserve at least the selected emergency buffer before purchase.");

export const buyCarWorkflow: DecisionWorkflow = {
  id: "buy-car", slug: "buy-car", pluginId: "automobile", version: "1.0.0",
  title: "Should I buy a car now?", category: "automobile",
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
  weights: [{ factorId: "affordability", label: "Affordability", weight: 35, baselineScore: 50 }, { factorId: "liquidity", label: "Safety buffer", weight: 25, baselineScore: 50 }, { factorId: "debt", label: "Debt burden", weight: 20, baselineScore: 50 }, { factorId: "utility", label: "Expected utility", weight: 20, baselineScore: 50 }],
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
  recommendations: recommendationTemplates("buy the car"), actionPlanTemplates: actionPlanTemplates("the car purchase"),
  relatedCalculators: ["car-loan-calculator", "fuel-cost-calculator", "road-trip-cost-calculator"], relatedTools: ["percentage-calculator"],
  assumptions: ["Loan payment comes from the existing car-loan calculator.", "Insurance, maintenance, parking, depreciation, and repairs need separate estimates.", "Expected use should reflect normal months."],
  faqs: [{ question: "Does the score include depreciation?", answer: "The decision treats depreciation as an ownership concern, while the score focuses on affordability, resilience, and usefulness." }, { question: "Should I use emergency savings for the down payment?", answer: "The workflow assumes the emergency reserve remains available after purchase." }],
  scenarios: [
    { id: "car-better-use", label: "Stronger use case", description: "See how regular usage changes the score.", overrides: { monthlyUseDays: 24, needStrength: 5 } },
    { id: "car-tight-budget", label: "Tighter budget", description: "Stress-test a smaller cash buffer.", overrides: { emergencySavings: 200_000, downPayment: 150_000 } },
    { id: "car-higher-emi", label: "Higher EMI", description: "See the impact of a more expensive car.", overrides: { carPrice: 1_600_000, interestRate: 10.5 } },
  ],
  scenarioVariables: carScenarioVariables,
  scoreBands: standardScoreBands,
};

export const automobileDecisionWorkflows = [evVsPetrolWorkflow, buyCarWorkflow];
