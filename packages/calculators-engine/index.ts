export * from "./registry";

export type ResultUnit = "currency" | "percent" | "number";
export type SecondaryResult = { label: string; value: number; unit?: ResultUnit; suffix?: string };
export type CalculationResult = {
  value: number;
  label?: string;
  suffix?: string;
  secondary: SecondaryResult[];
  unit: ResultUnit;
  insight: string;
  chart?: Array<{ name: string; value: number }>;
  error?: string;
};

const monthlyPayment = (principal: number, annualRate: number, years: number) => {
  const months = years * 12;
  if (principal <= 0 || months <= 0) return 0;
  const monthlyRate = annualRate / 1200;
  return monthlyRate === 0
    ? principal / months
    : principal * monthlyRate * (1 + monthlyRate) ** months / ((1 + monthlyRate) ** months - 1);
};

const loanFromPayment = (payment: number, annualRate: number, years: number) => {
  const months = years * 12;
  if (payment <= 0 || months <= 0) return 0;
  const monthlyRate = annualRate / 1200;
  return monthlyRate === 0
    ? payment * months
    : payment * ((1 + monthlyRate) ** months - 1) / (monthlyRate * (1 + monthlyRate) ** months);
};

const safe = (value: number) => Number.isFinite(value) ? value : 0;

const newRegimeTaxAY2026 = (income: number) => {
  const slabs = [
    { from: 400000, to: 800000, rate: 0.05 },
    { from: 800000, to: 1200000, rate: 0.10 },
    { from: 1200000, to: 1600000, rate: 0.15 },
    { from: 1600000, to: 2000000, rate: 0.20 },
    { from: 2000000, to: 2400000, rate: 0.25 },
    { from: 2400000, to: Number.POSITIVE_INFINITY, rate: 0.30 },
  ];
  let tax = slabs.reduce((total, slab) => total + Math.max(0, Math.min(income, slab.to) - slab.from) * slab.rate, 0);
  if (income <= 1200000) tax = 0;
  else tax = Math.min(tax, income - 1200000); // Section 87A marginal relief near the rebate threshold.
  return tax * 1.04;
};

const lengthFactorsInMetres = [1, 1000, 0.01, 0.001, 0.3048, 0.0254, 0.9144, 1609.344];
const lengthSymbols = ["m", "km", "cm", "mm", "ft", "in", "yd", "mi"];
const lengthNames = ["metres", "kilometres", "centimetres", "millimetres", "feet", "inches", "yards", "miles"];

