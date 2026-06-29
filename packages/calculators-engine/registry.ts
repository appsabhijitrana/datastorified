export type CalculatorField = {
  key: string;
  label: string;
  default: number;
  suffix?: string;
  step?: number;
  min?: number;
  max?: number;
  input?: "number" | "select";
  options?: Array<{ label: string; value: number }>;
  help?: string;
};

export type CalculatorDefinition = {
  slug: string;
  name: string;
  description: string;
  category: string;
  keywords: string[];
  icon: string;
  popular?: boolean;
  fields: CalculatorField[];
  resultLabel: string;
  formula: string;
  source?: { label: string; url: string };
  related: string[];
};

const numberField = (
  key: string,
  label: string,
  value: number,
  suffix = "",
  step = 1,
  min = 0,
  max?: number,
  help?: string,
): CalculatorField => ({ key, label, default: value, suffix, step, min, max, help, input: "number" });

const selectField = (
  key: string,
  label: string,
  value: number,
  options: Array<{ label: string; value: number }>,
  help?: string,
): CalculatorField => ({ key, label, default: value, options, help, input: "select" });

const today = new Date();
const lengthUnits = [
  { label: "Metres (m)", value: 0 },
  { label: "Kilometres (km)", value: 1 },
  { label: "Centimetres (cm)", value: 2 },
  { label: "Millimetres (mm)", value: 3 },
  { label: "Feet (ft)", value: 4 },
  { label: "Inches (in)", value: 5 },
  { label: "Yards (yd)", value: 6 },
  { label: "Miles (mi)", value: 7 },
];

