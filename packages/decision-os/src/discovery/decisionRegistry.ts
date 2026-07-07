import { decisionPluginRegistry } from "../plugins";
import type { DecisionWorkflow } from "../types";

export type DecisionStatus = "live" | "coming_soon" | "draft";
export type DecisionDisclaimerType = "none" | "finance" | "insurance" | "legal" | "health";

export type DiscoveryDecision = {
  id: string;
  slug?: string;
  title: string;
  shortTitle: string;
  description: string;
  category: string;
  subcategory?: string;
  estimatedTime: string;
  factorCount: number;
  difficulty: "easy" | "medium" | "hard";
  popularityScore: number;
  trendingScore: number;
  tags: string[];
  searchKeywords: string[];
  aliases: string[];
  relatedDecisionSlugs: string[];
  isQuickDecision: boolean;
  isTrending: boolean;
  isPopular: boolean;
  status: DecisionStatus;
  disclaimerType: DecisionDisclaimerType;
};

export type DecisionCategoryEntry = {
  id: string;
  label: string;
  description: string;
  aliases: string[];
};

const workflowBySlug = new Map(decisionPluginRegistry.listWorkflows().map((workflow) => [workflow.slug, workflow] as const));

const categories: DecisionCategoryEntry[] = [
  { id: "money", label: "Money", description: "Investing, saving, and cash flow choices.", aliases: ["finance", "savings", "investment"] },
  { id: "career", label: "Career", description: "Job, growth, and work-fit choices.", aliases: ["job", "work", "salary"] },
  { id: "buying", label: "Buying", description: "Purchase timing and ownership choices.", aliases: ["vehicle", "shopping", "purchase"] },
  { id: "home", label: "Home", description: "Renting, buying, and housing decisions.", aliases: ["property", "housing", "rent"] },
  { id: "education", label: "Education", description: "Course and learning-path choices.", aliases: ["study", "course", "degree"] },
  { id: "insurance", label: "Insurance", description: "Protection and coverage decisions.", aliases: ["protection", "term", "health"] },
  { id: "travel", label: "Travel", description: "Trip and destination decisions.", aliases: ["vacation"] },
  { id: "business", label: "Business", description: "Startup and business planning choices.", aliases: ["startup", "company"] },
  { id: "lifestyle", label: "Lifestyle", description: "Daily life and device choices.", aliases: ["phone", "gadgets"] },
  { id: "government-schemes", label: "Government Schemes", description: "Public benefits and policy-linked choices.", aliases: ["schemes", "subsidies"] },
];