const isValidDate = (year: number, month: number, day: number) => {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

export function calculate(slug: string, rawValues: Record<string, number>): CalculationResult {
  const v = Object.fromEntries(Object.entries(rawValues).map(([key, value]) => [key, safe(value)]));
  let value = 0;
  let label: string | undefined;
  let suffix: string | undefined;
  let secondary: SecondaryResult[] = [];
  let unit: ResultUnit = "currency";
  let insight = "Small changes today can compound into meaningful progress.";
  let chart: CalculationResult["chart"];
  let error: string | undefined;

  switch (slug) {
    case "emi-calculator": {
      value = monthlyPayment(v.principal, v.rate, v.years);
      const total = value * v.years * 12;
      const interest = total - v.principal;
      secondary = [{ label: "Total interest", value: interest }, { label: "Total repayment", value: total }];
      chart = [{ name: "Principal", value: v.principal }, { name: "Interest", value: interest }];
      insight = `Interest represents ${total > 0 ? Math.round(interest / total * 100) : 0}% of the estimated total repayment.`;
      break;
    }
    case "sip-calculator": {
      const monthlyRate = v.rate / 1200;
      const months = v.years * 12;
      value = monthlyRate === 0 ? v.monthly * months : v.monthly * ((1 + monthlyRate) ** months - 1) / monthlyRate * (1 + monthlyRate);
      const invested = v.monthly * months;
      const gains = value - invested;
      secondary = [{ label: "Amount invested", value: invested }, { label: "Estimated gains", value: gains }];
      chart = [{ name: "Invested", value: invested }, { name: "Estimated gains", value: gains }];
      insight = `At the assumed return, estimated gains make up ${value > 0 ? Math.round(gains / value * 100) : 0}% of the projected value. Returns are not guaranteed.`;
      break;
    }
    case "fd-calculator": {
      value = v.principal * (1 + v.rate / 400) ** (4 * v.years);
      const interest = value - v.principal;
      secondary = [{ label: "Interest earned", value: interest }, { label: "Deposit amount", value: v.principal }];
      chart = [{ name: "Deposit", value: v.principal }, { name: "Interest", value: interest }];
      insight = "This estimate assumes quarterly compounding and no premature-withdrawal penalty or tax deduction.";
      break;
    }
    case "cagr-calculator": {
      value = v.start > 0 && v.years > 0 ? ((v.end / v.start) ** (1 / v.years) - 1) * 100 : 0;
      unit = "percent";
      secondary = [{ label: "Absolute gain", value: v.end - v.start, unit: "currency" }, { label: "Total return", value: v.start > 0 ? (v.end / v.start - 1) * 100 : 0, unit: "percent" }];
      insight = value >= 0 ? "CAGR smooths the entire period into one comparable annual growth rate." : "The negative CAGR reflects an annualised decline over the selected period.";
      break;
    }
    case "inflation-calculator": {
      value = v.amount * (1 + v.rate / 100) ** v.years;
      const increase = value - v.amount;
      secondary = [{ label: "Increase in cost", value: increase }, { label: "Current cost", value: v.amount }];
      chart = [{ name: "Current cost", value: v.amount }, { name: "Inflation increase", value: increase }];
      insight = `At ${v.rate}% inflation, the same purchase is estimated to cost ${v.amount > 0 ? (value / v.amount).toFixed(2) : "0"}× as much.`;
      break;
    }
    case "retirement-calculator": {
      const futureMonthlyExpense = v.expense * (1 + v.inflation / 100) ** v.years;
      const realRate = (1 + v.return / 100) / (1 + v.inflation / 100) - 1;
      value = Math.abs(realRate) < 0.000001
        ? futureMonthlyExpense * 12 * v.retirementYears
        : futureMonthlyExpense * 12 * (1 - (1 + realRate) ** -v.retirementYears) / realRate;
      secondary = [{ label: "Monthly expense at retirement", value: futureMonthlyExpense }, { label: "Real return", value: realRate * 100, unit: "percent" }];
      insight = realRate > 0 ? "Your assumed return is above inflation, reducing the starting corpus needed for the spending period." : "Your assumed return does not beat inflation, so the target corpus needs extra room.";
      break;
    }
    case "emergency-fund-calculator": {
      value = v.expense * v.months;
      secondary = [{ label: "Monthly essentials", value: v.expense }, { label: "Coverage", value: v.months, unit: "number", suffix: "months" }];
      insight = v.months >= 6 ? "This provides at least six months of essential-expense coverage." : "A three-to-six-month buffer is a common starting point; your circumstances may need more.";
      break;
    }
    case "net-worth-calculator": {
      value = v.assets - v.liabilities;
      secondary = [{ label: "Total assets", value: v.assets }, { label: "Total liabilities", value: v.liabilities }];
      chart = [{ name: "Assets", value: v.assets }, { name: "Liabilities", value: v.liabilities }];
      insight = value >= 0 ? "Your assets exceed your liabilities. Tracking this number over time matters more than a single snapshot." : "Your liabilities currently exceed your assets; prioritising high-cost debt can improve the balance.";
      break;
    }
    case "loan-eligibility-calculator": {
      const availableEmi = Math.max(0, v.income * 0.45 - v.obligations);
      value = loanFromPayment(availableEmi, v.rate, v.years);
      secondary = [{ label: "Estimated available EMI", value: availableEmi }, { label: "Debt-payment limit", value: v.income * 0.45 }];
      insight = availableEmi > 0 ? "This planning estimate caps total monthly debt payments at 45% of net income; lenders use their own eligibility rules." : "Existing obligations already meet or exceed the assumed debt-payment limit.";
      break;
    }
    case "home-affordability-calculator": {
      const availableEmi = Math.max(0, v.income * 0.4 - v.obligations);
      const loan = loanFromPayment(availableEmi, v.rate, v.years);
      value = loan + v.savings;
      secondary = [{ label: "Estimated loan capacity", value: loan }, { label: "Down payment", value: v.savings }];
      chart = [{ name: "Loan", value: loan }, { name: "Down payment", value: v.savings }];
      insight = "This keeps total EMIs near 40% of monthly income. Registration, furnishing, maintenance, and emergency reserves are not included.";
      break;
    }
    case "gst-calculator": {
      if (v.mode === 1) {
        const base = v.rate === 0 ? v.amount : v.amount / (1 + v.rate / 100);
        const tax = v.amount - base;
        value = base;
        label = "Base price before GST";
        secondary = [{ label: "GST included", value: tax }, { label: "Inclusive price", value: v.amount }];
        chart = [{ name: "Base price", value: base }, { name: "GST", value: tax }];
        insight = "GST has been extracted from an amount that already includes tax.";
      } else {
        const tax = v.amount * v.rate / 100;
        value = v.amount + tax;
        label = "Total with GST";
        secondary = [{ label: "GST amount", value: tax }, { label: "Base price", value: v.amount }];
        chart = [{ name: "Base price", value: v.amount }, { name: "GST", value: tax }];
        insight = "GST has been added to the base amount using the selected rate.";
      }
      break;
    }
    case "income-tax-calculator": {
      value = newRegimeTaxAY2026(v.income);
      secondary = [{ label: "Monthly equivalent", value: value / 12 }, { label: "Effective rate", value: v.income > 0 ? value / v.income * 100 : 0, unit: "percent" }];
      insight = v.income <= 1200000 ? "For eligible resident individuals, the section 87A rebate can reduce tax on normal taxable income up to ₹12 lakh to zero." : "This AY 2026–27 estimate includes new-regime slabs, rebate marginal relief and 4% cess, but excludes surcharge and special-rate income.";
      break;
    }
    case "hra-calculator": {
      const rentLessTenPercent = Math.max(0, v.rent - v.basic * 0.1);
      value = Math.max(0, Math.min(v.hra, rentLessTenPercent, v.basic * (v.metro === 1 ? 0.5 : 0.4)));
      secondary = [{ label: "Taxable HRA", value: Math.max(0, v.hra - value) }, { label: "Rent − 10% of basic", value: rentLessTenPercent }];
      insight = `The exemption is the lowest of the three statutory limits, using ${v.metro === 1 ? "50%" : "40%"} of basic salary for the selected location.`;
      break;
    }
    case "age-calculator": {
      const birthValid = isValidDate(v.birthYear, v.birthMonth, v.birthDay);
      const currentValid = isValidDate(v.currentYear, v.currentMonth, v.currentDay);
      const birth = new Date(Date.UTC(v.birthYear, v.birthMonth - 1, v.birthDay));
      const current = new Date(Date.UTC(v.currentYear, v.currentMonth - 1, v.currentDay));
      if (!birthValid || !currentValid) {
        error = "Enter valid calendar dates.";
      } else if (birth > current) {
        error = "Birth date cannot be after the as-of date.";
      } else {
        let years = v.currentYear - v.birthYear;
        let months = v.currentMonth - v.birthMonth;
        let days = v.currentDay - v.birthDay;
        if (days < 0) {
          const daysInPreviousMonth = new Date(Date.UTC(v.currentYear, v.currentMonth - 1, 0)).getUTCDate();
          days += daysInPreviousMonth;
          months -= 1;
        }
        if (months < 0) {
          months += 12;
          years -= 1;
        }
        value = years;
        suffix = "years";
        secondary = [{ label: "Additional months", value: months, unit: "number", suffix: "months" }, { label: "Additional days", value: days, unit: "number", suffix: "days" }];
        insight = `The selected dates are ${years} years, ${months} months, and ${days} days apart.`;
      }
      unit = "number";
      break;
    }
    case "percentage-calculator": {
      value = v.value * v.percentage / 100;
      unit = "number";
      secondary = [{ label: "Percentage used", value: v.percentage, unit: "percent" }, { label: "Original value", value: v.value, unit: "number" }];
      insight = `${v.percentage}% of ${v.value.toLocaleString("en-IN")} is ${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}.`;
      break;
    }
    case "discount-calculator": {
      value = v.price * (1 - v.discount / 100);
      const savings = v.price - value;
      secondary = [{ label: "You save", value: savings }, { label: "Original price", value: v.price }];
      chart = [{ name: "Sale price", value }, { name: "Savings", value: savings }];
      insight = `You keep ${v.discount}% of the original price as savings.`;
      break;
    }
    case "bmi-calculator": {
      value = v.weight / (v.height / 100) ** 2;
      unit = "number";
      suffix = "BMI";
      insight = value < 18.5 ? "This is below the standard adult BMI screening range." : value < 25 ? "This is within the standard adult BMI screening range." : value < 30 ? "This is within the standard overweight screening range." : "This is within the standard obesity screening range. BMI is not a diagnosis.";
      secondary = [{ label: "Healthy range begins", value: 18.5, unit: "number" }, { label: "Healthy range ends", value: 24.9, unit: "number" }];
      break;
    }
    case "fuel-cost-calculator": {
      const litres = v.distance / v.mileage;
      value = litres * v.price;
      secondary = [{ label: "Fuel needed", value: litres, unit: "number", suffix: "L" }, { label: "Cost per km", value: v.mileage > 0 ? v.price / v.mileage : 0 }];
      insight = `The trip needs about ${litres.toLocaleString("en-IN", { maximumFractionDigits: 2 })} litres at the entered mileage.`;
      break;
    }
    case "unit-converter": {
      const from = Math.trunc(v.fromUnit);
      const to = Math.trunc(v.toUnit);
      value = v.value * (lengthFactorsInMetres[from] ?? 1) / (lengthFactorsInMetres[to] ?? 1);
      unit = "number";
      suffix = lengthSymbols[to] ?? "m";
      secondary = [{ label: "Source value", value: v.value, unit: "number", suffix: lengthSymbols[from] ?? "m" }];
      insight = `${v.value.toLocaleString("en-IN")} ${lengthNames[from] ?? "metres"} equals ${value.toLocaleString("en-IN", { maximumFractionDigits: 6 })} ${lengthNames[to] ?? "metres"}.`;
      break;
    }
    case "currency-converter": {
      value = v.amount * v.rate;
      secondary = [{ label: "USD amount", value: v.amount, unit: "number", suffix: "USD" }, { label: "Manual rate", value: v.rate, unit: "number", suffix: "INR/USD" }];
      insight = "Phase 1 demo: this conversion uses the rate you entered and does not fetch live foreign-exchange data.";
      break;
    }
    default:
      error = "This calculator is not available.";
  }

  return { value: safe(value), label, suffix, secondary, unit, insight, chart, error };
}
