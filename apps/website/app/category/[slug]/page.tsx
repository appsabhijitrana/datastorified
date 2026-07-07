import { notFound } from "next/navigation";
import {
  getAllDecisions,
  getDecisionCategories,
  getDecisionCategoryBySlug,
  getDecisionsByCategory,
} from "@datastorified/decision-os";
import { AppShell } from "../../../components/shell/AppShell";
import { CategoryDiscovery } from "../../../components/category/CategoryDiscovery";

export function generateStaticParams() {
  return getDecisionCategories().map((category) => ({ slug: category.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getDecisionCategoryBySlug(slug);
  if (!category) return { title: "Category | DataStorified", robots: { index: false, follow: false } };
  return {
    title: `${category.label} Decisions | DataStorified`,
    description: category.description,
    robots: { index: false, follow: false },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getDecisionCategoryBySlug(slug);
  if (!category) return notFound();

  const liveDecisions = getDecisionsByCategory(category.id);
  const comingSoonIdeas = getAllDecisions().filter((decision) => decision.category === category.label && decision.status !== "live");
  const relatedCategories = getDecisionCategories().filter((item) => item.id !== category.id).slice(0, 4);

  return (
    <AppShell>
      <CategoryDiscovery
        category={category}
        liveDecisions={liveDecisions}
        comingSoonIdeas={comingSoonIdeas}
        relatedCategories={relatedCategories}
      />
    </AppShell>
  );
}
