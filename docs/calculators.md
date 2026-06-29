# Calculator catalog and test specification

All 55 calculators are registered in `packages/calculators-engine/registry.ts`; formulas live in `packages/calculators-engine/index.ts`. Each route receives only serializable definition data, while its Zod schema remains inside the engine package. Every result returns `primaryResult`, `secondaryResults`, `chartData`, `insight`, `warnings`, `formula`, and `assumptions`.

Common assumptions: inputs remain constant over the selected period; rounding is applied only for display; results are planning estimates rather than financial, tax, legal, or medical advice. The parameterized unit suite tests every default example, empty/non-finite input, below-range input, decimal input, output shape, and Zod schema. The final column identifies the calculator-specific known or regression case.

## Finance

| Calculator | Inputs | Formula and primary output | Specific test / limitation |
| --- | --- | --- | --- |
| EMI | principal, annual rate, years | Reducing-balance EMI; monthly EMI | ₹20 lakh, 8.5%, 20 years ≈ ₹17,356 |
| Loan Prepayment | principal, rate, years, extra payment | Month-by-month amortisation comparison; interest saved | Extra payment must shorten or match tenure |
| Loan Eligibility | income, obligations, rate, years | 45% income debt cap converted to principal; eligible loan | Existing obligations can reduce availability to zero |
| Home Affordability | income, savings, obligations, rate, years | 40% debt cap plus down payment; home budget | Excludes registration, furnishing, and reserves |
| Personal Loan | principal, rate, years | Reducing-balance EMI; monthly EMI | Zero-rate path avoids division by zero |
| Car Loan | principal, rate, years | Reducing-balance EMI; monthly EMI | Decimal-rate regression |
| Credit Card Interest | balance, APR, payment | Monthly interest plus amortised payoff; first-month interest | Payment at or below interest returns an error |
| Debt Payoff | balance, APR, payment | Monthly amortisation; months to debt-free | Negative-amortisation case rejected |
| Emergency Fund | monthly essentials, months | Expense × cover; target fund | Six-month example |
| Net Worth | assets, liabilities | Assets − liabilities; net worth | Supports a negative result |

## Investment

| Calculator | Inputs | Formula and primary output | Specific test / limitation |
| --- | --- | --- | --- |
| SIP | monthly amount, return, years | Future value of annuity due; projected value | ₹10,000, 12%, 10 years ≈ ₹23.23 lakh |
| Lumpsum | principal, return, years | Compound future value; projected value | Negative return allowed above −99% |
| SWP | corpus, withdrawal, return, years | Monthly return then withdrawal; remaining corpus | Warns if corpus is exhausted |
| CAGR | start, end, years | `(end/start)^(1/years)-1`; annual growth | Known doubling example |
| XIRR | initial, year-one addition, final, years | Newton solution of irregular cash-flow NPV; XIRR | Additional contribution assumed at year one |
| FD | principal, rate, years | Quarterly compound interest; maturity | Interest equals maturity less deposit |
| RD | monthly deposit, rate, years | Monthly annuity due; maturity | Zero-rate path equals deposits |
| PPF | annual contribution, rate, years | Annual contribution and compounding; maturity | Constant entered rate; statutory maximum validated |
| EPF | basic pay, employee/employer rates, return, growth, years | Monthly contribution simulation; balance | EPS allocation and wage ceilings excluded |
| NPS | monthly contribution, return, years, annuity share/rate | Monthly accumulation and allocation; corpus | Annuity share validated at 40–100% |
| Inflation | current cost, inflation, years | Compound future cost; future cost | Zero years preserves value |
| Goal Planner | goal, inflation, return, years, existing savings | Inflated goal less grown savings; required SIP | Fully funded goal returns zero required SIP |
| Retirement | expense, years, retirement years, inflation, return | Real-return annuity; target corpus | Equal return/inflation path remains finite |
| FIRE | monthly expense, withdrawal rate, current corpus | Annual expense ÷ withdrawal rate; FIRE target | Reports gap and progress |

## Tax India

