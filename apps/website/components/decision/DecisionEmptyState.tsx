import Link from "next/link";
import { Compass } from "lucide-react";
import { Button, Card } from "@datastorified/ui";

export function DecisionEmptyState({
  title = "Decision not found on this device",
  description = "This result may have been cleared or created in another browser.",
  actionLabel = "Start a new decision",
  actionHref = "/decision",
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
