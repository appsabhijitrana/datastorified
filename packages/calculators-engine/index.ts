export * from "./registry";

import { z } from "zod";
import { calculatorBySlug, calculators, type CalculatorDefinition, type CalculatorField } from "./registry";

const buildSchema = (fields: CalculatorField[]) => z.object(Object.fromEntries(fields.map((field) => {
  let schema = z.number({ invalid_type_error: `${field.label} is required.` }).finite(`${field.label} must be a valid number.`);
  if (field.min !== undefined) schema = schema.min(field.min, `${field.label} must be at least ${field.min}.`);
  if (field.max !== undefined) schema = schema.max(field.max, `${field.label} must be no more than ${field.max}.`);
  const validated: z.ZodTypeAny = field.input === "select" ? schema.refine((value) => field.options?.some((option) => option.value === value), `Choose a valid option for ${field.label.toLowerCase()}.`) : schema;
  return [field.key, validated];
})));
const calculatorSchemas = Object.fromEntries(calculators.map((calculator) => [calculator.slug, buildSchema(calculator.fields)])) as Record<string, z.ZodObject<Record<string, z.ZodTypeAny>>>;
export function validateCalculatorInputs(calculator: CalculatorDefinition, values: Record<string, number>): string[] { const parsed = calculatorSchemas[calculator.slug].safeParse(values); return parsed.success ? [] : [...new Set(parsed.error.issues.map((issue) => issue.message))]; }

export type ResultUnit = "currency" | "percent" | "number";
export type PrimaryResult = { label: string; value: number; unit: ResultUnit; suffix?: string };
export type SecondaryResult = { label: string; value: number; unit?: ResultUnit; suffix?: string };
export type CalculationResult = {
  primaryResult: PrimaryResult;
  secondaryResults: SecondaryResult[];
  chartData: Array<{ name: string; value: number }>;
  insight: string;
  warnings: string[];
  formula: string;
  assumptions: string[];
  error?: string;
};

const finite = (value: number) => Number.isFinite(value) ? value : 0;
const monthlyPayment = (principal: number, annualRate: number, years: number) => {
  const months = years * 12;
  const rate = annualRate / 1200;
  if (principal <= 0 || months <= 0) return 0;
  return Math.abs(rate) < 1e-10 ? principal / months : principal * rate * (1 + rate) ** months / ((1 + rate) ** months - 1);
};
const loanFromPayment = (payment: number, annualRate: number, years: number) => {
  const months = years * 12;
  const rate = annualRate / 1200;
  if (payment <= 0 || months <= 0) return 0;
  return Math.abs(rate) < 1e-10 ? payment * months : payment * ((1 + rate) ** months - 1) / (rate * (1 + rate) ** months);
};
const annuityDue = (monthly: number, annualRate: number, years: number) => {
  const months = years * 12;
  const rate = annualRate / 1200;
  return Math.abs(rate) < 1e-10 ? monthly * months : monthly * ((1 + rate) ** months - 1) / rate * (1 + rate);
};
const amortize = (balance: number, annualRate: number, payment: number, maxMonths = 1200) => {
  const rate = annualRate / 1200;
  let interest = 0;
  let month = 0;
  while (balance > 0.005 && month < maxMonths) {
    const charged = balance * rate;
    if (payment <= charged && rate > 0) return { months: maxMonths, interest, balance, repayable: false };
    interest += charged;
    balance = Math.max(0, balance + charged - payment);
    month += 1;
  }
  return { months: month, interest, balance, repayable: balance <= 0.005 };
};
const newRegimeTaxAY2026 = (income: number) => {
  const slabs = [[400_000, 800_000, .05], [800_000, 1_200_000, .10], [1_200_000, 1_600_000, .15], [1_600_000, 2_000_000, .20], [2_000_000, 2_400_000, .25], [2_400_000, Number.POSITIVE_INFINITY, .30]];
  let tax = slabs.reduce((total, [from, to, rate]) => total + Math.max(0, Math.min(income, to) - from) * rate, 0);
  if (income <= 1_200_000) tax = 0;
  else tax = Math.min(tax, income - 1_200_000);
  return tax * 1.04;
};
const isValidDate = (year: number, month: number, day: number) => {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};
const lengthFactors = [1, 1000, .01, .001, .3048, .0254, .9144, 1609.344];
const lengthSymbols = ["m", "km", "cm", "mm", "ft", "in", "yd", "mi"];

