import { useState, type DragEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  CheckCircle2,
  Check,
  Download,
  FileText,
  Info,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import { useResume } from "./ResumeContext";
import type { TemplateId } from "./types";
import { Switch } from "@/components/ui/switch";
import { GapAnalysisDashboard } from "@/components/GapAnalysisDashboard";
import { simulateAIAnalysis } from "@/utils/aiMockEngine";
import { GapAnalysisView } from "@/components/GapAnalysisView";
import { generateGapAnalysis } from "@/utils/analysisLogic";
import { Skeleton } from "@/components/ui/skeleton";
import { exportResumeToPDF } from "@/utils/pdfExport";
import { ExportPreview } from "@/components/ExportPreview";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const STEPS = [
  { id: 1, label: "Ingest" },
  { id: 2, label: "Edit" },
  { id: 3, label: "Export" },
] as const;

export function Wizard() {
  const { step, setStep, analyzed, resetResume } = useResume();

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border bg-background/80 px-8 py-5 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Resume Forge
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">
              Tailor your resume for the role
            </h1>
          </div>
          <button
            type="button"
            onClick={resetResume}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
        <Stepper />
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-8">
        {step === 1 && <StepIngest />}
        {step === 2 && <StepEdit />}
        {step === 3 && <StepExport />}
      </div>

      <footer className="flex items-center justify-between border-t border-border bg-background px-8 py-4">
        <button
          type="button"
          onClick={() => setStep((Math.max(1, step - 1) as 1 | 2 | 3))}
          disabled={step === 1}
          className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Back
        </button>
        <p className="text-xs text-muted-foreground">
          Step {step} of {STEPS.length}
        </p>
        <button
          type="button"
          onClick={() => setStep((Math.min(3, step + 1) as 1 | 2 | 3))}
          disabled={step === 3 || (step === 1 && !analyzed)}
          className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:hover:bg-primary"
        >
          {step === 1 ? "Continue" : "Next"}
        </button>
      </footer>
    </div>
  );
}

