import { calculate, type CalculationResult } from "@datastorified/calculators-engine";
import type { DecisionAnswers, DecisionConfig } from "../types";
import { ratio } from "../utils/math";

const n = (answers: DecisionAnswers, key: string, fallback = 0) => typeof answers[key] === "number" ? answers[key] as number : fallback;
const b = (answers: DecisionAnswers, key: string) => answers[key] === true;
export type CalculatorBridgeResult = { metrics: Record<string, number | string | boolean>; calculations: Record<string, CalculationResult> };

export function runCalculatorBridge(config: DecisionConfig, answers: DecisionAnswers): CalculatorBridgeResult {
  const calculations: Record<string, CalculationResult> = {};
  const metrics: Record<string, number | string | boolean> = {};
  if (config.id === "buy-house" || config.id === "rent-vs-buy") {
    const loan = Math.max(0, n(answers, "propertyPrice") - n(answers, "downPayment"));
    calculations.emi = calculate("emi-calculator", { principal: loan, rate: n(answers, "interestRate"), years: n(answers, "tenure") });
    calculations.affordability = calculate("home-affordability-calculator", { income: n(answers, "monthlyIncome"), savings: n(answers, "downPayment"), obligations: n(answers, "existingEmi"), rate: n(answers, "interestRate"), years: n(answers, "tenure") });
    const emi = calculations.emi.primaryResult.value;
    Object.assign(metrics, { emi, emiToIncomeRatio: ratio(emi, n(answers, "monthlyIncome")), totalDebtRatio: ratio(emi + n(answers, "existingEmi"), n(answers, "monthlyIncome")), emergencyMonths: ratio(n(answers, "emergencySavings"), n(answers, "monthlyExpenses")), stayYears: n(answers, "stayYears"), incomeStability: n(answers, "incomeStability"), affordableBudget: calculations.affordability.primaryResult.value });
    if (config.id === "rent-vs-buy") { calculations.rentVsBuy = calculate("rent-vs-buy-calculator", { property: n(answers, "propertyPrice"), downPayment: n(answers, "downPayment"), rate: n(answers, "interestRate"), years: n(answers, "stayYears"), rent: n(answers, "monthlyRent"), rentGrowth: 5, appreciation: 4 }); metrics.buyAdvantage = calculations.rentVsBuy.primaryResult.value; }
  }
  if (config.id === "buy-car") {
    const loan = Math.max(0, n(answers, "carPrice") - n(answers, "downPayment"));
    calculations.carLoan = calculate("car-loan-calculator", { principal: loan, rate: n(answers, "interestRate"), years: n(answers, "tenure") });
    const emi = calculations.carLoan.primaryResult.value;
    Object.assign(metrics, { emi, emiToIncomeRatio: ratio(emi, n(answers, "monthlyIncome")), totalDebtRatio: ratio(emi + n(answers, "existingEmi"), n(answers, "monthlyIncome")), emergencyMonths: ratio(n(answers, "emergencySavings"), n(answers, "monthlyExpenses")), monthlyUseDays: n(answers, "monthlyUseDays") });
  }
  if (config.id === "ev-vs-petrol") {
    const annualKm = n(answers, "monthlyKm") * 12;
    calculations.ev = calculate("ev-vs-petrol-savings-calculator", { distance: annualKm, petrolMileage: n(answers, "petrolMileage"), petrolPrice: n(answers, "petrolPrice"), evEfficiency: n(answers, "evEfficiency"), electricityPrice: n(answers, "electricityPrice"), evPremium: n(answers, "evPremium") });
    const annualSaving = calculations.ev.primaryResult.value;
    Object.assign(metrics, { annualKm, annualSaving, paybackYears: annualSaving > 0 ? n(answers, "evPremium") / annualSaving : 99, homeCharging: b(answers, "homeCharging"), holdingYears: n(answers, "holdingYears") });
  }
  if (config.id === "sip-vs-fd") {
    calculations.sip = calculate("sip-calculator", { monthly: n(answers, "investmentAmount"), rate: n(answers, "sipReturn"), years: n(answers, "timeHorizon") });
    calculations.fd = calculate("fd-calculator", { principal: n(answers, "investmentAmount") * 12, rate: n(answers, "fdRate"), years: n(answers, "timeHorizon") });
    Object.assign(metrics, { timeHorizon: n(answers, "timeHorizon"), riskTolerance: n(answers, "riskTolerance"), emergencyMonths: n(answers, "emergencyMonths"), sipRealReturn: n(answers, "sipReturn") - n(answers, "inflationRate"), sipValue: calculations.sip.primaryResult.value, fdValue: calculations.fd.primaryResult.value });
  }
  if (config.id === "loan-prepayment") {
    calculations.prepayment = calculate("loan-prepayment-calculator", { principal: n(answers, "loanBalance"), rate: n(answers, "interestRate"), years: n(answers, "remainingYears"), extra: n(answers, "extraMonthly") });
    Object.assign(metrics, { interestSaved: calculations.prepayment.primaryResult.value, emergencyMonths: ratio(n(answers, "emergencySavings"), n(answers, "monthlyExpenses")), rateGap: n(answers, "interestRate") - n(answers, "alternativeReturn"), remainingYears: n(answers, "remainingYears") });
  }
  if (config.id === "emergency-fund") {
    const targetMonths = Math.min(12, 6 + (n(answers, "incomeStability") === 1 ? 3 : 0) + (b(answers, "singleIncome") ? 1 : 0) + (n(answers, "dependants") >= 3 ? 1 : 0));
    calculations.emergency = calculate("emergency-fund-calculator", { expense: n(answers, "monthlyExpenses"), months: targetMonths });
    Object.assign(metrics, { emergencyMonths: ratio(n(answers, "currentFund"), n(answers, "monthlyExpenses")), targetMonths, targetFund: calculations.emergency.primaryResult.value, fundingGap: Math.max(0, calculations.emergency.primaryResult.value - n(answers, "currentFund")), incomeStability: n(answers, "incomeStability"), singleIncome: b(answers, "singleIncome"), adequateInsurance: b(answers, "adequateInsurance"), dependants: n(answers, "dependants") });
  }
  if (config.id === "job-switch") Object.assign(metrics, { salaryIncrease: ratio(n(answers, "offeredSalary") - n(answers, "currentSalary"), n(answers, "currentSalary")), hasOffer: b(answers, "hasOffer"), emergencyMonths: n(answers, "emergencyMonths"), growthPotential: n(answers, "growthPotential"), roleFit: n(answers, "roleFit"), companyStability: n(answers, "companyStability"), noticeRisk: n(answers, "noticeRisk") });
  return { metrics, calculations };
}
