import { decisionPluginRegistry, type DecisionWorkflow } from "@datastorified/decision-os";
import { normalizeText } from "@datastorified/decision-os";
import type { PersonalizationContext, PersonalizationSignal, PersonalizedActionRecommendation, PersonalizedWorkflowRecommendation } from "./types";

type ScoredWorkflow = PersonalizedWorkflowRecommendation;

type WorkflowScoreRule = {
  id: string;
  evaluate: (context: PersonalizationContext) => number;
  reason: string;
  signal: (value: number, context: PersonalizationContext) => PersonalizationSignal | undefined;
};

function workflow(slug: string): DecisionWorkflow | undefined {
  return decisionPluginRegistry.getWorkflowBySlug(slug);
}

function profileGoals(profile?: PersonalizationContext["profile"]): string[] {
  return profile?.goals ?? [];
}

function profileRisk(profile?: PersonalizationContext["profile"]): string {
  return profile?.riskProfile ?? "unknown";
}

function countMatchingCalculators(context: PersonalizationContext, items: string[]): boolean {
  const recent = context.recentCalculators ?? [];
  const favorite = context.favoriteCalculators ?? [];
  const all = new Set([...recent, ...favorite]);
  return items.some((item) => all.has(item));
}

function containsAny(values: string[], tokens: string[]): boolean {
  const normalized = values.map((value) => normalizeText(value));
  return tokens.some((token) => normalized.some((value) => value.includes(normalizeText(token))));
}

function hasDecision(context: PersonalizationContext, slugs: readonly string[]): boolean {
  const decisionSlugs = [...(context.recentDecisions ?? []), ...(context.savedDecisions ?? []), ...(context.history ?? [])]
    .map((decision) => decision.workflowId || "");
  return decisionSlugs.some((slug) => slugs.includes(slug as (typeof slugs)[number]));
}

function scoreWorkflowWithRules(context: PersonalizationContext, item: DecisionWorkflow, rules: WorkflowScoreRule[]): ScoredWorkflow | undefined {
  const signals: PersonalizationSignal[] = [];
  let score = 0;
  if ((context.favoriteWorkflowIds ?? []).includes(item.id)) {
    score += 14;
    signals.push({ id: `favorite-${item.id}`, label: "Frequently revisited workflow", value: 14, detail: "This workflow is already among your saved or favorite decision paths." });
  }
  for (const rule of rules) {
    const value = rule.evaluate(context);
    if (value <= 0) continue;
    score += value;
    const signal = rule.signal(value, context);
    if (signal) signals.push(signal);
  }
  if (score <= 0) return undefined;
  return { workflow: item, score: Math.min(100, score), reason: signals[0]?.detail ?? `Relevant to your current context.`, signals };
}

