import { useState, type DragEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  CheckCircle2,
  Check,
  Download,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  Trash2,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import { useResume } from "./ResumeContext";
import type { TemplateId } from "./types";

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
  const { runAnalysis } = useResume();
  const [file, setFile] = useState<File | null>(null);
  const [jd, setJd] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
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
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
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
  return (
    <div className="mx-auto max-w-xl space-y-8 text-center">
      <SectionHeader
        eyebrow="Step 03"
        title="Your resume is ready"
        description="Download a pixel-perfect PDF or jump back to refine the content."
      />
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-muted/30 px-6 py-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <FileText className="h-7 w-7" />
        </div>
        <p className="max-w-sm text-sm text-muted-foreground">
          PDF generation is wired in the next milestone. The button below is a
          placeholder for the export pipeline.
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </button>
      </div>
    </div>
  );
}

/* ----------------------------- helpers ----------------------------- */

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