const registry: DiscoveryDecision[] = [
  {
    id: "fd-vs-sip",
    slug: "fd-vs-sip",
    title: "SIP or fixed deposit?",
    shortTitle: "FD vs SIP",
    description: "Choose using time horizon, risk capacity, liquidity, inflation, and expected outcomes.",
    category: "Money",
    subcategory: "Investing",
    estimatedTime: "3 min",
    factorCount: 5,
    difficulty: "medium",
    popularityScore: 100,
    trendingScore: 92,
    tags: ["investing", "risk", "returns", "liquidity"],
    searchKeywords: ["sip", "fd", "fixed deposit", "mutual fund", "investment", "save", "invest"],
    aliases: ["sip vs fd", "fixed deposit or sip", "fd vs sip", "mutual fund or fd"],
    relatedDecisionSlugs: ["emergency-fund", "loan-prepayment"],
    isQuickDecision: false,
    isTrending: true,
    isPopular: true,
    status: "live",
    disclaimerType: "finance",
  },
  {
    id: "rent-vs-buy",
    slug: "rent-vs-buy",
    title: "Should I rent or buy?",
    shortTitle: "Rent vs Buy",
    description: "Compare ownership economics with rent, flexibility, affordability, and time horizon.",
    category: "Home",
    subcategory: "Housing",
    estimatedTime: "5 min",
    factorCount: 7,
    difficulty: "hard",
    popularityScore: 98,
    trendingScore: 88,
    tags: ["home", "mortgage", "rent", "property"],
    searchKeywords: ["rent", "buy", "house", "home", "property", "mortgage"],
    aliases: ["rent vs buy", "rent or buy", "buy vs rent", "keep renting"],
    relatedDecisionSlugs: ["buy-house", "emergency-fund"],
    isQuickDecision: false,
    isTrending: true,
    isPopular: true,
    status: "live",
    disclaimerType: "finance",
  },
  {
    id: "ev-vs-petrol",
    slug: "ev-vs-petrol",
    title: "EV or petrol car?",
    shortTitle: "EV vs Petrol",
    description: "Compare running-cost savings, price premium, charging access, and holding period.",
    category: "Buying",
    subcategory: "Vehicle",
    estimatedTime: "4 min",
    factorCount: 6,
    difficulty: "medium",
    popularityScore: 90,
    trendingScore: 95,
    tags: ["car", "vehicle", "charging", "fuel", "mobility"],
    searchKeywords: ["ev", "electric car", "petrol car", "car", "fuel", "charging"],
    aliases: ["ev vs petrol", "electric or petrol", "electric car", "petrol car"],
    relatedDecisionSlugs: ["buy-car", "phone-comparison"],
    isQuickDecision: false,
    isTrending: true,
    isPopular: true,
    status: "live",
    disclaimerType: "finance",
  },
  {
    id: "job-switch",
    slug: "job-switch",
    title: "Should I switch jobs?",
    shortTitle: "Job Switch",
    description: "Compare compensation, growth, role fit, stability, and financial runway.",
    category: "Career",
    subcategory: "Work",
    estimatedTime: "3 min",
    factorCount: 5,
    difficulty: "medium",
    popularityScore: 94,
    trendingScore: 90,
    tags: ["salary", "offer", "career", "growth"],
    searchKeywords: ["job switch", "change job", "switch jobs", "career move", "salary", "offer"],
    aliases: ["switch jobs", "change job", "new job offer", "leave my job"],
    relatedDecisionSlugs: ["emergency-fund", "course-choice"],
    isQuickDecision: false,
    isTrending: true,
    isPopular: true,
    status: "live",
    disclaimerType: "none",
  },
  {
    id: "emergency-fund",
    slug: "emergency-fund",
    title: "How much emergency fund do I need?",
    shortTitle: "Emergency Fund",
    description: "Set a practical cash-buffer target based on expenses, dependants, stability, and savings.",
    category: "Money",
    subcategory: "Safety",
    estimatedTime: "2 min",
    factorCount: 4,
    difficulty: "easy",
    popularityScore: 88,
    trendingScore: 84,
    tags: ["buffer", "safety", "savings", "cash"],
    searchKeywords: ["emergency fund", "cash buffer", "rainy day fund", "safety savings"],
    aliases: ["emergency fund", "cash buffer", "rainy day fund", "safety savings"],
    relatedDecisionSlugs: ["fd-vs-sip", "job-switch"],
    isQuickDecision: true,
    isTrending: true,
    isPopular: true,
    status: "live",
    disclaimerType: "finance",
  },
  {
    id: "loan-prepayment",
    slug: "loan-prepayment",
    title: "Should I prepay my loan?",
    shortTitle: "Loan Prepayment",
    description: "Compare guaranteed interest savings with liquidity, penalties, and alternative returns.",
    category: "Money",
    subcategory: "Debt",
    estimatedTime: "4 min",
    factorCount: 4,
    difficulty: "medium",
    popularityScore: 82,
    trendingScore: 72,
    tags: ["debt", "interest", "repayment", "liquidity"],
    searchKeywords: ["loan prepayment", "prepay loan", "extra emi", "pay loan early"],
    aliases: ["prepay loan", "loan prepayment", "pay loan early", "extra emi"],
    relatedDecisionSlugs: ["emergency-fund", "fd-vs-sip"],
    isQuickDecision: false,
    isTrending: false,
    isPopular: true,
    status: "live",
    disclaimerType: "finance",
  },
  {
    id: "buy-house",
    slug: "buy-house",
    title: "Should I buy a house?",
    shortTitle: "Buy House",
    description: "Test affordability, liquidity, debt, stability, and ownership horizon before committing.",
    category: "Home",
    subcategory: "Purchase",
    estimatedTime: "5 min",
    factorCount: 5,
    difficulty: "hard",
    popularityScore: 97,
    trendingScore: 86,
    tags: ["property", "mortgage", "ownership", "housing"],
    searchKeywords: ["buy house", "buy a home", "purchase home", "home loan affordability"],
    aliases: ["buy house", "buy a house", "purchase home", "buy a home"],
    relatedDecisionSlugs: ["rent-vs-buy", "emergency-fund"],
    isQuickDecision: false,
    isTrending: true,
    isPopular: true,
    status: "live",
    disclaimerType: "finance",
  },
  {
    id: "buy-car",
    slug: "buy-car",
    title: "Should I buy a car now?",
    shortTitle: "Buy Car",
    description: "Balance usefulness and affordability against debt, depreciation, and safety reserves.",
    category: "Buying",
    subcategory: "Vehicle",
    estimatedTime: "4 min",
    factorCount: 4,
    difficulty: "medium",
    popularityScore: 80,
    trendingScore: 63,
    tags: ["car", "vehicle", "purchase", "transport"],
    searchKeywords: ["buy car", "purchase vehicle", "car now", "new car"],
    aliases: ["buy car", "purchase vehicle", "car now", "new car"],
    relatedDecisionSlugs: ["ev-vs-petrol"],
    isQuickDecision: false,
    isTrending: false,
    isPopular: false,
    status: "live",
    disclaimerType: "finance",
  },
  {
    id: "phone-comparison",
    shortTitle: "Phone Comparison",
    title: "iPhone vs Android?",
    description: "Compare ecosystem, budget, longevity, and use-case fit.",
    category: "Lifestyle",
    subcategory: "Devices",
    estimatedTime: "2 min",
    factorCount: 4,
    difficulty: "easy",
    popularityScore: 76,
    trendingScore: 81,
    tags: ["phone", "device", "lifestyle"],
    searchKeywords: ["iphone vs android", "phone comparison", "android phone", "iphone phone"],
    aliases: ["iPhone vs Android", "phone comparison", "android vs iphone"],
    relatedDecisionSlugs: ["ev-vs-petrol"],
    isQuickDecision: true,
    isTrending: true,
    isPopular: true,
    status: "coming_soon",
    disclaimerType: "none",
  },
];

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/gu, " ").replace(/\s+/gu, " ").trim();
}

