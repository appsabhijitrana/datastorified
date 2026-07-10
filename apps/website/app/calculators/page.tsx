import { createMetadata } from "@datastorified/seo";
import CalculatorsHomeClient from "./CalculatorsHomeClient";

export const metadata = createMetadata("Smart Calculators — DataStorified", "Visual, guided financial and everyday calculators.", "datastorified.com", "/calculators");

export default function CalculatorsHome() {
  return <CalculatorsHomeClient />;
}
