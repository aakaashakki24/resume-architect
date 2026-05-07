import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { GapReport } from "@/utils/analysisLogic";

interface Props {
  report: GapReport;
  strictMode: boolean;
  onStrictModeChange: (v: boolean) => void;
  onProceed: () => void;
}

export function GapAnalysisView({
  report,
  strictMode,
  onStrictModeChange,
  onProceed,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-3xl space-y-6"
    >
      {/* Status bar */}
      <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-emerald-500/0 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-400">
              Analysis Complete
            </p>
            <p className="text-sm font-semibold">
              {report.matchPercent}% Keyword Match
            </p>
          </div>
        </div>
        <div className="hidden h-2 w-40 overflow-hidden rounded-full bg-emerald-900/10 sm:block">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${report.matchPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
          />
        </div>
      </div>

      {/* Three-column grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Strong matches */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="mb-3 flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-emerald-600 dark:text-emerald-400" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold">Strong Matches</h4>
              <p className="text-[11px] leading-snug text-muted-foreground">
                Already in your resume
              </p>
            </div>
            <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
              {report.strongMatches.length}
            </span>
          </div>
          <ul className="flex flex-wrap gap-1.5">
            {report.strongMatches.map((s) => (
              <li
                key={s}
                className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Transferable */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="mb-3 flex items-start gap-2">
            <Zap className="mt-0.5 h-5 w-5 flex-none text-amber-600 dark:text-amber-400" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold">Transferable</h4>
              <p className="text-[11px] leading-snug text-muted-foreground">
                Reframe these for the role
              </p>
            </div>
            <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
              {report.transferableSkills.length}
            </span>
          </div>
          <ul className="space-y-2">
            {report.transferableSkills.map((t) => (
              <li
                key={t.from}
                className="rounded-lg border border-amber-500/20 bg-background/50 p-2 text-[11px] leading-snug"
              >
                <span className="text-muted-foreground line-through">{t.from}</span>
                <ArrowRight className="mx-1 inline h-3 w-3 text-amber-600 dark:text-amber-400" />
                <span className="font-semibold text-amber-700 dark:text-amber-300">
                  {t.to}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Critical gaps */}
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
          <div className="mb-3 flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-none text-rose-600 dark:text-rose-400" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold">Critical Gaps</h4>
              <p className="text-[11px] leading-snug text-muted-foreground">
                Missing — will not invent
              </p>
            </div>
            <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
              {report.missingGaps.length}
            </span>
          </div>
          <ul className="flex flex-wrap gap-1.5">
            {report.missingGaps.map((s) => (
              <li
                key={s}
                className="inline-flex items-center rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-medium text-rose-700 dark:text-rose-300"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div
        className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${
          strictMode
            ? "border-emerald-500/40 bg-emerald-500/5"
            : "border-border bg-background"
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
            <label htmlFor="gap-strict" className="cursor-pointer text-sm font-semibold">
              Strict Mode{" "}
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
              id="gap-strict"
              checked={strictMode}
              onCheckedChange={onStrictModeChange}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>
          <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">
            AI will only rephrase existing experience to highlight transferable
            skills. It will never invent metrics, responsibilities, or facts.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onProceed}
        className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3.5 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5"
      >
        <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
        Proceed to AI Rephrase
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </button>
    </motion.div>
  );
}