function workflowToDecision(workflow: DecisionWorkflow): DiscoveryDecision {
  const meta = registry.find((decision) => decision.slug === workflow.slug);
  const category = categories.find((item) => item.label.toLowerCase() === (workflow.category ?? "").toLowerCase()) ?? categories[0];
  return meta ?? {
    id: workflow.id,
    slug: workflow.slug,
    title: workflow.title,
    shortTitle: workflow.title.replace(/^should i /i, "").replace(/\?$/, ""),
    description: workflow.description,
    category: category.label,
    subcategory: workflow.category,
    estimatedTime: "3 min",
    factorCount: workflow.weights.length || workflow.questions.length || 4,
    difficulty: "medium",
    popularityScore: 60,
    trendingScore: 50,
    tags: [...new Set([workflow.category ?? category.id, ...(workflow.intent.keywords ?? []), ...(workflow.aliases ?? []), ...(workflow.intent.aliases ?? [])])].filter(Boolean),
    searchKeywords: [...new Set([workflow.title, workflow.slug.replace(/-/gu, " "), workflow.description, ...(workflow.intent.keywords ?? []), ...(workflow.aliases ?? []), ...(workflow.intent.aliases ?? []), ...(workflow.intent.examples ?? [])])],
    aliases: [...new Set([...(workflow.aliases ?? []), ...(workflow.intent.aliases ?? [])])],
    relatedDecisionSlugs: [],
    isQuickDecision: workflow.questions.length <= 6,
    isTrending: false,
    isPopular: false,
    status: "live",
    disclaimerType: workflow.category === "investment" || workflow.category === "debt" ? "finance" : workflow.category === "safety" ? "health" : "none",
  };
}

const liveDecisionMap = new Map(decisionPluginRegistry.listWorkflows().map((workflow) => [workflow.slug, workflowToDecision(workflow)] as const));
const decisions = [...liveDecisionMap.values(), ...registry.filter((decision) => !decision.slug || !liveDecisionMap.has(decision.slug))];