type ResultOptions = {
  unit?: ResultUnit;
  suffix?: string;
  secondary?: SecondaryResult[];
  chart?: Array<{ name: string; value: number }>;
  insight?: string;
  warnings?: string[];
  error?: string;
  label?: string;
};
const result = (definition: CalculatorDefinition | undefined, value: number, options: ResultOptions = {}): CalculationResult => ({
  primaryResult: { label: options.label ?? definition?.resultLabel ?? "Result", value: finite(value), unit: options.unit ?? "currency", suffix: options.suffix },
  secondaryResults: (options.secondary ?? []).map((item) => ({ ...item, value: finite(item.value) })),
  chartData: (options.chart ?? []).map((item) => ({ ...item, value: finite(item.value) })),
  insight: options.insight ?? "Adjust the inputs to compare another scenario.",
  warnings: [...(definition?.warnings ?? []), ...(options.warnings ?? [])],
  formula: definition?.formula ?? "",
  assumptions: definition?.assumptions ?? [],
  error: options.error,
});

export function calculate(slug: string, rawValues: Record<string, number>): CalculationResult {
  const definition = calculatorBySlug(slug);
  if (!definition) return result(undefined, 0, { error: "This calculator is not available." });
  const parsed = calculatorSchemas[slug].safeParse(rawValues);
  if (!parsed.success) return result(definition, 0, { error: parsed.error.issues[0]?.message ?? "Check your inputs." });
  const v = parsed.data as Record<string, number>;
  const money = (label: string, value: number): SecondaryResult => ({ label, value, unit: "currency" });
  const percent = (label: string, value: number): SecondaryResult => ({ label, value, unit: "percent" });
  const number = (label: string, value: number, suffix?: string): SecondaryResult => ({ label, value, unit: "number", suffix });

  switch (slug) {
    case "emi-calculator":
    case "personal-loan-calculator":
    case "car-loan-calculator": {
      const emi = monthlyPayment(v.principal, v.rate, v.years);
      const total = emi * v.years * 12;
      const interest = total - v.principal;
      return result(definition, emi, { secondary: [money("Total interest", interest), money("Total repayment", total)], chart: [{ name: "Principal", value: v.principal }, { name: "Interest", value: interest }], insight: `Interest is ${total ? Math.round(interest / total * 100) : 0}% of the estimated repayment.` });
    }
    case "loan-prepayment-calculator": {
      const emi = monthlyPayment(v.principal, v.rate, v.years);
      const base = amortize(v.principal, v.rate, emi);
      const accelerated = amortize(v.principal, v.rate, emi + v.extra);
      return result(definition, base.interest - accelerated.interest, { secondary: [number("Tenure saved", base.months - accelerated.months, "months"), money("New monthly payment", emi + v.extra)], chart: [{ name: "Original interest", value: base.interest }, { name: "After prepayment", value: accelerated.interest }], insight: `The extra payment may close the loan ${Math.max(0, base.months - accelerated.months)} months earlier.` });
    }
    case "loan-eligibility-calculator": {
      const available = Math.max(0, v.income * .45 - v.obligations);
      return result(definition, loanFromPayment(available, v.rate, v.years), { secondary: [money("Available EMI", available), money("Assumed debt limit", v.income * .45)], insight: "This planning estimate uses a 45% total debt-payment limit; lender rules differ." });
    }
    case "home-affordability-calculator": {
      const available = Math.max(0, v.income * .4 - v.obligations);
      const loan = loanFromPayment(available, v.rate, v.years);
      return result(definition, loan + v.savings, { secondary: [money("Estimated loan", loan), money("Down payment", v.savings)], chart: [{ name: "Loan", value: loan }, { name: "Down payment", value: v.savings }], insight: "The estimate keeps total monthly debt payments near 40% of household income." });
    }
    case "credit-card-interest-calculator":
    case "debt-payoff-calculator": {
      const payoff = amortize(v.balance, v.rate, v.payment);
      if (!payoff.repayable) return result(definition, v.balance * v.rate / 1200, { error: "The monthly payment must exceed monthly interest to reduce the balance.", warnings: ["At this payment, the balance does not amortise."], secondary: [money("Monthly payment", v.payment)] });
      if (slug === "credit-card-interest-calculator") return result(definition, v.balance * v.rate / 1200, { secondary: [number("Estimated payoff", payoff.months, "months"), money("Total interest", payoff.interest)], insight: `At a fixed ₹${v.payment.toLocaleString("en-IN")} payment, payoff takes about ${payoff.months} months.` });
      return result(definition, payoff.months, { unit: "number", suffix: "months", secondary: [money("Total interest", payoff.interest), money("Total paid", v.balance + payoff.interest)], insight: `The fixed payment clears the debt in about ${payoff.months} months if no new debt is added.` });
    }
    case "emergency-fund-calculator": return result(definition, v.expense * v.months, { secondary: [money("Monthly essentials", v.expense), number("Coverage", v.months, "months")], insight: v.months >= 6 ? "This covers at least six months of essential expenses." : "Three to six months is a common starting range; personal needs vary." });
    case "net-worth-calculator": return result(definition, v.assets - v.liabilities, { secondary: [money("Assets", v.assets), money("Liabilities", v.liabilities)], chart: [{ name: "Assets", value: v.assets }, { name: "Liabilities", value: v.liabilities }], insight: v.assets >= v.liabilities ? "Assets exceed liabilities; track the trend over time." : "Liabilities exceed assets; high-cost debt is a useful first focus." });

    case "sip-calculator": {
      const value = annuityDue(v.monthly, v.rate, v.years);
      const invested = v.monthly * v.years * 12;
      return result(definition, value, { secondary: [money("Amount invested", invested), money("Estimated gains", value - invested)], chart: [{ name: "Invested", value: invested }, { name: "Gains", value: value - invested }], insight: "Compare conservative, likely, and optimistic return assumptions rather than relying on one forecast." });
    }
    case "lumpsum-calculator": {
      const value = v.principal * (1 + v.rate / 100) ** v.years;
      return result(definition, value, { secondary: [money("Amount invested", v.principal), money("Estimated gain", value - v.principal)], chart: [{ name: "Invested", value: v.principal }, { name: "Gain", value: value - v.principal }] });
    }
    case "swp-calculator": {
      let balance = v.principal;
      let withdrawn = 0;
      for (let month = 0; month < v.years * 12 && balance > 0; month += 1) { balance *= 1 + v.rate / 1200; const amount = Math.min(balance, v.withdrawal); balance -= amount; withdrawn += amount; }
      return result(definition, balance, { secondary: [money("Total withdrawn", withdrawn), money("Starting corpus", v.principal)], chart: [{ name: "Withdrawn", value: withdrawn }, { name: "Remaining", value: balance }], warnings: balance <= 0 ? ["The corpus is exhausted before the selected period ends."] : [] });
    }
    case "cagr-calculator":
    case "gold-investment-return-calculator": {
      const start = slug === "cagr-calculator" ? v.start : v.invested;
      const end = slug === "cagr-calculator" ? v.end : v.current;
      const value = ((end / start) ** (1 / v.years) - 1) * 100;
      return result(definition, value, { unit: "percent", secondary: [money("Absolute gain", end - start), percent("Total return", (end / start - 1) * 100)], insight: "Annualised return smooths the whole holding period into one comparable rate." });
    }
    case "xirr-calculator": {
      const cashflows = [{ t: 0, amount: -v.initial }, { t: 1, amount: -v.middle }, { t: v.years, amount: v.final }];
      let rate = .1;
      for (let iteration = 0; iteration < 100; iteration += 1) {
        const f = cashflows.reduce((sum, flow) => sum + flow.amount / (1 + rate) ** flow.t, 0);
        const derivative = cashflows.reduce((sum, flow) => sum - flow.t * flow.amount / (1 + rate) ** (flow.t + 1), 0);
        if (Math.abs(derivative) < 1e-12) break;
        const next = Math.max(-.9999, rate - f / derivative);
        if (Math.abs(next - rate) < 1e-10) { rate = next; break; }
        rate = next;
      }
      return result(definition, rate * 100, { unit: "percent", secondary: [money("Total invested", v.initial + v.middle), money("Final value", v.final)], insight: "XIRR accounts for when each cash flow occurs, unlike simple total return." });
    }
    case "fd-calculator": {
      const value = v.principal * (1 + v.rate / 400) ** (4 * v.years);
      return result(definition, value, { secondary: [money("Interest earned", value - v.principal), money("Deposit", v.principal)], chart: [{ name: "Deposit", value: v.principal }, { name: "Interest", value: value - v.principal }] });
    }
    case "rd-calculator": {
      const value = annuityDue(v.monthly, v.rate, v.years);
      const deposited = v.monthly * v.years * 12;
      return result(definition, value, { secondary: [money("Deposited", deposited), money("Interest earned", value - deposited)], chart: [{ name: "Deposited", value: deposited }, { name: "Interest", value: value - deposited }] });
    }
    case "ppf-calculator": {
      let value = 0;
      for (let year = 0; year < v.years; year += 1) value = (value + v.annual) * (1 + v.rate / 100);
      const deposited = v.annual * v.years;
      return result(definition, value, { secondary: [money("Total contributions", deposited), money("Estimated interest", value - deposited)], chart: [{ name: "Contributions", value: deposited }, { name: "Interest", value: value - deposited }] });
    }
    case "epf-calculator": {
      let balance = 0; let salary = v.basic; let contributed = 0;
      for (let month = 0; month < v.years * 12; month += 1) { if (month > 0 && month % 12 === 0) salary *= 1 + v.salaryGrowth / 100; const contribution = salary * (v.employeeRate + v.employerRate) / 100; contributed += contribution; balance = (balance + contribution) * (1 + v.return / 1200); }
      return result(definition, balance, { secondary: [money("Estimated contributions", contributed), money("Estimated interest", balance - contributed)], chart: [{ name: "Contributions", value: contributed }, { name: "Interest", value: balance - contributed }] });
    }
    case "nps-calculator": {
      const corpus = annuityDue(v.monthly, v.rate, v.years);
      const annuity = corpus * v.annuity / 100;
      return result(definition, corpus, { secondary: [money("Annuity allocation", annuity), money("Lump-sum allocation", corpus - annuity), money("Estimated monthly annuity", annuity * v.annuityRate / 1200)], chart: [{ name: "Annuity", value: annuity }, { name: "Lump sum", value: corpus - annuity }] });
    }
    case "inflation-calculator": {
      const value = v.amount * (1 + v.rate / 100) ** v.years;
      return result(definition, value, { secondary: [money("Increase in cost", value - v.amount), money("Current cost", v.amount)], chart: [{ name: "Current", value: v.amount }, { name: "Increase", value: value - v.amount }] });
    }
    case "goal-planner-calculator": {
      const futureGoal = v.goal * (1 + v.inflation / 100) ** v.years;
      const existingFuture = v.existing * (1 + v.return / 100) ** v.years;
      const shortfall = Math.max(0, futureGoal - existingFuture);
      const factor = annuityDue(1, v.return, v.years);
      return result(definition, factor ? shortfall / factor : 0, { secondary: [money("Inflation-adjusted goal", futureGoal), money("Future value of existing savings", existingFuture), money("Funding shortfall", shortfall)] });
    }
    case "retirement-calculator": {
      const futureExpense = v.expense * (1 + v.inflation / 100) ** v.years;
      const realRate = (1 + v.return / 100) / (1 + v.inflation / 100) - 1;
      const corpus = Math.abs(realRate) < 1e-9 ? futureExpense * 12 * v.retirementYears : futureExpense * 12 * (1 - (1 + realRate) ** -v.retirementYears) / realRate;
      return result(definition, corpus, { secondary: [money("Monthly expense at retirement", futureExpense), percent("Real return", realRate * 100)] });
    }
    case "fire-calculator": {
      const target = v.expense * 12 / (v.withdrawalRate / 100);
      return result(definition, target, { secondary: [money("Current corpus", v.current), money("Funding gap", Math.max(0, target - v.current)), percent("Progress", target ? v.current / target * 100 : 0)], chart: [{ name: "Current", value: v.current }, { name: "Gap", value: Math.max(0, target - v.current) }] });
    }

    case "gst-calculator":
    case "gst-inclusive-exclusive-calculator": {
      if (v.mode === 1) { const base = v.amount / (1 + v.rate / 100); const tax = v.amount - base; return result(definition, base, { label: slug === "gst-calculator" ? "Base price before GST" : "Exclusive price", secondary: [money("GST included", tax), money("Inclusive price", v.amount)], chart: [{ name: "Base", value: base }, { name: "GST", value: tax }] }); }
      const tax = v.amount * v.rate / 100;
      return result(definition, v.amount + tax, { label: slug === "gst-calculator" ? "Total with GST" : "Inclusive price", secondary: [money("GST amount", tax), money("Exclusive price", v.amount)], chart: [{ name: "Base", value: v.amount }, { name: "GST", value: tax }] });
    }
    case "income-tax-calculator": {
      const tax = newRegimeTaxAY2026(v.income);
      return result(definition, tax, { secondary: [money("Monthly equivalent", tax / 12), percent("Effective rate", v.income ? tax / v.income * 100 : 0)], insight: v.income <= 1_200_000 ? "Eligible normal taxable income up to ₹12 lakh can receive the section 87A rebate." : "The estimate includes slab tax, rebate marginal relief, and 4% cess." });
    }
    case "hra-calculator": {
      const rentLess = Math.max(0, v.rent - v.basic * .1);
      const exempt = Math.max(0, Math.min(v.hra, rentLess, v.basic * (v.metro === 1 ? .5 : .4)));
      return result(definition, exempt, { secondary: [money("Taxable HRA", Math.max(0, v.hra - exempt)), money("Rent less 10% of basic", rentLess)] });
    }
    case "salary-in-hand-calculator": {
      const basic = v.gross * v.basicPercent / 100;
      const pf = basic * v.employeePf / 100;
      const tax = newRegimeTaxAY2026(v.gross);
      const annual = v.gross - pf - tax - v.otherDeductions * 12;
      return result(definition, Math.max(0, annual / 12), { secondary: [money("Monthly gross", v.gross / 12), money("Annual employee PF", pf), money("Estimated annual tax", tax)] });
    }
    case "gratuity-calculator": {
      const eligibleYears = v.years + (v.extraMonths >= 6 ? 1 : 0);
      const divisor = v.covered === 1 ? 26 : 30;
      return result(definition, 15 / divisor * v.salary * eligibleYears, { secondary: [number("Eligible service", eligibleYears, "years"), money("Last basic + DA", v.salary)] });
    }

    case "gold-loan-calculator": {
      const metalValue = v.weight * v.price * v.purity / 24;
      return result(definition, metalValue * v.ltv / 100, { secondary: [money("Estimated metal value", metalValue), percent("LTV used", v.ltv)] });
    }
    case "gold-purity-calculator": return result(definition, v.weight * v.karat / 24, { unit: "number", suffix: "g", secondary: [percent("Fineness", v.karat / 24 * 100), number("Item weight", v.weight, "g")] });
    case "gold-value-calculator": {
      const gross = v.weight * v.price * v.purity / 24;
      return result(definition, gross * (1 - v.deduction / 100), { secondary: [money("Gross metal value", gross), money("Estimated deduction", gross * v.deduction / 100)] });
    }

    case "rent-vs-buy-calculator": {
      const loan = Math.max(0, v.property - v.downPayment);
      const emi = monthlyPayment(loan, v.rate, v.years);
      let rentPaid = 0; let monthlyRent = v.rent;
      for (let month = 0; month < v.years * 12; month += 1) { if (month > 0 && month % 12 === 0) monthlyRent *= 1 + v.rentGrowth / 100; rentPaid += monthlyRent; }
      const futureProperty = v.property * (1 + v.appreciation / 100) ** v.years;
      const ownershipCash = v.downPayment + emi * v.years * 12;
      const advantage = futureProperty - ownershipCash + rentPaid;
      return result(definition, advantage, { secondary: [money("Rent paid", rentPaid), money("Ownership cash outflow", ownershipCash), money("Projected property value", futureProperty)], chart: [{ name: "Rent paid", value: rentPaid }, { name: "Buy cash outflow", value: ownershipCash }] });
    }
    case "rental-yield-calculator": {
      const grossRent = v.rent * 12;
      const netRent = grossRent * (1 - v.vacancy / 100) - v.annualCosts;
      return result(definition, netRent / v.property * 100, { unit: "percent", secondary: [percent("Gross yield", grossRent / v.property * 100), money("Net annual rent", netRent)] });
    }
    case "stamp-duty-calculator": {
      const stamp = v.property * v.stampRate / 100; const registration = v.property * v.registrationRate / 100;
      return result(definition, stamp + registration + v.fixed, { secondary: [money("Stamp duty", stamp), money("Registration", registration), money("Other charges", v.fixed)] });
    }
    case "property-appreciation-calculator": {
      const value = v.property * (1 + v.rate / 100) ** v.years;
      return result(definition, value, { secondary: [money("Estimated gain", value - v.property), percent("Total return", v.property ? (value / v.property - 1) * 100 : 0)] });
    }

    case "fuel-cost-calculator": {
      const litres = v.distance / v.mileage;
      return result(definition, litres * v.price, { secondary: [number("Fuel required", litres, "L"), money("Cost per kilometre", v.price / v.mileage)] });
    }
    case "mileage-calculator": return result(definition, v.distance / v.fuel, { unit: "number", suffix: "km/L", secondary: [money("Fuel cost", v.fuel * v.price), money("Cost per kilometre", v.distance ? v.fuel * v.price / v.distance : 0)] });
    case "ev-vs-petrol-savings-calculator": {
      const petrol = v.distance / v.petrolMileage * v.petrolPrice; const ev = v.distance / v.evEfficiency * v.electricityPrice; const saving = petrol - ev;
      return result(definition, saving, { secondary: [money("Petrol energy cost", petrol), money("EV energy cost", ev), number("Premium payback", saving > 0 ? v.evPremium / saving : 0, "years")], chart: [{ name: "Petrol", value: petrol }, { name: "EV", value: ev }] });
    }
    case "road-trip-cost-calculator": {
      const fuel = v.distance / v.mileage * v.fuelPrice; const food = v.people * v.foodPerPerson; const total = fuel + v.tolls + food + v.stay;
      return result(definition, total, { secondary: [money("Fuel", fuel), money("Tolls", v.tolls), money("Food", food), money("Stay", v.stay), money("Cost per traveller", total / v.people)], chart: [{ name: "Fuel", value: fuel }, { name: "Tolls", value: v.tolls }, { name: "Food", value: food }, { name: "Stay", value: v.stay }] });
    }

    case "profit-margin-calculator": {
      const profit = v.revenue - v.cost;
      return result(definition, v.revenue ? profit / v.revenue * 100 : 0, { unit: "percent", secondary: [money("Profit", profit), percent("Markup", v.cost ? profit / v.cost * 100 : 0)] });
    }
    case "break-even-calculator": {
      const contribution = v.price - v.variable;
      if (contribution <= 0) return result(definition, 0, { unit: "number", error: "Selling price must exceed variable cost to reach break-even." });
      const units = Math.ceil(v.fixed / contribution);
      return result(definition, units, { unit: "number", suffix: "units", secondary: [money("Break-even revenue", units * v.price), money("Contribution per unit", contribution)] });
    }
    case "roi-calculator": return result(definition, (v.gain - v.cost) / v.cost * 100, { unit: "percent", secondary: [money("Net gain", v.gain - v.cost), money("Investment cost", v.cost)] });
    case "startup-runway-calculator": {
      const burn = v.expense - v.revenue;
      if (burn <= 0) return result(definition, 0, { unit: "number", suffix: "months", secondary: [money("Monthly net burn", burn)], insight: "Current recurring revenue covers the entered operating expenses." });
      return result(definition, v.cash / burn, { unit: "number", suffix: "months", secondary: [money("Monthly net burn", burn), money("Cash available", v.cash)] });
    }

    case "bmi-calculator": {
      const bmi = v.weight / (v.height / 100) ** 2;
      const insight = bmi < 18.5 ? "Below the standard adult screening range." : bmi < 25 ? "Within the standard adult screening range." : bmi < 30 ? "Within the standard adult overweight screening range." : "Within the standard adult obesity screening range.";
      return result(definition, bmi, { unit: "number", suffix: "BMI", secondary: [number("Healthy range begins", 18.5), number("Healthy range ends", 24.9)], insight });
    }
    case "bmr-calculator": {
      const bmr = 10 * v.weight + 6.25 * v.height - 5 * v.age + (v.sex === 1 ? 5 : -161);
      return result(definition, bmr, { unit: "number", suffix: "kcal/day", secondary: [number("Per hour", bmr / 24, "kcal")] });
    }
    case "tdee-calculator": {
      const bmr = 10 * v.weight + 6.25 * v.height - 5 * v.age + (v.sex === 1 ? 5 : -161);
      return result(definition, bmr * v.activity, { unit: "number", suffix: "kcal/day", secondary: [number("Estimated BMR", bmr, "kcal/day"), number("Activity factor", v.activity)] });
    }
    case "water-intake-calculator": {
      const litres = (v.weight * 35 + v.exercise / 30 * 350 + (v.hotClimate ? 500 : 0)) / 1000;
      return result(definition, litres, { unit: "number", suffix: "L/day", secondary: [number("Base hydration", v.weight * .035, "L"), number("Activity allowance", v.exercise / 30 * .35, "L"), number("Climate allowance", v.hotClimate ? .5 : 0, "L")] });
    }

    case "age-calculator": {
      if (!isValidDate(v.birthYear, v.birthMonth, v.birthDay) || !isValidDate(v.currentYear, v.currentMonth, v.currentDay)) return result(definition, 0, { unit: "number", error: "Enter valid calendar dates." });
      const birth = new Date(Date.UTC(v.birthYear, v.birthMonth - 1, v.birthDay)); const current = new Date(Date.UTC(v.currentYear, v.currentMonth - 1, v.currentDay));
      if (birth > current) return result(definition, 0, { unit: "number", error: "Birth date cannot be after the as-of date." });
      let years = v.currentYear - v.birthYear; let months = v.currentMonth - v.birthMonth; let days = v.currentDay - v.birthDay;
      if (days < 0) { days += new Date(Date.UTC(v.currentYear, v.currentMonth - 1, 0)).getUTCDate(); months -= 1; }
      if (months < 0) { months += 12; years -= 1; }
      return result(definition, years, { unit: "number", suffix: "years", secondary: [number("Additional months", months, "months"), number("Additional days", days, "days")] });
    }
    case "percentage-calculator": return result(definition, v.value * v.percentage / 100, { unit: "number", secondary: [percent("Percentage", v.percentage), number("Original value", v.value)] });
    case "discount-calculator": {
      const value = v.price * (1 - v.discount / 100);
      return result(definition, value, { secondary: [money("Savings", v.price - value), money("Original price", v.price)], chart: [{ name: "Sale price", value }, { name: "Savings", value: v.price - value }] });
    }
    case "unit-converter": {
      const from = Math.trunc(v.fromUnit); const to = Math.trunc(v.toUnit); const value = v.value * (lengthFactors[from] ?? 1) / (lengthFactors[to] ?? 1);
      return result(definition, value, { unit: "number", suffix: lengthSymbols[to] ?? "m", secondary: [number("Source value", v.value, lengthSymbols[from] ?? "m")] });
    }
    case "currency-converter": return result(definition, v.amount * v.rate, { secondary: [number("USD amount", v.amount, "USD"), number("Static rate", v.rate, "INR/USD")], insight: "The result uses the manually entered static rate; no live market data is fetched." });
    default: return result(definition, 0, { error: "This calculator is not implemented." });
  }
}
