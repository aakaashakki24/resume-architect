import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useResume } from "./ResumeContext";
import type { ResumeState, TemplateId } from "./types";

/**
 * A4 dimensions: 210mm x 297mm  → aspect ratio 1 / 1.414 (≈ 0.7072)
 * We render the page at a fixed "design" pixel size (816 x 1154, ~96dpi)
 * and then CSS-transform: scale() it to fit the available container while
 * mathematically preserving the aspect ratio.
 */
const PAGE_W = 816;
const PAGE_H = Math.round(PAGE_W * 1.414); // 1154

export function A4Preview() {
  const { resume, template, analyzing } = useResume();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const compute = () => {
      const padding = 48; // breathing room around paper
      const availW = el.clientWidth - padding;
      const availH = el.clientHeight - padding;
      if (availW <= 0 || availH <= 0) return;
      const s = Math.min(availW / PAGE_W, availH / PAGE_H);
      setScale(Math.max(0.1, s));
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-canvas"
    >
      {/* Outer box reserves the *scaled* footprint so flex centering is exact */}
      <div
        style={{
          width: PAGE_W * scale,
          height: PAGE_H * scale,
        }}
        className={`transition-all duration-300 ${analyzing ? "scale-[0.98] opacity-50 blur-[2px]" : ""}`}
      >
        <div
          className="origin-top-left bg-paper text-paper-ink shadow-[0_30px_60px_-20px_rgba(15,23,42,0.35),0_8px_20px_-8px_rgba(15,23,42,0.2)]"
          style={{
            width: PAGE_W,
            height: PAGE_H,
            transform: `scale(${scale})`,
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={template}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ width: PAGE_W, height: PAGE_H }}
            >
              {template === "executive" && <ExecutiveTemplate resume={resume} />}
              {template === "modern" && <ModernTemplate resume={resume} />}
              {template === "minimalist" && <MinimalistTemplate resume={resume} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 right-4 rounded-full bg-foreground/80 px-2.5 py-1 font-mono text-[10px] tracking-wide text-background">
        A4 · {TEMPLATE_LABEL[template]} · {Math.round(scale * 100)}%
      </div>
    </div>
  );
}

const TEMPLATE_LABEL: Record<TemplateId, string> = {
  executive: "Executive",
  modern: "Modern",
  minimalist: "Minimalist",
};

/* ============================================================
 * TEMPLATE 1 — THE EXECUTIVE
 * Serif, single column, heavy top borders, traditional.
 * ============================================================ */
function ExecutiveTemplate({ resume }: { resume: ResumeState }) {
  return (
    <div
      className="flex h-full w-full flex-col px-16 py-14 text-paper-ink"
      style={{ fontFamily: '"Merriweather", "Source Serif Pro", Georgia, serif' }}
    >
      <header className="border-y-4 border-double border-paper-ink py-4 text-center">
        <h1 className="text-[36px] font-bold leading-none tracking-tight">
          {resume.fullName || "Your Name"}
        </h1>
        <p className="mt-2 text-[13px] uppercase tracking-[0.35em] text-paper-ink/70">
          {resume.targetRole || resume.originalRole || "Target Role"}
        </p>
        <p className="mt-3 text-[10.5px] tracking-wide text-paper-muted">
          {[resume.email, resume.phone, resume.location].filter(Boolean).join("  •  ")}
        </p>
      </header>

      {resume.summary && (
        <ExecSection title="Profile">
          <p className="text-[12px] leading-[1.7] text-paper-ink/90">{resume.summary}</p>
        </ExecSection>
      )}

      <ExecSection title="Professional Experience">
        <div className="space-y-4">
          {resume.experience.map((exp) => (
            <article key={exp.id}>
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-[14px] font-bold">
                  {exp.role || "Role"}
                  <span className="font-normal italic text-paper-ink/70">
                    {exp.company ? `, ${exp.company}` : ""}
                  </span>
                </h3>
                {(exp.startDate || exp.endDate) && (
                  <span className="whitespace-nowrap text-[11px] italic text-paper-ink/70">
                    {[exp.startDate, exp.endDate].filter(Boolean).join(" – ")}
                  </span>
                )}
              </div>
              {exp.bullets.length > 0 && (
                <ul className="mt-1.5 list-disc space-y-1 pl-5">
                  {exp.bullets.map((b, i) => (
                    <li key={i} className="text-[12px] leading-[1.6] text-paper-ink/90">
                      {b || <span className="italic text-paper-muted">empty bullet</span>}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </ExecSection>

      {resume.skills.length > 0 && (
        <ExecSection title="Areas of Expertise">
          <p className="text-[12px] leading-[1.7] text-paper-ink/90">
            {resume.skills.join(" • ")}
          </p>
        </ExecSection>
      )}
    </div>
  );
}

function ExecSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 border-b-2 border-paper-ink pb-1 text-[12px] font-bold uppercase tracking-[0.3em]">
        {title}
      </h2>
      {children}
    </section>
  );
}

/* ============================================================
 * TEMPLATE 2 — THE MODERN
 * Two-column: 30% sidebar (soft color) + 70% main.
 * ============================================================ */
function ModernTemplate({ resume }: { resume: ResumeState }) {
  return (
    <div
      className="flex h-full w-full text-paper-ink"
      style={{ fontFamily: '"Inter", system-ui, -apple-system, sans-serif' }}
    >
      {/* Sidebar — 30% */}
      <aside className="flex w-[30%] flex-col gap-6 bg-[oklch(0.94_0.04_264)] px-7 py-12 text-paper-ink">
        <div>
          <h1 className="text-[24px] font-bold leading-tight">
            {resume.fullName || "Your Name"}
          </h1>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.15em] text-paper-accent">
            {resume.targetRole || resume.originalRole || "Target Role"}
          </p>
        </div>

        <ModernBlock title="Contact">
          <div className="space-y-1 text-[10.5px] text-paper-ink/85">
            {resume.email && <p className="break-all">{resume.email}</p>}
            {resume.phone && <p>{resume.phone}</p>}
            {resume.location && <p>{resume.location}</p>}
          </div>
        </ModernBlock>

        {resume.skills.length > 0 && (
          <ModernBlock title="Skills">
            <ul className="space-y-1.5 text-[11px] text-paper-ink/90">
              {resume.skills.map((s, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 flex-none rounded-full bg-paper-accent" />
                  {s}
                </li>
              ))}
            </ul>
          </ModernBlock>
        )}
      </aside>

      {/* Main — 70% */}
      <main className="flex-1 px-10 py-12">
        {resume.summary && (
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-paper-accent">
              Profile
            </h2>
            <p className="mt-2 text-[12px] leading-[1.65] text-paper-ink/90">
              {resume.summary}
            </p>
          </section>
        )}

        <section className="mt-7">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-paper-accent">
            Experience
          </h2>
          <div className="mt-3 space-y-5">
            {resume.experience.map((exp) => (
              <article key={exp.id} className="relative pl-4">
                <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-paper-accent" />
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-[13.5px] font-semibold">
                    {exp.role || "Role"}
                    <span className="font-normal text-paper-muted">
                      {exp.company ? ` · ${exp.company}` : ""}
                    </span>
                  </h3>
                  {(exp.startDate || exp.endDate) && (
                    <span className="whitespace-nowrap text-[10px] font-medium uppercase tracking-wider text-paper-muted">
                      {[exp.startDate, exp.endDate].filter(Boolean).join(" — ")}
                    </span>
                  )}
                </div>
                {exp.bullets.length > 0 && (
                  <ul className="mt-1.5 space-y-1 pl-3">
                    {exp.bullets.map((b, i) => (
                      <li
                        key={i}
                        className="relative text-[11.5px] leading-[1.55] text-paper-ink/90 before:absolute before:-left-3 before:top-[0.55em] before:h-[3px] before:w-[3px] before:rounded-full before:bg-paper-ink/60"
                      >
                        {b || <span className="italic text-paper-muted">empty bullet</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function ModernBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-paper-accent">
        {title}
      </h3>
      {children}
    </div>
  );
}

/* ============================================================
 * TEMPLATE 3 — THE MINIMALIST
 * Inter, generous whitespace, subtle gray meta.
 * ============================================================ */
function MinimalistTemplate({ resume }: { resume: ResumeState }) {
  return (
    <div
      className="flex h-full w-full flex-col px-20 py-20 text-paper-ink"
      style={{ fontFamily: '"Inter", system-ui, -apple-system, sans-serif' }}
    >
      <header>
        <h1 className="text-[40px] font-light leading-none tracking-tight">
          {resume.fullName || "Your Name"}
        </h1>
        <p className="mt-3 text-[12px] font-normal text-paper-muted">
          {resume.targetRole || resume.originalRole || "Target Role"}
          {(resume.email || resume.phone || resume.location) && (
            <span className="text-paper-rule">  ·  </span>
          )}
          <span className="text-paper-muted">
            {[resume.email, resume.phone, resume.location].filter(Boolean).join("  ·  ")}
          </span>
        </p>
      </header>

      {resume.summary && (
        <section className="mt-10">
          <p className="text-[13px] font-light leading-[1.75] text-paper-ink/85">
            {resume.summary}
          </p>
        </section>
      )}

      <section className="mt-12">
        <h2 className="mb-5 text-[10px] font-medium uppercase tracking-[0.4em] text-paper-muted">
          Experience
        </h2>
        <div className="space-y-7">
          {resume.experience.map((exp) => (
            <article key={exp.id} className="grid grid-cols-[120px_1fr] gap-6">
              <div className="text-[10.5px] font-light leading-tight text-paper-muted">
                {[exp.startDate, exp.endDate].filter(Boolean).join(" — ") || "—"}
              </div>
              <div>
                <h3 className="text-[13px] font-medium">
                  {exp.role || "Role"}
                  {exp.company && (
                    <span className="font-light text-paper-muted">
                      {" "}— {exp.company}
                    </span>
                  )}
                </h3>
                {exp.bullets.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {exp.bullets.map((b, i) => (
                      <li
                        key={i}
                        className="text-[12px] font-light leading-[1.6] text-paper-ink/85"
                      >
                        {b || <span className="italic text-paper-muted">empty bullet</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {resume.skills.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-[10px] font-medium uppercase tracking-[0.4em] text-paper-muted">
            Skills
          </h2>
          <p className="text-[12px] font-light leading-[1.8] text-paper-ink/85">
            {resume.skills.join("   ·   ")}
          </p>
        </section>
      )}
    </div>
  );
}