export function getDecisionCategories(): DecisionCategoryEntry[] {
  return categories;
}

export function getDecisionCategoryBySlug(slug: string): DecisionCategoryEntry | undefined {
  const normalized = normalize(slug);
  return categories.find((category) => normalize(category.id) === normalized || normalize(category.label) === normalized || category.aliases.some((alias) => normalize(alias) === normalized));
}

export function getAllDecisions(): DiscoveryDecision[] {
  return [...decisions];
}

export function getLiveDecisions(): DiscoveryDecision[] {
  return decisions.filter((decision) => decision.status === "live" && decision.slug);
}

export function getPopularDecisions(): DiscoveryDecision[] {
  return getLiveDecisions().filter((decision) => decision.isPopular).sort((a, b) => b.popularityScore - a.popularityScore);
}

export function getTrendingDecisions(): DiscoveryDecision[] {
  return getLiveDecisions().filter((decision) => decision.isTrending).sort((a, b) => b.trendingScore - a.trendingScore);
}

export function getQuickDecisions(): DiscoveryDecision[] {
  return getLiveDecisions().filter((decision) => decision.isQuickDecision).sort((a, b) => a.factorCount - b.factorCount);
}

export function getDecisionsByCategory(category: string): DiscoveryDecision[] {
  const normalizedCategory = normalize(category);
  const matchedCategory = getDecisionCategoryBySlug(category);
  const aliases = matchedCategory ? [matchedCategory.label, matchedCategory.id, ...matchedCategory.aliases] : [category];
  return getLiveDecisions().filter((decision) => {
    const haystack = normalize([decision.category, decision.subcategory ?? "", decision.tags.join(" "), decision.searchKeywords.join(" "), decision.aliases.join(" ")].join(" "));
    return aliases.some((item) => haystack.includes(normalize(item))) || haystack.includes(normalizedCategory);
  });
}

export function getRelatedDecisions(slug: string): DiscoveryDecision[] {
  const decision = getDecisionBySlug(slug);
  if (!decision) return [];
  return decision.relatedDecisionSlugs
    .map((relatedSlug) => getDecisionBySlug(relatedSlug))
    .filter((item): item is DiscoveryDecision => item !== undefined && item.status === "live");
}

export function getDecisionBySlug(slug: string): DiscoveryDecision | undefined {
  return decisions.find((decision) => decision.slug === slug);
}

export function searchDecisions(query: string): DiscoveryDecision[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return getLiveDecisions();
  const tokens = normalizedQuery.split(" ").filter(Boolean);
  return getLiveDecisions()
    .map((decision) => {
      const haystack = normalize([
        decision.title,
        decision.shortTitle,
        decision.description,
        decision.category,
        decision.subcategory ?? "",
        decision.tags.join(" "),
        decision.searchKeywords.join(" "),
        decision.aliases.join(" "),
      ].join(" "));
      const score = tokens.reduce((total, token) => total + (haystack.includes(token) ? 1 : 0), 0) + (haystack.includes(normalizedQuery) ? 3 : 0);
      return { decision, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.decision.popularityScore - a.decision.popularityScore)
    .map(({ decision }) => decision);
}

export function getDecisionRoute(slug?: string): string | undefined {
  if (!slug) return undefined;
  const decision = getDecisionBySlug(slug);
  if (!decision || decision.status !== "live" || !decision.slug) return undefined;
  const workflow = workflowBySlug.get(decision.slug);
  return workflow ? `/decision/${workflow.pluginId}/${workflow.slug}` : undefined;
}

export function resolveDecisionRoute(input: string): string | undefined {
  const exact = getDecisionBySlug(input);
  if (exact?.slug) return getDecisionRoute(exact.slug);
  const direct = searchDecisions(input)[0];
  return direct?.slug ? getDecisionRoute(direct.slug) : undefined;
}

export function getCategoryRoute(slug: string): string | undefined {
  return getDecisionCategoryBySlug(slug) ? `/category/${slug}` : undefined;
}

export function getDiscoveryWorkflowCount(): number {
  return getLiveDecisions().length;
}