export const calculators: CalculatorDefinition[] = [
  {
    slug: "emi-calculator", name: "EMI Calculator", description: "Plan loan payments, total interest, and repayment cost.", category: "Loans", keywords: ["loan", "mortgage", "monthly"], icon: "Landmark", popular: true,
    fields: [numberField("principal", "Loan amount", 2500000, "₹", 10000, 1), numberField("rate", "Annual interest rate", 8.5, "%", 0.1, 0, 100), numberField("years", "Loan tenure", 20, "years", 1, 1, 50)],
    resultLabel: "Monthly EMI", formula: "Uses the reducing-balance EMI formula with monthly compounding.", related: ["loan-eligibility-calculator", "home-affordability-calculator"],
  },
  {
    slug: "sip-calculator", name: "SIP Calculator", description: "Project long-term mutual fund wealth from monthly investments.", category: "Investing", keywords: ["mutual fund", "returns", "monthly"], icon: "TrendingUp", popular: true,
    fields: [numberField("monthly", "Monthly investment", 10000, "₹", 500, 1), numberField("rate", "Expected annual return", 12, "%", 0.5, 0, 100), numberField("years", "Investment period", 10, "years", 1, 1, 60)],
    resultLabel: "Projected value", formula: "Calculates the future value of monthly investments made at the start of each month.", related: ["cagr-calculator", "retirement-calculator"],
  },
  {
    slug: "fd-calculator", name: "FD Calculator", description: "Estimate fixed-deposit maturity value and interest earned.", category: "Investing", keywords: ["deposit", "interest", "bank"], icon: "PiggyBank",
    fields: [numberField("principal", "Deposit amount", 100000, "₹", 1000, 1), numberField("rate", "Annual interest rate", 7, "%", 0.1, 0, 100), numberField("years", "Deposit tenure", 5, "years", 0.25, 0.25, 30)],
    resultLabel: "Maturity value", formula: "Assumes interest is compounded quarterly for the selected tenure.", related: ["sip-calculator", "cagr-calculator"],
  },
  {
    slug: "cagr-calculator", name: "CAGR Calculator", description: "Measure annualised investment growth between two values.", category: "Investing", keywords: ["growth", "annual", "return"], icon: "ChartNoAxesCombined",
    fields: [numberField("start", "Initial value", 100000, "₹", 1000, 1), numberField("end", "Final value", 200000, "₹", 1000, 0), numberField("years", "Investment period", 5, "years", 0.5, 0.1, 100)],
    resultLabel: "Annual growth", formula: "CAGR = (final value ÷ initial value)^(1 ÷ years) − 1.", related: ["sip-calculator", "fd-calculator"],
  },
  {
    slug: "inflation-calculator", name: "Inflation Calculator", description: "See how rising prices change a future cost.", category: "Planning", keywords: ["cost", "future value", "purchasing"], icon: "ChartSpline",
    fields: [numberField("amount", "Current cost", 100000, "₹", 1000, 0), numberField("rate", "Expected inflation", 6, "%", 0.1, 0, 100), numberField("years", "Time horizon", 10, "years", 1, 0, 100)],
    resultLabel: "Future cost", formula: "Future cost = current cost × (1 + inflation rate)^years.", related: ["retirement-calculator", "sip-calculator"],
  },
  {
    slug: "retirement-calculator", name: "Retirement Calculator", description: "Estimate a retirement corpus from future expenses and returns.", category: "Planning", keywords: ["corpus", "future", "pension"], icon: "Sunset", popular: true,
    fields: [numberField("expense", "Monthly expense today", 50000, "₹", 1000, 1), numberField("years", "Years to retirement", 25, "years", 1, 0, 60), numberField("retirementYears", "Years in retirement", 25, "years", 1, 1, 60), numberField("inflation", "Expected inflation", 6, "%", 0.1, 0, 30), numberField("return", "Post-retirement return", 8, "%", 0.1, 0, 50)],
    resultLabel: "Target corpus", formula: "Inflates today’s expense, then values the selected years of retirement spending using the real post-retirement return.", related: ["sip-calculator", "inflation-calculator"],
  },
  {
    slug: "emergency-fund-calculator", name: "Emergency Fund Calculator", description: "Build a safety buffer around essential monthly spending.", category: "Planning", keywords: ["safety", "expenses", "buffer"], icon: "ShieldCheck",
    fields: [numberField("expense", "Essential monthly expenses", 45000, "₹", 1000, 1), numberField("months", "Months of cover", 6, "months", 1, 1, 36)],
    resultLabel: "Fund target", formula: "Emergency fund = essential monthly expenses × months of cover.", related: ["net-worth-calculator", "retirement-calculator"],
  },
  {
    slug: "net-worth-calculator", name: "Net Worth Calculator", description: "Get a clear snapshot of assets minus liabilities.", category: "Planning", keywords: ["assets", "liabilities", "wealth"], icon: "WalletCards",
    fields: [numberField("assets", "Total assets", 3500000, "₹", 10000, 0), numberField("liabilities", "Total liabilities", 1200000, "₹", 10000, 0)],
    resultLabel: "Your net worth", formula: "Net worth = total assets − total liabilities.", related: ["emergency-fund-calculator", "home-affordability-calculator"],
  },
  {
    slug: "loan-eligibility-calculator", name: "Loan Eligibility Calculator", description: "Estimate a maximum loan from income and existing obligations.", category: "Loans", keywords: ["salary", "emi", "borrow"], icon: "BadgeIndianRupee",
    fields: [numberField("income", "Monthly net income", 100000, "₹", 1000, 1), numberField("obligations", "Existing monthly EMIs", 10000, "₹", 1000, 0), numberField("rate", "Annual interest rate", 9, "%", 0.1, 0, 100), numberField("years", "Loan tenure", 20, "years", 1, 1, 50)],
    resultLabel: "Eligible loan", formula: "Limits total monthly debt payments to 45% of income, then converts the available EMI into a loan principal.", related: ["emi-calculator", "home-affordability-calculator"],
  },
  {
    slug: "home-affordability-calculator", name: "Home Affordability Calculator", description: "Find a responsible home-buying budget from cash and borrowing capacity.", category: "Loans", keywords: ["house", "property", "down payment"], icon: "House",
    fields: [numberField("income", "Monthly household income", 150000, "₹", 1000, 1), numberField("savings", "Available down payment", 1500000, "₹", 10000, 0), numberField("obligations", "Existing monthly EMIs", 15000, "₹", 1000, 0), numberField("rate", "Home-loan interest rate", 8.5, "%", 0.1, 0, 100), numberField("years", "Loan tenure", 20, "years", 1, 1, 50)],
    resultLabel: "Affordable home budget", formula: "Keeps total EMIs within 40% of income, estimates loan capacity, and adds the available down payment.", related: ["emi-calculator", "loan-eligibility-calculator"],
  },
  {
    slug: "gst-calculator", name: "GST Calculator", description: "Add GST to a base price or extract it from an inclusive price.", category: "Tax", keywords: ["tax", "invoice", "goods", "inclusive", "exclusive"], icon: "ReceiptIndianRupee",
    fields: [selectField("mode", "Calculation", 0, [{ label: "Add GST to base price", value: 0 }, { label: "Remove GST from inclusive price", value: 1 }]), numberField("amount", "Amount", 10000, "₹", 100, 0), numberField("rate", "GST rate", 18, "%", 1, 0, 100)],
    resultLabel: "Calculated amount", formula: "Exclusive mode adds rate × base amount; inclusive mode extracts tax using rate ÷ (100 + rate).", related: ["income-tax-calculator", "percentage-calculator"],
  },
  {
    slug: "income-tax-calculator", name: "Income Tax Basic Calculator", description: "Estimate individual income tax under the AY 2026–27 new regime.", category: "Tax", keywords: ["salary", "income", "india", "new regime", "ay 2026-27"], icon: "FileText",
    fields: [numberField("income", "Annual taxable income", 1500000, "₹", 10000, 0, undefined, "Enter taxable income after eligible deductions.")],
    resultLabel: "Estimated tax", formula: "Applies AY 2026–27 new-regime slabs, eligible section 87A rebate and marginal relief, then adds 4% health and education cess. Surcharge and special-rate income are excluded.", source: { label: "Income Tax Department — AY 2026–27", url: "https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1" }, related: ["hra-calculator", "gst-calculator"],
  },
  {
    slug: "hra-calculator", name: "HRA Basic Calculator", description: "Estimate HRA exemption using the standard three-part rule.", category: "Tax", keywords: ["rent", "salary", "exemption"], icon: "Building2",
    fields: [numberField("hra", "Annual HRA received", 240000, "₹", 1000, 0), numberField("rent", "Annual rent paid", 300000, "₹", 1000, 0), numberField("basic", "Annual basic salary + DA", 600000, "₹", 1000, 1), selectField("metro", "Work location", 1, [{ label: "Metro: Delhi, Mumbai, Kolkata or Chennai", value: 1 }, { label: "Non-metro city", value: 0 }])],
    resultLabel: "HRA exemption", formula: "Uses the lowest of HRA received, rent minus 10% of basic salary, or 50% of basic in a metro / 40% elsewhere.", related: ["income-tax-calculator", "home-affordability-calculator"],
  },
  {
    slug: "age-calculator", name: "Age Calculator", description: "Calculate calendar age in years, months, and days.", category: "Everyday", keywords: ["birthday", "years", "date"], icon: "CakeSlice",
    fields: [numberField("birthDay", "Birth day", 1, "day", 1, 1, 31), numberField("birthMonth", "Birth month", 1, "month", 1, 1, 12), numberField("birthYear", "Birth year", 1995, "year", 1, 1900, today.getFullYear()), numberField("currentDay", "As-of day", today.getDate(), "day", 1, 1, 31), numberField("currentMonth", "As-of month", today.getMonth() + 1, "month", 1, 1, 12), numberField("currentYear", "As-of year", today.getFullYear(), "year", 1, 1900, 2200)],
    resultLabel: "Your age", formula: "Subtracts the birth date from the selected as-of date using calendar years, months, and days.", related: ["percentage-calculator", "bmi-calculator"],
  },
  {
    slug: "percentage-calculator", name: "Percentage Calculator", description: "Find a percentage of any number.", category: "Everyday", keywords: ["percent", "math", "ratio"], icon: "Percent",
    fields: [numberField("value", "Value", 5000, "", 1, 0), numberField("percentage", "Percentage", 18, "%", 0.1, 0)],
    resultLabel: "Result", formula: "Result = value × percentage ÷ 100.", related: ["discount-calculator", "gst-calculator"],
  },
  {
    slug: "discount-calculator", name: "Discount Calculator", description: "See the sale price and savings instantly.", category: "Everyday", keywords: ["sale", "saving", "price"], icon: "BadgePercent",
    fields: [numberField("price", "Original price", 4999, "₹", 1, 0), numberField("discount", "Discount", 25, "%", 0.1, 0, 100)],
    resultLabel: "Sale price", formula: "Sale price = original price × (1 − discount ÷ 100).", related: ["percentage-calculator", "gst-calculator"],
  },
  {
    slug: "bmi-calculator", name: "BMI Calculator", description: "Check body mass index and the standard screening range.", category: "Health", keywords: ["weight", "height", "fitness"], icon: "Activity",
    fields: [numberField("weight", "Weight", 70, "kg", 0.5, 1, 500), numberField("height", "Height", 175, "cm", 1, 30, 300)],
    resultLabel: "Your BMI", formula: "BMI = weight in kilograms ÷ height in metres². BMI is a screening measure, not a diagnosis.", related: ["age-calculator", "percentage-calculator"],
  },
  {
    slug: "fuel-cost-calculator", name: "Fuel Cost Calculator", description: "Estimate fuel required and spend for a journey.", category: "Everyday", keywords: ["petrol", "trip", "mileage"], icon: "Fuel",
    fields: [numberField("distance", "Journey distance", 500, "km", 1, 0), numberField("mileage", "Vehicle mileage", 15, "km/L", 0.5, 0.1, 200), numberField("price", "Fuel price", 105, "₹/L", 0.1, 0)],
    resultLabel: "Trip fuel cost", formula: "Fuel needed = distance ÷ mileage; trip cost = fuel needed × price per litre.", related: ["percentage-calculator", "discount-calculator"],
  },
  {
    slug: "unit-converter", name: "Unit Converter", description: "Convert between eight common length units.", category: "Everyday", keywords: ["length", "metres", "feet", "miles", "inches"], icon: "Ruler",
    fields: [numberField("value", "Value to convert", 10, "", 0.01, 0), selectField("fromUnit", "From", 0, lengthUnits), selectField("toUnit", "To", 4, lengthUnits)],
    resultLabel: "Converted value", formula: "Converts the source value to metres, then from metres to the selected target unit.", related: ["percentage-calculator", "age-calculator"],
  },
  {
    slug: "currency-converter", name: "Currency Converter Mock", description: "Preview USD-to-INR conversion using a rate you provide.", category: "Everyday", keywords: ["money", "exchange", "forex"], icon: "ArrowLeftRight",
    fields: [numberField("amount", "US dollar amount", 100, "USD", 1, 0), numberField("rate", "Demo USD/INR rate", 83.5, "₹/USD", 0.1, 0.01)],
    resultLabel: "Indian rupee value", formula: "INR value = USD amount × the manually entered demo exchange rate. No live rate is fetched.", related: ["gst-calculator", "percentage-calculator"],
  },
];

export const calculatorBySlug = (slug: string) => calculators.find((calculator) => calculator.slug === slug);

export const searchCalculators = (query: string) => {
  const normalized = query.toLowerCase().trim();
  return normalized
    ? calculators.filter((calculator) => [calculator.name, calculator.slug, calculator.category, calculator.description, ...calculator.keywords].join(" ").toLowerCase().includes(normalized))
    : calculators;
};

export function validateCalculatorInputs(calculator: CalculatorDefinition, values: Record<string, number>): string[] {
  return calculator.fields.flatMap((field) => {
    const value = values[field.key];
    if (!Number.isFinite(value)) return [`Enter a valid value for ${field.label.toLowerCase()}.`];
    if (field.input === "select" && !field.options?.some((option) => option.value === value)) return [`Choose a valid option for ${field.label.toLowerCase()}.`];
    if (field.min !== undefined && value < field.min) return [`${field.label} must be at least ${field.min}.`];
    if (field.max !== undefined && value > field.max) return [`${field.label} must be no more than ${field.max}.`];
    return [];
  });
}
