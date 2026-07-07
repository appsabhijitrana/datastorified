import { Compass, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { Button, Card } from "@datastorified/ui";

export function ResultEmptyState({
  title = "Decision result unavailable",
  description = "This result may have been cleared or created on another device.",
  actionLabel = "Open saved decisions",
  actionHref = "/decision/saved",
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <Card className="mx-auto max-w-xl p-10 text-center">
      <Compass className="mx-auto text-primary" size={34} aria-hidden="true" />
      <h1 className="mt-4 text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-muted">{description}</p>
      <Link href={actionHref}>
        <Button className="mt-6">{actionLabel}</Button>
      </Link>
    </Card>
  );
}

export function ResultErrorState({
  title = "Could not load this result",
  description = "Please try again or open your saved decisions.",
  actionLabel = "Open saved decisions",
  actionHref = "/decision/saved",
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <Card className="mx-auto max-w-xl p-10 text-center">
      <TriangleAlert className="mx-auto text-warning" size={34} aria-hidden="true" />
      <h1 className="mt-4 text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-muted">{description}</p>
      <Link href={actionHref}>
        <Button className="mt-6" variant="secondary">{actionLabel}</Button>
      </Link>
    </Card>
  );
}