function Stepper() {
  const { step, setStep, analyzed } = useResume();
  return (
    <ol className="mt-5 flex items-center gap-2">
      {STEPS.map((s, i) => {
        const active = step === s.id;
        const done = step > s.id;
        const canJump = s.id === 1 || analyzed;
        return (
          <li key={s.id} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              disabled={!canJump}
              onClick={() => setStep(s.id)}
              className={`flex flex-1 items-center gap-2 rounded-md border px-3 py-2 text-left transition-all ${
                active
                  ? "border-primary bg-primary/5 text-foreground"
                  : done
                    ? "border-border bg-muted/40 text-foreground"
                    : "border-border bg-background text-muted-foreground"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : done
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.id}
              </span>
              <span className="text-sm font-medium">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className="h-px w-2 bg-border" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ----------------------------- STEP 1 ----------------------------- */

function StepIngest() {
  const {
    runAnalysis,
    setAiAnalysis,
    setStrictMode,
    strictMode,
    setGapReport,
    analyzing: globalAnalyzing,
    setAnalyzing: setGlobalAnalyzing,
  } = useResume();
  const [file, setFile] = useState<File | null>(null);
  const [jd, setJd] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [rawExtractedText, setRawExtractedText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyzeAndMap = async () => {
    setAnalyzing(true);
    setGlobalAnalyzing(true);
    try {
      const [aiResult, gapReport] = await Promise.all([
        simulateAIAnalysis(rawExtractedText, jd),
        generateGapAnalysis(rawExtractedText, jd),
      ]);
      setAiAnalysis(aiResult);
      setGapReport(gapReport);
      runAnalysis();
    } finally {
      setAnalyzing(false);
      setGlobalAnalyzing(false);
    }
  };

  if (analyzing || globalAnalyzing) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <SectionHeader
          eyebrow="Step 01 · Analyzing"
          title="Mapping your resume to the role…"
          description="Extracting keywords, scoring overlap, and identifying transferable skills."
        />
        <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Running gap analysis…
        </div>
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <div className="grid gap-3 md:grid-cols-3">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  const handleFile = async (f: File) => {
    setFile(f);
    setRawExtractedText("");
    setParseError(null);
    if (f.type !== "application/pdf") return;
    setParsing(true);
    try {
      const { extractTextFromPDF } = await import("@/utils/pdfParser");
      const text = await extractTextFromPDF(f);
      setRawExtractedText(text);
      // eslint-disable-next-line no-console
      console.log("[pdfParser] extracted text:", text);
    } catch (err) {
      console.error("[pdfParser] failed:", err);
      setParseError(err instanceof Error ? err.message : "Failed to parse PDF");
    } finally {
      setParsing(false);
    }
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void handleFile(f);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <SectionHeader
        eyebrow="Step 01"
        title="Bring in your resume & target role"
        description="Drop your existing PDF and paste the job description. We'll align your experience to it."
      />

      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Current Resume (PDF)
        </label>
        <label
          htmlFor="pdf-input"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/30 hover:border-primary/60 hover:bg-primary/5"
          }`}
        >
          {file ? (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB · ready
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setFile(null);
                }}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" /> Remove
              </button>
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background text-muted-foreground transition-colors group-hover:text-primary">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Drop your PDF here, or click to browse
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  PDF up to 5MB · text-based resumes work best
                </p>
              </div>
            </>
          )}
          <input
            id="pdf-input"
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
        </label>
        {parsing && (
          <p className="text-xs text-muted-foreground">Extracting text…</p>
        )}
        {parseError && (
          <p className="text-xs text-destructive">{parseError}</p>
        )}
        {rawExtractedText && (
          <details className="rounded-md border border-border bg-muted/20 p-3 text-xs">
            <summary className="cursor-pointer font-medium text-muted-foreground">
              Extracted text preview ({rawExtractedText.length} chars)
            </summary>
            <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-relaxed text-foreground">
              {rawExtractedText}
            </pre>
          </details>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="jd-input"
          className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          Job Description
        </label>
        <textarea
          id="jd-input"
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste the job description for the Sales & Marketing Executive role…"
          className="min-h-[180px] w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed text-foreground outline-none ring-0 transition-colors placeholder:text-muted-foreground focus:border-primary"
        />
      </div>

      <button
        type="button"
        onClick={runAnalysis}
        className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5 hover:bg-foreground/90"
      >
        <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
        Simulate AI Analysis
      </button>

      <button
        type="button"
        onClick={handleAnalyzeAndMap}
        disabled={analyzing}
        className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5 disabled:opacity-80"
      >
        {analyzing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Mapping resume to job description…
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4 transition-transform group-hover:rotate-12" />
            Analyze &amp; Map
          </>
        )}
      </button>
      {/* keep strict mode reachable from ingest as well */}
      <p className="text-[11px] text-muted-foreground">
        Strict Mode is{" "}
        <button
          type="button"
          onClick={() => setStrictMode(!strictMode)}
          className="font-semibold underline-offset-2 hover:underline"
        >
          {strictMode ? "ON" : "OFF"}
        </button>{" "}
        — toggle anytime in the Gap Analysis dashboard.
      </p>
    </div>
  );
}

/* ----------------------------- STEP 2 ----------------------------- */

function StepEdit() {
  const {
    resume,
    setField,
    updateExperience,
    addExperience,
    removeExperience,
    addBullet,
    updateBullet,
    removeBullet,
    addSkill,
    updateSkill,
    removeSkill,
    editorView,
    setEditorView,
  } = useResume();

  const [skillDraft, setSkillDraft] = useState("");

  if (editorView === "gap") {
    return <GapAnalysisPanel />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-start justify-between gap-4">
        <SectionHeader
          eyebrow="Step 02 · Editor"
          title="Tune the narrative"
          description="Every keystroke updates the live A4 preview on the right. Tweak anything the AI generated — it's your story."
        />
        <button
          type="button"
          onClick={() => setEditorView("gap")}
          className="inline-flex flex-none items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Target className="h-3.5 w-3.5" /> Gap analysis
        </button>
      </div>

      <Card title="Identity">
        <Grid2>
          <Field
            label="Full Name"
            value={resume.fullName}
            onChange={(v) => setField("fullName", v)}
          />
          <Field
            label="Location"
            value={resume.location}
            onChange={(v) => setField("location", v)}
          />
          <Field
            label="Email"
            value={resume.email}
            onChange={(v) => setField("email", v)}
          />
          <Field
            label="Phone"
            value={resume.phone}
            onChange={(v) => setField("phone", v)}
          />
          <Field
            label="Original Role"
            value={resume.originalRole}
            onChange={(v) => setField("originalRole", v)}
          />
          <Field
            label="Target Role"
            value={resume.targetRole}
            onChange={(v) => setField("targetRole", v)}
            accent
          />
        </Grid2>
      </Card>

      <Card title="Profile Summary">
        <textarea
          value={resume.summary}
          onChange={(e) => setField("summary", e.target.value)}
          rows={4}
          className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed outline-none focus:border-primary"
        />
      </Card>

      <Card
        title="Experience"
        action={
          <button
            type="button"
            onClick={addExperience}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" /> Add role
          </button>
        }
      >
        <div className="space-y-5">
          {resume.experience.map((exp) => (
            <div
              key={exp.id}
              className="rounded-lg border border-border bg-muted/20 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="grid flex-1 grid-cols-2 gap-3">
                  <Field
                    label="Role / Title"
                    value={exp.role}
                    onChange={(v) => updateExperience(exp.id, { role: v })}
                  />
                  <Field
                    label="Company"
                    value={exp.company}
                    onChange={(v) => updateExperience(exp.id, { company: v })}
                  />
                  <Field
                    label="Start"
                    value={exp.startDate ?? ""}
                    onChange={(v) => updateExperience(exp.id, { startDate: v })}
                  />
                  <Field
                    label="End"
                    value={exp.endDate ?? ""}
                    onChange={(v) => updateExperience(exp.id, { endDate: v })}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeExperience(exp.id)}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Remove role"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Bullet points
                  </label>
                  <button
                    type="button"
                    onClick={() => addBullet(exp.id)}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Plus className="h-3 w-3" /> Add bullet
                  </button>
                </div>
                <ul className="space-y-2">
                  {exp.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-2.5 h-1.5 w-1.5 flex-none rounded-full bg-foreground" />
                      <input
                        type="text"
                        value={b}
                        onChange={(e) =>
                          updateBullet(exp.id, i, e.target.value)
                        }
                        className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary"
                      />
                      <SourceTraceability
                        original={exp.originalBullets?.[i]}
                        current={b}
                      />
                      <button
                        type="button"
                        onClick={() => removeBullet(exp.id, i)}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Remove bullet"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                  {exp.bullets.length === 0 && (
                    <li className="text-xs italic text-muted-foreground">
                      No bullets — add one to describe an achievement.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Skills">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {resume.skills.map((s, i) => (
              <div
                key={i}
                className="group flex items-center gap-1 rounded-full border border-border bg-background pl-3 pr-1 py-1 text-xs"
              >
                <input
                  value={s}
                  onChange={(e) => updateSkill(i, e.target.value)}
                  className="w-[8ch] min-w-0 bg-transparent outline-none"
                  style={{ width: `${Math.max(s.length, 4)}ch` }}
                />
                <button
                  type="button"
                  onClick={() => removeSkill(i)}
                  className="rounded-full p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Remove skill"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addSkill(skillDraft);
              setSkillDraft("");
            }}
            className="flex gap-2"
          >
            <input
              value={skillDraft}
              onChange={(e) => setSkillDraft(e.target.value)}
              placeholder="Add a skill and press Enter"
              className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-colors hover:bg-foreground/90"
            >
              Add
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
}

/* ----------------------------- STEP 3 ----------------------------- */

function StepExport() {
  const { template, setTemplate, resume } = useResume();
  const [exporting, setExporting] = useState(false);
  const [marginMm, setMarginMm] = useState(10);
  const [scale, setScale] = useState(1);

  const onDownload = async () => {
    setExporting(true);
    try {
      const safeName = (resume.fullName || "resume").replace(/\s+/g, "_");
      const tplLabel = TEMPLATE_OPTIONS.find((t) => t.id === template)?.label ?? template;
      await exportResumeToPDF(`${safeName}_${tplLabel}.pdf`, {
        marginMm,
        scale,
      });
      toast.success("PDF generated", {
        description: `Downloaded as ${safeName}_${tplLabel}.pdf`,
      });
    } catch (err) {
      toast.error("Export failed", {
        description: err instanceof Error ? err.message : "Unable to render PDF",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <SectionHeader
        eyebrow="Step 03 · Style & export"
        title="Pick a style, then ship it"
        description="Six ATS-clean templates — switch live, no data loss. Your A4 preview re-renders instantly and the PDF mirrors it exactly."
      />

      <Card title="Select Resume Style">
        <div className="mb-4">
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Quick switch
          </label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value as TemplateId)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {TEMPLATE_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label} — {opt.description}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TEMPLATE_OPTIONS.map((opt) => {
            const active = template === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTemplate(opt.id)}
                className={`group relative flex flex-col gap-3 rounded-xl border p-3 text-left transition-all ${
                  active
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-background hover:border-primary/50 hover:bg-muted/30"
                }`}
              >
                {active && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                )}
                <TemplateThumb id={opt.id} />
                <div>
                  <p className="text-sm font-semibold">{opt.label}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                    {opt.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card title="Export Settings">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Page margin
              </label>
              <span className="font-mono text-xs text-foreground">
                {marginMm} mm
              </span>
            </div>
            <Slider
              min={0}
              max={25}
              step={1}
              value={[marginMm]}
              onValueChange={(v) => setMarginMm(v[0] ?? 10)}
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              White border on all sides of every A4 page.
            </p>
          </div>
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Page scaling
              </label>
              <span className="font-mono text-xs text-foreground">
                {Math.round(scale * 100)}%
              </span>
            </div>
            <Slider
              min={60}
              max={110}
              step={5}
              value={[Math.round(scale * 100)]}
              onValueChange={(v) => setScale((v[0] ?? 100) / 100)}
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Smaller scale = more content per page. A4 aspect locked.
            </p>
          </div>
        </div>
      </Card>

      <Card title="Live PDF Preview">
        <p className="mb-4 text-[11px] text-muted-foreground">
          Mirrors what the exported PDF will look like with the current margin
          and scale. Each thumbnail is one A4 page.
        </p>
        <div className="max-h-[420px] overflow-y-auto rounded-lg border border-border bg-muted/30 p-4">
          <ExportPreview
            template={template}
            resume={resume}
            marginMm={marginMm}
            scale={scale}
          />
        </div>
      </Card>

      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-muted/30 px-6 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <FileText className="h-7 w-7" />
        </div>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your resume is rendered with the <strong className="text-foreground">{TEMPLATE_OPTIONS.find((t) => t.id === template)?.label}</strong> template. Hit the button below to export.
        </p>
        <button
          type="button"
          onClick={onDownload}
          disabled={exporting}
          className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3 text-sm font-semibold text-background shadow-lg transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting ? "Rendering PDF…" : "Download Final Resume"}
        </button>
      </div>
    </div>
  );
}

/* ----------------------------- GAP ANALYSIS ----------------------------- */

function GapAnalysisPanel() {
  const {
    gapAnalysis,
    isRewriting,
    autoRewrite,
    resume,
    setEditorView,
    rewritten,
    strictMode,
    setStrictMode,
    aiAnalysis,
    gapReport,
  } = useResume();
  const total = gapAnalysis.matching.length + gapAnalysis.missing.length;
  const matchPct = total === 0 ? 0 : Math.round((gapAnalysis.matching.length / total) * 100);

  // Preferred: rich gap report from generateGapAnalysis().
  if (gapReport) {
    return (
      <GapAnalysisView
        report={gapReport}
        strictMode={strictMode}
        onStrictModeChange={setStrictMode}
        onProceed={() => {
          if (!rewritten && !isRewriting) void autoRewrite();
          else setEditorView("edit");
        }}
      />
    );
  }

  // When the mock AI mapping engine has produced a result, prefer the new
  // 3-column dashboard view (Strong / Transferable / Missing).
  if (aiAnalysis) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mx-auto max-w-3xl space-y-8"
      >
        <SectionHeader
          eyebrow="Step 02 · Gap analysis"
          title="Where you stand vs. the role"
          description="The mock AI engine mapped your resume against the target Job Description. Review matches before entering the editor."
        />
        <GapAnalysisDashboard
          gapAnalysis={aiAnalysis.gapAnalysis}
          strictMode={strictMode}
          onStrictModeChange={setStrictMode}
          onEnterEditor={() => setEditorView("edit")}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-2xl space-y-8"
    >
      <SectionHeader
        eyebrow="Step 02 · Gap analysis"
        title="Where you stand vs. the role"
        description="We compared your resume against the target Job Description. Here's what aligns and what's missing."
      />

      <div className="rounded-2xl border border-border bg-gradient-to-br from-background to-muted/40 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Match score
            </p>
            <p className="mt-1 text-4xl font-bold tracking-tight">
              {matchPct}
              <span className="text-xl text-muted-foreground">%</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Target role</p>
            <p className="text-sm font-semibold">{resume.targetRole}</p>
          </div>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${matchPct}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SkillColumn
          title="Matching skills"
          count={gapAnalysis.matching.length}
          tone="match"
          skills={gapAnalysis.matching}
          emptyText="No matches yet — hit Auto-Rewrite below."
        />
        <SkillColumn
          title="Missing / gap skills"
          count={gapAnalysis.missing.length}
          tone="gap"
          skills={gapAnalysis.missing}
          emptyText="Nothing missing. You're aligned."
        />
      </div>

      <div className="space-y-3">
        <StrictModeToggle checked={strictMode} onChange={setStrictMode} disabled={isRewriting} />
        <motion.button
          type="button"
          onClick={autoRewrite}
          disabled={isRewriting}
          whileHover={isRewriting ? {} : { y: -2 }}
          whileTap={isRewriting ? {} : { scale: 0.98 }}
          className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary/80 px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-colors disabled:opacity-90"
        >
          {isRewriting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              AI is rewriting your resume…
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 transition-transform group-hover:rotate-12" />
              {rewritten ? "Rewrite again" : "Auto-Rewrite with AI"}
            </>
          )}
        </motion.button>
        {rewritten && !isRewriting && (
          <button
            type="button"
            onClick={() => setEditorView("edit")}
            className="w-full rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Skip to editor →
          </button>
        )}
      </div>
    </motion.div>
  );
}

function SkillColumn({
  title,
  count,
  tone,
  skills,
  emptyText,
}: {
  title: string;
  count: number;
  tone: "match" | "gap";
  skills: string[];
  emptyText: string;
}) {
  const dot =
    tone === "match"
      ? "bg-emerald-500"
      : "bg-orange-500";
  const pill =
    tone === "match"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300";

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${dot}`} />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
            {title}
          </h4>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
          {count}
        </span>
      </div>
      <AnimatePresence mode="popLayout">
        {skills.length === 0 ? (
          <p className="text-xs italic text-muted-foreground">{emptyText}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <motion.span
                key={s}
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.2 }}
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${pill}`}
              >
                {s}
              </motion.span>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ----------------------------- TEMPLATES META ----------------------------- */

const TEMPLATE_OPTIONS: {
  id: TemplateId;
  label: string;
  description: string;
}[] = [
  {
    id: "executive",
    label: "The Executive",
    description: "Serif, single column, traditional rules.",
  },
  {
    id: "modern",
    label: "The Modern",
    description: "Two columns, soft sidebar background.",
  },
  {
    id: "minimalist",
    label: "The Minimalist",
    description: "Sans-serif, generous whitespace.",
  },
  {
    id: "azurill",
    label: "Azurill",
    description: "Accent bar, pill skills, ATS-clean.",
  },
  {
    id: "onyx",
    label: "Onyx",
    description: "Dark slab header, bold corporate.",
  },
  {
    id: "rhyhorn",
    label: "Rhyhorn",
    description: "Centered classic serif, conservative.",
  },
];

function TemplateThumb({ id }: { id: TemplateId }) {
  if (id === "executive") {
    return (
      <div className="aspect-[1/1.2] w-full rounded-md border border-border bg-paper p-2 text-paper-ink shadow-inner">
        <div className="border-b-2 border-paper-ink/80 pb-1">
          <div className="h-2 w-2/3 rounded-sm bg-paper-ink/80" />
          <div className="mt-0.5 h-1 w-1/3 rounded-sm bg-paper-ink/40" />
        </div>
        <div className="mt-2 space-y-1">
          <div className="h-1 w-full rounded-sm bg-paper-ink/15" />
          <div className="h-1 w-5/6 rounded-sm bg-paper-ink/15" />
          <div className="h-1 w-4/6 rounded-sm bg-paper-ink/15" />
        </div>
      </div>
    );
  }
  if (id === "modern") {
    return (
      <div className="flex aspect-[1/1.2] w-full overflow-hidden rounded-md border border-border bg-paper text-paper-ink shadow-inner">
        <div className="w-1/3 bg-primary/15 p-1.5 space-y-1">
          <div className="h-1.5 w-full rounded-sm bg-primary/40" />
          <div className="h-1 w-3/4 rounded-sm bg-primary/30" />
          <div className="h-1 w-2/3 rounded-sm bg-primary/30" />
        </div>
        <div className="flex-1 p-1.5 space-y-1">
          <div className="h-1.5 w-1/2 rounded-sm bg-paper-ink/70" />
          <div className="h-1 w-full rounded-sm bg-paper-ink/15" />
          <div className="h-1 w-5/6 rounded-sm bg-paper-ink/15" />
        </div>
      </div>
    );
  }
  if (id === "azurill") {
    return (
      <div className="flex aspect-[1/1.2] w-full overflow-hidden rounded-md border border-border bg-paper text-paper-ink shadow-inner">
        <div className="w-1 bg-[oklch(0.55_0.18_250)]" />
        <div className="flex-1 p-2 space-y-1">
          <div className="h-2 w-2/3 rounded-sm bg-paper-ink/80" />
          <div className="h-1 w-1/3 rounded-sm bg-[oklch(0.55_0.18_250)]/70" />
          <div className="mt-1.5 space-y-1">
            <div className="h-0.5 w-full bg-paper-ink/15" />
            <div className="h-0.5 w-5/6 bg-paper-ink/15" />
          </div>
          <div className="mt-1 flex gap-0.5">
            <span className="h-1 w-3 rounded-sm border border-paper-ink/30" />
            <span className="h-1 w-4 rounded-sm border border-paper-ink/30" />
            <span className="h-1 w-3 rounded-sm border border-paper-ink/30" />
          </div>
        </div>
      </div>
    );
  }
  if (id === "onyx") {
    return (
      <div className="aspect-[1/1.2] w-full overflow-hidden rounded-md border border-border bg-paper text-paper-ink shadow-inner">
        <div className="bg-paper-ink p-1.5">
          <div className="h-1.5 w-2/3 rounded-sm bg-paper/90" />
          <div className="mt-0.5 h-0.5 w-1/3 rounded-sm bg-paper/60" />
        </div>
        <div className="p-2 space-y-1">
          <div className="inline-block h-1 w-6 bg-paper-ink" />
          <div className="h-0.5 w-full bg-paper-ink/15" />
          <div className="h-0.5 w-5/6 bg-paper-ink/15" />
        </div>
      </div>
    );
  }
  if (id === "rhyhorn") {
    return (
      <div className="aspect-[1/1.2] w-full rounded-md border border-border bg-paper p-2 text-paper-ink shadow-inner">
        <div className="text-center">
          <div className="mx-auto h-2 w-2/3 rounded-sm bg-paper-ink/80" />
          <div className="mx-auto mt-0.5 h-0.5 w-1/3 rounded-sm bg-paper-ink/40" />
        </div>
        <div className="mt-2 border-t border-paper-ink/40 pt-1">
          <div className="mx-auto h-1 w-1/3 rounded-sm bg-paper-ink/60" />
        </div>
        <div className="mt-1 space-y-0.5">
          <div className="h-0.5 w-full bg-paper-ink/15" />
          <div className="h-0.5 w-5/6 bg-paper-ink/15" />
        </div>
      </div>
    );
  }
  return (
    <div className="aspect-[1/1.2] w-full rounded-md border border-border bg-paper p-3 text-paper-ink shadow-inner">
      <div className="h-2 w-1/2 rounded-sm bg-paper-ink/80" />
      <div className="mt-1 h-1 w-1/4 rounded-sm bg-paper-ink/30" />
      <div className="mt-3 space-y-1.5">
        <div className="h-0.5 w-full bg-paper-ink/10" />
        <div className="h-0.5 w-5/6 bg-paper-ink/10" />
      </div>
    </div>
  );
}

/* ----------------------------- helpers ----------------------------- */

/**
 * Strict Mode toggle — surfaces the "Rephrase Only (Zero Hallucinations)"
 * guarantee directly above the Auto-Rewrite CTA. Active state is green to
 * signal a safety / trust affordance.
 */
function StrictModeToggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${
        checked
          ? "border-emerald-500/40 bg-emerald-500/5"
          : "border-border bg-background"
      }`}
    >
      <div
        className={`mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full ${
          checked
            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            : "bg-muted text-muted-foreground"
        }`}
      >
        <ShieldCheck className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor="strict-mode-switch"
            className="cursor-pointer text-sm font-semibold text-foreground"
          >
            Strict Mode: Rephrase Only{" "}
            <span
              className={
                checked
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground"
              }
            >
              (Zero Hallucinations)
            </span>
          </label>
          <Switch
            id="strict-mode-switch"
            checked={checked}
            onCheckedChange={onChange}
            disabled={disabled}
            className="data-[state=checked]:bg-emerald-500"
          />
        </div>
        <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">
          AI will only rephrase your existing experience to highlight transferable
          skills. It will never invent new metrics, responsibilities, or facts.
        </p>
      </div>
    </div>
  );
}

/**
 * Source Traceability — small Info icon next to each rewritten bullet.
 * Hover/focus reveals the ORIGINAL bullet it was derived from, proving the
 * rewrite is a semantic translation rather than a hallucination.
 * Renders nothing when there is no source (user-authored bullet).
 */
function SourceTraceability({
  original,
  current,
}: {
  original?: string;
  current: string;
}) {
  const hasSource = !!original && original.trim().length > 0;
  const wasRewritten = hasSource && original!.trim() !== current.trim();

  if (!hasSource) {
    return <span className="w-7 flex-none" aria-hidden />;
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Show original source bullet"
            className={`flex h-7 w-7 flex-none items-center justify-center rounded-md border transition-colors ${
              wasRewritten
                ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                : "border-border bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Original source
          </p>
          <p className="mt-1 text-xs leading-snug">{original}</p>
          {wasRewritten && (
            <p className="mt-2 text-[10px] italic text-muted-foreground">
              Rephrased — same fact, sales-aligned framing.
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-background p-5 shadow-sm">
      <header className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        {action}
      </header>
      {children}
    </section>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

function Field({
  label,
  value,
  onChange,
  accent = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  accent?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span
        className={`text-[10px] font-medium uppercase tracking-wider ${accent ? "text-primary" : "text-muted-foreground"}`}
      >
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary ${accent ? "border-primary/40" : "border-border"}`}
      />
    </label>
  );
}