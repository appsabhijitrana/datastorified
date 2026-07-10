import { createMetadata } from "@datastorified/seo";
import ToolsHomeClient from "./ToolsHomeClient";

export const metadata = createMetadata("Online Tools — DataStorified", "Fast, private, client-side utilities for text, code, images, PDFs, and more.", "datastorified.com", "/tools");

export default function ToolsHome() {
  return <ToolsHomeClient />;
}