const workflowRules: Array<{ slug: string; rules: WorkflowScoreRule[] }> = [
  {
    slug: "emergency-fund",
    rules: [
      {
        id: "weak-buffer",
        evaluate: (context) => {
          const profile = context.profile;
          if (!profile?.monthlyExpenses || !profile?.emergencyFund) return 0;
          const months = profile.emergencyFund / Math.max(1, profile.monthlyExpenses);
          return months < 3 ? 55 : months < 6 ? 35 : 0;
        },
        reason: "Weak emergency savings",
        signal: (value, context) => {
          const profile = context.profile;
          if (!profile?.monthlyExpenses || !profile?.emergencyFund) return undefined;
          const months = profile.emergencyFund / Math.max(1, profile.monthlyExpenses);
          return months < 3
            ? { id: "weak-emergency-fund", label: "Emergency buffer is thin", value, detail: `You have about ${months.toFixed(1)} months of essentials covered.` }
            : months < 6
              ? { id: "build-emergency-fund", label: "Buffer still needs work", value, detail: `Coverage is about ${months.toFixed(1)} months.` }
              : undefined;
        },
      },
      {
        id: "conservative-risk",
        evaluate: (context) => (profileRisk(context.profile) === "conservative" ? 18 : 0),
        reason: "Conservative risk profile",
        signal: (value) => ({ id: "risk-safe", label: "Safer comparison flow", value, detail: "Conservative profiles usually benefit from strengthening the cash buffer first." }),
      },
      {
        id: "debt-pressure",
        evaluate: (context) => {
          const profile = context.profile;
          if (!profile?.liabilities || !profile?.monthlyIncome) return 0;
          return profile.liabilities > profile.monthlyIncome * 6 ? 15 : 0;
        },
        reason: "Debt pressure",
        signal: (value) => ({ id: "liability-pressure", label: "Liabilities are elevated", value, detail: "High liabilities and weak buffers often benefit from an emergency-fund reset first." }),
      },
    ],
  },
  {
    slug: "loan-prepayment",
    rules: [
      {
        id: "high-liabilities",
        evaluate: (context) => {
          const profile = context.profile;
          if (!profile?.liabilities) return 0;
          if (profile.assets != null && profile.assets > 0 && profile.liabilities > profile.assets) return 65;
          if (profile.monthlyEmis != null && profile.monthlyIncome != null && profile.monthlyEmis > profile.monthlyIncome * 0.25) return 55;
          return profile.liabilities > 0 ? 25 : 0;
        },
        reason: "High liabilities",
        signal: (value, context) => {
          const profile = context.profile;
          if (!profile?.liabilities) return undefined;
          return { id: "debt-payoff", label: "Debt payoff pressure", value, detail: "High liabilities and EMIs are a strong signal to review loan prepayment." };
        },
      },
      {
        id: "debt-goal",
        evaluate: (context) => (containsAny(profileGoals(context.profile), ["debt", "loan", "emi", "liability"]) ? 28 : 0),
        reason: "Debt reduction goal",
        signal: (value) => ({ id: "debt-goal", label: "Debt-focused goal", value, detail: "Your profile goals mention reducing debt." }),
      },
      {
        id: "loan-history",
        evaluate: (context) => hasDecision(context, ["loan-prepayment"]) ? 20 : 0,
        reason: "Already thinking about debt",
        signal: (value) => ({ id: "loan-history", label: "Debt theme is recurring", value, detail: "Your recent decision history suggests the debt topic matters right now." }),
      },
    ],
  },
  {
    slug: "sip-vs-fd",
    rules: [
      {
        id: "wealth-goal",
        evaluate: (context) => (containsAny(profileGoals(context.profile), ["invest", "wealth", "save", "grow"]) ? 30 : 0),
        reason: "Investing goal",
        signal: (value) => ({ id: "wealth-goal", label: "Growth-oriented goal", value, detail: "Your goals lean toward investing or growing money." }),
      },
      {
        id: "buffer-ready",
        evaluate: (context) => {
          const profile = context.profile;
          if (!profile?.monthlyExpenses || !profile?.emergencyFund) return 0;
          const months = profile.emergencyFund / Math.max(1, profile.monthlyExpenses);
          return months >= 6 ? 22 : months >= 3 ? 10 : 0;
        },
        reason: "Emergency buffer is ready",
        signal: (value) => ({ id: "buffer-ready", label: "Investable buffer exists", value, detail: "A better buffer makes a SIP versus FD comparison more meaningful." }),
      },
      {
        id: "risk-match",
        evaluate: (context) => (profileRisk(context.profile) === "moderate" || profileRisk(context.profile) === "growth" ? 20 : 0),
        reason: "Risk profile can support comparison",
        signal: (value, context) => ({ id: "risk-match", label: "Risk profile supports growth", value, detail: `Your stated risk profile is ${profileRisk(context.profile)}.` }),
      },
      {
        id: "sip-habit",
        evaluate: (context) => countMatchingCalculators(context, ["sip-calculator", "fd-calculator"]) ? 24 : 0,
        reason: "You have been exploring investing calculators",
        signal: (value) => ({ id: "sip-habit", label: "SIP/FD interest detected", value, detail: "Recent calculator use suggests an investment comparison is timely." }),
      },
    ],
  },
  {
    slug: "buy-house",
    rules: [
      {
        id: "home-goal",
        evaluate: (context) => (containsAny(profileGoals(context.profile), ["home", "house", "property", "apartment", "mortgage"]) ? 42 : 0),
        reason: "Housing goal",
        signal: (value) => ({ id: "home-goal", label: "Homeownership goal", value, detail: "Your profile goals mention a home or property." }),
      },
      {
        id: "home-calculator",
        evaluate: (context) => countMatchingCalculators(context, ["emi-calculator", "home-affordability-calculator"]) ? 48 : 0,
        reason: "Recent home calculator usage",
        signal: (value) => ({ id: "home-calculator", label: "You were just checking affordability", value, detail: "Using home or EMI calculators usually means this workflow is the next useful step." }),
      },
      {
        id: "home-balance",
        evaluate: (context) => {
          const profile = context.profile;
          if (!profile?.monthlyIncome || !profile?.emergencyFund) return 0;
          return profile.emergencyFund > profile.monthlyIncome * 6 ? 18 : 0;
        },
        reason: "Stronger cash position",
        signal: (value) => ({ id: "home-balance", label: "Affordability signals look stronger", value, detail: "A healthier cash position makes a house-buying check more relevant." }),
      },
    ],
  },
  {
    slug: "rent-vs-buy",
    rules: [
      {
        id: "home-goal",
        evaluate: (context) => (containsAny(profileGoals(context.profile), ["home", "house", "property"]) ? 30 : 0),
        reason: "Housing decision is active",
        signal: (value) => ({ id: "rent-buy-goal", label: "Housing trade-off is active", value, detail: "Your goals suggest you're thinking about where to live." }),
      },
      {
        id: "home-calculator",
        evaluate: (context) => countMatchingCalculators(context, ["rent-vs-buy-calculator", "home-affordability-calculator"]) ? 52 : 0,
        reason: "Rent-versus-buy is timely",
        signal: (value) => ({ id: "rent-buy-calculator", label: "Rent-versus-buy fit", value, detail: "Recent housing calculator usage is a strong signal for this workflow." }),
      },
      {
        id: "conservative-risk",
        evaluate: (context) => (profileRisk(context.profile) === "conservative" ? 16 : 0),
        reason: "Conservative risk posture",
        signal: (value) => ({ id: "rent-buy-risk", label: "Safer housing comparison", value, detail: "Conservative profiles often benefit from comparing rent and buy more carefully." }),
      },
    ],
  },
  {
    slug: "job-switch",
    rules: [
      {
        id: "career-goal",
        evaluate: (context) => (containsAny(profileGoals(context.profile), ["career", "job", "work", "switch", "promotion"]) ? 44 : 0),
        reason: "Career goal",
        signal: (value) => ({ id: "career-goal", label: "Career move is a goal", value, detail: "Your profile goals mention career growth or change." }),
      },
      {
        id: "career-history",
        evaluate: (context) => hasDecision(context, ["job-switch"]) ? 18 : 0,
        reason: "Career exploration already started",
        signal: (value) => ({ id: "career-history", label: "Career decision already underway", value, detail: "You have recent career-related decision activity." }),
      },
      {
        id: "career-risk",
        evaluate: (context) => (profileRisk(context.profile) === "balanced" || profileRisk(context.profile) === "growth" ? 10 : 0),
        reason: "Career-fit can benefit from a broader lens",
        signal: (value) => ({ id: "career-risk", label: "Career exploration seems relevant", value, detail: "Your risk profile suggests you're open to weighing trade-offs." }),
      },
    ],
  },
  {
    slug: "buy-car",
    rules: [
      {
        id: "car-goal",
        evaluate: (context) => (containsAny(profileGoals(context.profile), ["car", "vehicle", "mobility", "commute"]) ? 34 : 0),
        reason: "Vehicle goal",
        signal: (value) => ({ id: "car-goal", label: "Vehicle need is explicit", value, detail: "Your goals mention mobility or a vehicle." }),
      },
      {
        id: "car-calculator",
        evaluate: (context) => countMatchingCalculators(context, ["car-loan-calculator", "fuel-cost-calculator"]) ? 32 : 0,
        reason: "Vehicle calculator activity",
        signal: (value) => ({ id: "car-calculator", label: "Vehicle cost research", value, detail: "You recently compared vehicle costs or loan terms." }),
      },
    ],
  },
];

