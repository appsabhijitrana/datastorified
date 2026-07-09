"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Bot, Lightbulb, MessageSquareText, Sparkles, WandSparkles } from "lucide-react";
import { BottomSheet, Badge, Card, Chip, ProgressBar } from "@datastorified/ui/design-system";
import { AIInsightCard } from "@datastorified/ui/library";

type AssistantContext = {
  path: string;
  title: string;
  summary: string;
  prompts: string[];
  quickTips: string[];
  progress: number;
};

const defaultPrompts = [
  "Explain this result simply",
  "What changed the score most?",
  "What should I verify next?",
  "Help me compare the options",
];

export function DecisionAssistantDock({ path, isLoggedIn }: { path: string; isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [activePrompt, setActivePrompt] = useState(defaultPrompts[0]);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("ds-open-assistant", onOpen);
    return () => window.removeEventListener("ds-open-assistant", onOpen);
  }, []);

  const context = useMemo(() => getAssistantContext(path, isLoggedIn), [isLoggedIn, path]);
  const response = useMemo(() => getMockResponse(activePrompt, context), [activePrompt, context]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-4 z-40 inline-flex min-h-14 max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full bg-gradient-to-br from-primary to-accent px-5 text-sm font-bold text-white shadow-glow transition hover:-translate-y-0.5 md:bottom-6"
      >
        <Bot size={16} />
        AI assistant
      </button>

      <BottomSheet
        open={open}
        title="AI assistant"
        onClose={() => setOpen(false)}
      >
        <div className="space-y-4">
          <Card className="border-primary/15 bg-gradient-to-br from-primary/[.05] to-accent/[.06] p-4">
            <div className="flex items-start gap-3">
              <span className="ds-icon-wrap"><Sparkles size={18} /></span>
              <div>
                <p className="text-sm font-semibold text-ink">{context.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted">{context.summary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{isLoggedIn ? "Sync-aware" : "Local-only"}</Badge>
                  <Badge>Safe mock responses</Badge>
                </div>
              </div>
            </div>
          </Card>

          <section className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Suggested prompts</p>
            <div className="flex flex-wrap gap-2">
              {[...context.prompts, ...defaultPrompts].slice(0, 6).map((prompt) => (
                <Chip key={prompt} selected={prompt === activePrompt} onClick={() => setActivePrompt(prompt)}>
                  {prompt}
                </Chip>
              ))}
            </div>
          </section>

          <AIInsightCard title="Assistant response">
            {response}
          </AIInsightCard>

          <section className="grid gap-3 sm:grid-cols-2">
            <PromptCard title="From scratch" icon={<WandSparkles size={18} />} text="Help me decide from scratch" onClick={() => setActivePrompt("Help me decide from scratch")} />
            <PromptCard title="Scenario question" icon={<Lightbulb size={18} />} text="What if my assumptions change?" onClick={() => setActivePrompt("What if my assumptions change?")} />
            <PromptCard title="Result explanation" icon={<MessageSquareText size={18} />} text="Why did this option score higher?" onClick={() => setActivePrompt("Why did this option score higher?")} />
            <PromptCard title="Next steps" icon={<Sparkles size={18} />} text="What should I verify next?" onClick={() => setActivePrompt("What should I verify next?")} />
          </section>

          <Card className="border-dashed border-border bg-soft/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">Context status</p>
                <p className="mt-1 text-sm leading-6 text-muted">The assistant uses the current page context and simple mock responses. No backend AI is required.</p>
              </div>
              <ProgressBar value={context.progress} className="min-w-28" />
            </div>
          </Card>
        </div>
      </BottomSheet>
    </>
  );
}

function PromptCard({ title, text, icon, onClick }: { title: string; text: string; icon: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-border bg-white p-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lift"
    >
      <div className="flex items-start gap-3">
        <span className="ds-icon-wrap">{icon}</span>
        <div className="min-w-0">
          <p className="font-semibold text-ink">{title}</p>
          <p className="mt-1 text-sm leading-6 text-muted">{text}</p>
        </div>
      </div>
    </button>
  );
}

function getAssistantContext(path: string, isLoggedIn: boolean): AssistantContext {
  if (path.startsWith("/decision/result/")) {
    return {
      path,
      title: "Result explanation",
      summary: "Ask about the score breakdown, trade-offs, risk, or what could change the current result.",
      prompts: ["Why did this option score higher?", "What can change this result?", "Show the trade-offs", "What should I verify next?"],
      quickTips: ["Use the score breakdown", "Review assumptions", "Compare options side-by-side"],
      progress: 88,
    };
  }

  if (path.startsWith("/decision/") && path.endsWith("/start")) {
    return {
      path,
      title: "Decision journey help",
      summary: "Get guidance on the question flow, why a question matters, and how to move through the decision step by step.",
      prompts: ["Why is this question asked?", "How should I think about this step?", "What if I skip?", "How does progress work?"],
      quickTips: ["One question at a time", "Autosave stays on", "You can skip supported questions"],
      progress: 72,
    };
  }

  if (path.startsWith("/explore") || path.startsWith("/category/")) {
    return {
      path,
      title: "Help deciding from scratch",
      summary: "Ask for quick comparisons, related decisions, or the best place to start from the discovery pages.",
      prompts: ["Which decision should I start with?", "Help me compare two options", "Show me quick decisions", "What relates to this topic?"],
      quickTips: ["Search a decision", "Use category filters", "Start a quick 2-minute decision"],
      progress: 62,
    };
  }

  if (path.startsWith("/my-decisions") || path.startsWith("/decision/saved")) {
    return {
      path,
      title: "Library helper",
      summary: "Ask about drafts, saved results, review reminders, or how to continue a decision you already started.",
      prompts: ["Continue my draft", "Explain this saved result", "What needs review?", "What should I revisit next?"],
      quickTips: ["Drafts are local-first", "Saved results stay organized", "Share or recalculate safely"],
      progress: 80,
    };
  }

  return {
    path,
    title: "Decision assistant",
    summary: isLoggedIn ? "Use the assistant for context-aware guidance across the app." : "Use the assistant while keeping exploration anonymous.",
    prompts: defaultPrompts,
    quickTips: ["Summarize a result", "Explain a trade-off", "Find a next decision"],
    progress: isLoggedIn ? 74 : 58,
  };
}

function getMockResponse(prompt: string, context: AssistantContext) {
  const lower = prompt.toLowerCase();
  if (lower.includes("why") && lower.includes("score")) {
    return "The score is usually driven by your inputs, factor weights, and how closely each option matches your stated preferences. Check the score breakdown to see which factors mattered most.";
  }
  if (lower.includes("trade-off")) {
    return "A trade-off view helps you see what you gain, what you give up, and which option fits the current context best. That keeps the result educational instead of advisory.";
  }
  if (lower.includes("skip")) {
    return "Skipping is allowed for supported steps. The flow keeps autosave on so you can return later without losing progress.";
  }
  if (lower.includes("result") || lower.includes("explain")) {
    return `On ${context.title.toLowerCase()}, the current result is a preview based on your answers and local context. Review the supporting factors, compare options, and change assumptions to see how the preview shifts.`;
  }
  if (lower.includes("scratch") || lower.includes("start")) {
    return "Start from the most familiar category, then narrow to the options you already compare in real life. Quick decisions are a good first step when you want momentum.";
  }
  if (lower.includes("scenario") || lower.includes("what if")) {
    return "Scenario questions help you test how the preview changes when assumptions shift. Try changing one variable at a time so you can see what matters most.";
  }
  return `${context.summary} Helpful next steps: ${context.quickTips.join(" · ")}.`;
}
