import type { DecisionCategory } from "../types";
export const decisionCategories: Record<DecisionCategory, { label: string; description: string }> = {
  property: { label: "Property", description: "Home ownership, affordability, and renting trade-offs." },
  vehicle: { label: "Vehicle", description: "Purchase timing and ownership-cost choices." },
  investment: { label: "Investment", description: "Risk, return, liquidity, and time-horizon choices." },
  debt: { label: "Debt", description: "Repayment, interest savings, and liquidity choices." },
  safety: { label: "Financial safety", description: "Emergency resilience and protection." },
  career: { label: "Career", description: "Compensation, growth, stability, and fit." },
};