const profileRules: Array<(context: PersonalizationContext) => PersonalizedActionRecommendation | undefined> = [
  (context) => {
    const analysis = context.profileAnalysis;
    if (!analysis) return undefined;
    if (analysis.percentage >= 80) return undefined;
    return {
      id: "profile-complete-income",
      title: analysis.nextBestField?.label ?? "Complete your profile",
      description: analysis.nextBestField?.description ?? "Add the most useful missing field to improve decision quality.",
      href: "/decision/saved",
      type: "profile",
    };
  },
  (context) => {
    const profile = context.profile;
    if (!profile?.riskProfile) return undefined;
    if (profile.riskProfile !== "conservative") return undefined;
    return {
      id: "profile-safe-flows",
      title: "Start with safer comparison flows",
      description: "Conservative profiles usually get more value from emergency-fund, loan-prepayment, and rent-versus-buy checks.",
      href: "/decision",
      type: "profile",
    };
  },
];

export function scorePersonalizedWorkflows(context: PersonalizationContext): PersonalizedWorkflowRecommendation[] {
  const scored = workflowRules
    .map(({ slug, rules }) => {
      const item = workflow(slug);
      if (!item) return undefined;
      return scoreWorkflowWithRules(context, item, rules);
    })
    .filter((item): item is ScoredWorkflow => Boolean(item))
    .sort((left, right) => right.score - left.score || left.workflow.title.localeCompare(right.workflow.title));

  return scored;
}

export function buildProfileRecommendations(context: PersonalizationContext): PersonalizedActionRecommendation[] {
  return profileRules.map((rule) => rule(context)).filter((item): item is PersonalizedActionRecommendation => Boolean(item));
}

export function deriveNextBestActions(context: PersonalizationContext, workflowRecommendations: PersonalizedWorkflowRecommendation[]): PersonalizedActionRecommendation[] {
  const actions: PersonalizedActionRecommendation[] = [];
  const top = workflowRecommendations.slice(0, 3);
  for (const item of top) {
    actions.push({
      id: `open-${item.workflow.slug}`,
      title: item.workflow.title,
      description: item.reason,
      href: `/decision/${item.workflow.pluginId}/${item.workflow.slug}`,
      type: "workflow",
    });
  }

  const goals = profileGoals(context.profile);
  if (containsAny(goals, ["debt", "loan", "emi"]) && !actions.some((item) => item.id === "open-loan-prepayment")) {
    const item = workflow("loan-prepayment");
    if (item) actions.push({ id: "open-loan-prepayment", title: item.title, description: "Your goals mention debt reduction.", href: `/decision/${item.pluginId}/${item.slug}`, type: "workflow" });
  }

  return actions.slice(0, 4);
}
