import { useEffect, useRef, useState } from "react";
import {
  A4_DESIGN_HEIGHT_PX,
  A4_DESIGN_WIDTH_PX,
  TemplateContent,
} from "@/resume/A4Preview";
import type { ResumeState, TemplateId } from "@/resume/types";

const A4_W_MM = 210;
const A4_H_MM = 297;

/**
 * Multi-page A4 preview that mirrors what the PDF export will produce
 * given the current margin (mm) and content scale settings.
 *
 * The A4 aspect ratio (1 : 1.414) is locked — only the inner printable
 * area changes with margin, and only the rendered content density changes
 * with scale.
 */
export function ExportPreview({
  template,
  resume,
  marginMm,
  scale,
  thumbWidth = 220,
}: {
  template: TemplateId;
  resume: ResumeState;
  marginMm: number;
  scale: number;
  thumbWidth?: number;
}) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [contentH, setContentH] = useState<number>(A4_DESIGN_HEIGHT_PX);

  // Re-measure when content / template / settings change.
  useEffect(() => {
    if (!measureRef.current) return;
    const h = measureRef.current.scrollHeight;
    if (h && Math.abs(h - contentH) > 1) setContentH(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, resume, marginMm, scale]);

  const printWmm = A4_W_MM - 2 * marginMm;
  const printHmm = A4_H_MM - 2 * marginMm;
  const drawWmm = printWmm * scale;
  const mmPerSrcPx = drawWmm / A4_DESIGN_WIDTH_PX;
  const srcPxPerPage = Math.max(1, printHmm / mmPerSrcPx);
  const pageCount = Math.max(1, Math.ceil(contentH / srcPxPerPage));

  const thumbHeight = thumbWidth * (A4_H_MM / A4_W_MM);
  const padPx = (marginMm / A4_W_MM) * thumbWidth;
  const innerW = thumbWidth - 2 * padPx;
  // Content-display scale inside the preview crop. Source content is
  // A4_DESIGN_WIDTH_PX wide; on the thumb it should occupy `scale × innerW`.
  const contentScale = (innerW * scale) / A4_DESIGN_WIDTH_PX;
  const xOffsetPx = (innerW - innerW * scale) / 2; // center horizontally

  return (
    <>
      {/* Off-screen measurement node — full natural-height render */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          left: -99999,
          top: 0,
          width: A4_DESIGN_WIDTH_PX,
          pointerEvents: "none",
          visibility: "hidden",
        }}
      >
        <div ref={measureRef}>
          <TemplateContent template={template} resume={resume} />
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-center gap-4">
        {Array.from({ length: pageCount }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div
              className="relative overflow-hidden rounded-sm border border-border bg-white shadow-[0_8px_20px_-12px_rgba(15,23,42,0.4)]"
              style={{ width: thumbWidth, height: thumbHeight }}
            >
              <div
                className="absolute"
                style={{
                  left: padPx + xOffsetPx,
                  top: padPx,
                  width: innerW * scale,
                  height: thumbHeight - 2 * padPx,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: A4_DESIGN_WIDTH_PX,
                    transform: `scale(${contentScale}) translateY(${-i * srcPxPerPage}px)`,
                    transformOrigin: "top left",
                  }}
                >
                  <TemplateContent template={template} resume={resume} />
                </div>
              </div>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">
              Page {i + 1} / {pageCount}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}