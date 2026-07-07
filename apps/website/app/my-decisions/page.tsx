import { redirect } from "next/navigation";

export default function MyDecisionsPage() {
  redirect("/decision/saved");
}