| Calculator | Inputs | Formula and primary output | Specific test / limitation |
| --- | --- | --- | --- |
| GST | mode, amount, rate | Add or extract GST; inclusive/base price | ₹1,000 at 18% gives ₹180 tax and ₹1,180 total |
| Income Tax Basic | taxable income | AY 2026–27 new-regime slabs, rebate, relief, cess; tax | Excludes surcharge and special-rate income |
| HRA | HRA, rent, basic + DA, metro | Minimum statutory rule; exemption | Metro uses 50%, non-metro 40% |
| Salary In-hand | gross, basic share, PF, other deductions | Gross less PF, estimated tax and deductions; monthly in-hand | Payroll structure remains an estimate |
| Gratuity | salary, years, extra months, coverage | `15/divisor × salary × eligible years`; gratuity | Six-plus extra months round service up |

## Gold

| Calculator | Inputs | Formula and primary output | Specific test / limitation |
| --- | --- | --- | --- |
| Gold Loan | weight, 24K price, purity, LTV | Metal value × LTV; eligible loan | Stones and lender valuation deductions excluded |
| Gold Purity | weight, karat | Weight × karat ÷ 24; pure-gold weight | 24K retains full weight |
| Gold Value | weight, price, purity, deduction | Purity-adjusted value less deduction; value | Making charges and taxes excluded |
| Gold Investment Return | purchase cost, current value, years | CAGR; annualised return | Uses the same known-vector logic as CAGR |

## Property

| Calculator | Inputs | Formula and primary output | Specific test / limitation |
| --- | --- | --- | --- |
| Rent vs Buy | price, down payment, rate, years, rent, growth, appreciation | Rent versus ownership cash and projected value; buy advantage | Costs and opportunity cost are simplified |
| Rental Yield | value, rent, vacancy, annual costs | Net rent ÷ property value; net yield | Vacancy at 100% remains finite |
| Stamp Duty Basic | value, stamp rate, registration rate, fixed charges | Percentage charges plus fixed cost; total | State concessions/caps excluded |
| Property Appreciation | value, rate, years | Compound growth; future property value | Supports negative appreciation within range |

## Vehicle

| Calculator | Inputs | Formula and primary output | Specific test / limitation |
| --- | --- | --- | --- |
| Fuel Cost | distance, mileage, fuel price | Distance ÷ mileage × price; trip cost | Mileage must be positive |
| Mileage | distance, fuel, price | Distance ÷ fuel; km/L | Fuel must be positive |
| EV vs Petrol Savings | distance, efficiencies, energy prices, EV premium | Annual energy-cost difference; saving | Reports premium payback; broader ownership costs excluded |
| Road Trip Cost | distance, mileage, price, tolls, people, food, stay | Sum of trip components; total | People must be at least one |

## Business

| Calculator | Inputs | Formula and primary output | Specific test / limitation |
| --- | --- | --- | --- |
| Profit Margin | revenue, cost | Profit ÷ revenue; margin | Zero revenue stays finite |
| Break-even | fixed cost, price, variable cost | Fixed ÷ contribution; units | Price at/below variable cost returns an error |
| ROI | gain, cost | `(gain-cost)/cost`; ROI | Cost must be positive |
| Startup Runway | cash, expense, revenue | Cash ÷ net burn; months | Non-positive burn reports sustainable operation |
| GST Inclusive/Exclusive | mode, amount, rate | Convert tax-exclusive/inclusive price | Round-trip GST regression |

## Health

| Calculator | Inputs | Formula and primary output | Specific test / limitation |
| --- | --- | --- | --- |
| BMI | weight, height | kg ÷ m²; BMI | 70 kg / 1.75 m ≈ 22.86 |
| BMR | sex, weight, height, age | Mifflin–St Jeor; kcal/day | Adult input ranges enforced |
| TDEE | BMR inputs, activity | BMR × activity factor; kcal/day | Activity must be a registered option |
| Water Intake | weight, exercise, hot climate | 35 mL/kg plus allowances; L/day | Medical factors disclosed as limitations |

## General

| Calculator | Inputs | Formula and primary output | Specific test / limitation |
| --- | --- | --- | --- |
| Age | birth and as-of dates | Calendar subtraction; years/months/days | Invalid dates and future birth dates rejected |
| Percentage | value, percentage | Value × percentage ÷ 100; result | Negative values supported within range |
| Discount | price, discount | Price × (1 − discount); sale price | Discount constrained to 0–100% |
| Unit Converter | value, source/target length units | Convert through metres; target value | Eight units and invalid-option schema test |
| Currency Converter Mock | USD, static INR rate | USD × entered static rate; INR | Clearly static; no live-rate claim |

Run calculator tests with `pnpm vitest run packages/calculators-engine` or the full gate with `pnpm test:coverage`.
