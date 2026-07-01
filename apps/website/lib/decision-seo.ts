export type DecisionSeo = {
  title: string;
  description: string;
  primaryKeyword: string;
  longTailKeywords: string[];
  summary: string;
  outcome: string;
};

export const decisionHubSeo = {
  title: "Free Decision-Making Tools for Money & Life | DataStorified",
  description: "Use free decision-making tools for home, car, investment, debt, emergency-fund, and career choices with transparent scores and risk checks.",
  primaryKeyword: "free decision-making tools",
  longTailKeywords: [
    "online decision-making tool for financial decisions",
    "free life decision calculator with risk analysis",
    "data-backed decision tools for money and career",
    "compare major financial decisions online",
  ],
} as const;

export const decisionSeoById: Record<string, DecisionSeo> = {
  "buy-house": {
    title: "Should I Buy a House or Wait? Free Decision Tool",
    description: "Should you buy a house now or wait? Check home affordability, EMI burden, down payment, emergency savings, stability, and ownership horizon.",
    primaryKeyword: "should I buy a house or wait",
    longTailKeywords: [
      "should I buy a house now or wait in India",
      "can I afford to buy a house with my salary",
      "how much emergency fund before buying a house",
      "home buying decision calculator with EMI",
      "is now the right time for me to buy a home",
    ],
    summary: "Use this home-buying decision tool when you are asking whether to buy a house now or wait. It tests whether the property price, down payment, EMI, current debt, emergency savings, income stability, and expected years of ownership fit together.",
    outcome: "You receive a transparent readiness score, the risks weakening your case, and practical next steps to validate the purchase before committing.",
  },
  "rent-vs-buy": {
    title: "Rent vs Buy a House in India: Free Decision Tool",
    description: "Compare renting vs buying a house using property price, monthly rent, affordability, flexibility, ownership costs, and how long you expect to stay.",
    primaryKeyword: "rent vs buy a house in India",
    longTailKeywords: [
      "is it better to rent or buy a house in India",
      "rent vs buy calculator based on salary",
      "should I keep renting or buy a home",
      "renting vs buying for a five year stay",
      "how long should I stay to make buying worthwhile",
    ],
    summary: "This rent-versus-buy decision guide compares the financial case for home ownership with the flexibility of renting. It considers the property price, current rent, down payment, financing burden, full ownership costs, and how long you realistically expect to stay.",
    outcome: "The result shows which assumptions favour buying, which favour renting, and where a small change in time horizon or cost could reverse the recommendation.",
  },
  "buy-car": {
    title: "Should I Buy a Car Now? Affordability Decision Tool",
    description: "Check whether you should buy a car now using your salary, car EMI, down payment, existing debt, emergency savings, running costs, and expected use.",
    primaryKeyword: "should I buy a car now",
    longTailKeywords: [
      "can I afford to buy a car with my salary",
      "how much car EMI can I safely afford",
      "should I buy a new car or wait",
      "car buying decision based on monthly income",
      "how much emergency savings before buying a car",
    ],
    summary: "Use this car-affordability decision tool to test whether buying now fits your income and real usage. It weighs the on-road price, down payment, car EMI, existing debt, essential expenses, emergency reserve, and the number of days the car will solve a genuine transport need.",
    outcome: "You get an affordability score, cash-flow and safety warnings, and a clear list of costs to verify before accepting a loan or paying a deposit.",
  },
  "ev-vs-petrol": {
    title: "EV vs Petrol Car in India: Cost & Decision Tool",
    description: "Compare an EV vs petrol car using price premium, monthly driving, fuel and electricity costs, mileage, charging access, payback, and ownership period.",
    primaryKeyword: "EV vs petrol car in India",
    longTailKeywords: [
      "is an electric car cheaper than petrol in India",
      "EV vs petrol car cost comparison for my usage",
      "how many kilometres to recover EV price premium",
      "should I buy an EV without home charging",
      "electric car payback period calculator India",
    ],
    summary: "This EV-versus-petrol decision tool tests whether an electric car fits your driving pattern—not an idealised average. It compares the EV price premium with monthly kilometres, real-world efficiency, petrol and electricity prices, home-charging access, and expected ownership period.",
    outcome: "The analysis estimates whether energy savings can recover the upfront premium and highlights charging or low-usage risks that a simple fuel-cost comparison can miss.",
  },
  "sip-vs-fd": {
    title: "SIP vs FD in India: Which Is Better for You?",
    description: "Compare SIP vs FD for your goal using investment horizon, risk tolerance, emergency savings, inflation, expected SIP returns, and fixed-deposit rates.",
    primaryKeyword: "SIP vs FD in India",
    longTailKeywords: [
      "which is better SIP or fixed deposit for me",
      "SIP vs FD for a five year investment",
      "mutual fund SIP or FD for low risk investors",
      "SIP vs FD returns after inflation in India",
      "should I invest in SIP without an emergency fund",
    ],
    summary: "Use this SIP-versus-FD guide to match the investment—not just the projected return—to your goal. It considers time horizon, tolerance for market falls, emergency-fund coverage, inflation, a conservative SIP assumption, and the offered fixed-deposit rate.",
    outcome: "The result explains whether growth, stability, or a blended allocation better fits your inputs. Projections are scenarios, not guaranteed returns or personalised investment advice.",
  },
  "loan-prepayment": {
    title: "Should I Prepay My Loan? Free Decision Tool",
    description: "Decide whether to prepay your loan by comparing interest savings, remaining tenure, extra payments, emergency liquidity, prepayment fees, and alternative returns.",
    primaryKeyword: "should I prepay my loan",
    longTailKeywords: [
      "should I prepay my home loan or invest",
      "is loan prepayment worth it early in the tenure",
      "prepay loan or keep emergency fund",
      "how much interest can extra EMI save",
      "loan prepayment decision based on interest rate",
    ],
    summary: "This loan-prepayment decision tool compares the guaranteed interest avoided with the value of keeping cash available. It uses your outstanding balance, loan rate, remaining tenure, extra monthly payment, emergency savings, and a conservative alternative-return assumption.",
    outcome: "You see whether prepayment has a meaningful advantage, whether liquidity is too thin, and which lender charges or amortisation details to confirm first.",
  },
  "emergency-fund": {
    title: "How Much Emergency Fund Do I Need in India?",
    description: "Estimate how much emergency fund you need from essential expenses, current savings, dependants, income stability, household income sources, and insurance.",
    primaryKeyword: "how much emergency fund do I need",
    longTailKeywords: [
      "how many months of expenses should emergency fund cover",
      "emergency fund calculator for a single income family",
      "how much emergency savings do I need in India",
      "emergency fund target with dependants",
      "where to start when my emergency fund is too small",
    ],
    summary: "Use this emergency-fund guide to set a cash-buffer target around your actual household risk. It looks beyond a generic number of months by considering essential expenses, existing liquid savings, dependants, income stability, the number of income sources, and health-insurance protection.",
    outcome: "The result estimates your current coverage, identifies resilience gaps, and gives a practical next step for closing the shortfall without treating one rule of thumb as universal.",
  },
  "job-switch": {
    title: "Should I Switch Jobs? Compare Salary, Growth & Risk",
    description: "Decide whether to switch jobs by comparing salary increase, written offer, role fit, career growth, company stability, notice risk, and financial runway.",
    primaryKeyword: "should I switch jobs",
    longTailKeywords: [
      "should I change jobs for a higher salary",
      "how much salary hike is worth switching jobs",
      "should I accept a new job offer or stay",
      "job switch decision based on growth and stability",
      "should I leave my job without enough savings",
    ],
    summary: "This job-switch decision tool compares more than the headline salary increase. It weighs the written offer, total compensation, role fit, learning and growth potential, company stability, transition risk, and the financial runway available if the move goes badly.",
    outcome: "You receive a balanced score, the strongest reasons to move or stay, and a diligence checklist for the offer, manager, role scope, probation, and notice terms.",
  },
};

export function decisionSeo(id: string): DecisionSeo | undefined {
  return decisionSeoById[id];
}
