import { AlertTriangle, ArrowRight, CheckCircle, ShieldCheck, XCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { GapAnalysisResult } from "@/utils/aiMockEngine";

interface Props {
  gapAnalysis: GapAnalysisResult;
  strictMode: boolean;
  onStrictModeChange: (v: boolean) => void;
  onEnterEditor: () => void;
}

const COLUMNS = [
  {
    key: "strongMatches" as const,
    title: "Strong Matches",
    subtitle: "Skills the candidate already has",
    Icon: CheckCircle,
    iconClass: "text-emerald-600 dark:text-emerald-400",
    ring: "border-emerald-500/30 bg-emerald-500/5",
    pill: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  {
    key: "partialMatches" as const,
    title: "Transferable",
    subtitle: "Reframe these from existing experience",
    Icon: AlertTriangle,
    iconClass: "text-amber-600 dark:text-amber-400",
    ring: "border-amber-500/30 bg-amber-500/5",
    pill: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  {
    key: "missingGaps" as const,
    title: "Missing Gaps",
    subtitle: "Not present — do not invent",
    Icon: XCircle,
    iconClass: "text-rose-600 dark:text-rose-400",
    ring: "border-rose-500/30 bg-rose-500/5",
    pill: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
];

export function GapAnalysisDashboard({
  gapAnalysis,
  strictMode,
  onStrictModeChange,
  onEnterEditor,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map(({ key, title, subtitle, Icon, iconClass, ring, pill }) => {
          const items = gapAnalysis[key];
          return (
            <div key={key} className={`rounded-xl border p-4 ${ring}`}>
              <div className="mb-3 flex items-start gap-2">
                <Icon className={`mt-0.5 h-5 w-5 flex-none ${iconClass}`} />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-foreground">{title}</h4>
                  <p className="text-[11px] leading-snug text-muted-foreground">{subtitle}</p>
                </div>
                <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                  {items.length}
                </span>
              </div>
              {items.length === 0 ? (
                <p className="text-xs italic text-muted-foreground">None.</p>
              ) : (
                <ul className="flex flex-wrap gap-1.5">
                  {items.map((s) => (
                    <li
                      key={s}
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${pill}`}
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <div
        className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${
          strictMode ? "border-emerald-500/40 bg-emerald-500/5" : "border-border bg-background"
        }`}
      >
        <div
          className={`mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full ${
            strictMode
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="dashboard-strict" className="cursor-pointer text-sm font-semibold">
              Strict Mode: Rephrase Only{" "}
              <span
                className={
                  strictMode
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground"
                }
              >
                (Zero Hallucinations)
              </span>
            </label>
            <Switch
              id="dashboard-strict"
              checked={strictMode}
              onCheckedChange={onStrictModeChange}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>
          <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">
            AI will only rephrase existing experience to highlight transferable skills. It will
            never invent new metrics, responsibilities, or facts.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onEnterEditor}
        className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5"
      >
        Enter Editor
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}