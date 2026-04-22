import { useEffect, useRef, useState } from "react";
import { useResume } from "./ResumeContext";

/**
 * A4 dimensions: 210mm x 297mm  → aspect ratio 1 / 1.414 (≈ 0.7072)
 * We render the page at a fixed "design" pixel size (816 x 1154, ~96dpi)
 * and then CSS-transform: scale() it to fit the available container while
 * mathematically preserving the aspect ratio.
 */
const PAGE_W = 816;
const PAGE_H = Math.round(PAGE_W * 1.414); // 1154

export function A4Preview() {
  const { resume } = useResume();
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
      >
        <div
          className="origin-top-left bg-paper text-paper-ink shadow-[0_30px_60px_-20px_rgba(15,23,42,0.35),0_8px_20px_-8px_rgba(15,23,42,0.2)]"
          style={{
            width: PAGE_W,
            height: PAGE_H,
            transform: `scale(${scale})`,
          }}
        >
          <PaperContent />
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 right-4 rounded-full bg-foreground/80 px-2.5 py-1 font-mono text-[10px] tracking-wide text-background">
        A4 · {Math.round(scale * 100)}%
      </div>
    </div>
  );

  function PaperContent() {
    return (
      <div className="flex h-full w-full flex-col px-16 py-14 font-sans">
        {/* Header */}
        <header className="border-b-2 border-paper-rule pb-5">
          <h1 className="text-[34px] font-bold leading-tight tracking-tight">
            {resume.fullName || "Your Name"}
          </h1>
          <p className="mt-1 text-[15px] font-medium uppercase tracking-[0.18em] text-paper-accent">
            {resume.targetRole || resume.originalRole || "Target Role"}
          </p>
          <p className="mt-3 text-[11px] text-paper-muted">
            {[resume.email, resume.phone, resume.location]
              .filter(Boolean)
              .join("  ·  ")}
          </p>
        </header>

        {/* Summary */}
        {resume.summary && (
          <Section title="Profile">
            <p className="text-[12px] leading-[1.65] text-paper-ink/90">
              {resume.summary}
            </p>
          </Section>
        )}

        {/* Experience */}
        <Section title="Experience">
          <div className="space-y-5">
            {resume.experience.length === 0 && (
              <p className="text-[11px] italic text-paper-muted">
                No experience added yet.
              </p>
            )}
            {resume.experience.map((exp) => (
              <article key={exp.id}>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-[14px] font-semibold">
                    {exp.role || "Role"}
                    <span className="font-normal text-paper-muted">
                      {exp.company ? ` · ${exp.company}` : ""}
                    </span>
                  </h3>
                  {(exp.startDate || exp.endDate) && (
                    <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-wider text-paper-muted">
                      {[exp.startDate, exp.endDate].filter(Boolean).join(" — ")}
                    </span>
                  )}
                </div>
                {exp.bullets.length > 0 && (
                  <ul className="mt-2 space-y-1.5 pl-4">
                    {exp.bullets.map((b, i) => (
                      <li
                        key={i}
                        className="relative text-[12px] leading-[1.55] text-paper-ink/90 before:absolute before:-left-3 before:top-[0.55em] before:h-[3px] before:w-[3px] before:rounded-full before:bg-paper-ink"
                      >
                        {b || (
                          <span className="italic text-paper-muted">
                            empty bullet
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </Section>

        {/* Skills */}
        {resume.skills.length > 0 && (
          <Section title="Skills">
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {resume.skills.map((s, i) => (
                <span
                  key={`${s}-${i}`}
                  className="text-[12px] text-paper-ink/90"
                >
                  {s}
                  {i < resume.skills.length - 1 && (
                    <span className="ml-4 text-paper-rule">·</span>
                  )}
                </span>
              ))}
            </div>
          </Section>
        )}

        <div className="mt-auto pt-6 text-center font-mono text-[9px] uppercase tracking-[0.3em] text-paper-rule">
          Crafted in Resume Forge
        </div>
      </div>
    );
  }
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.25em] text-paper-accent">
        {title}
      </h2>
      {children}
    </section>
  );
}