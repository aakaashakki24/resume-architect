import { useEffect, useMemo, useRef, useState } from "react";
import {
  ATS_BASE_SIZES,
  parseATSMarkdown,
  type ATSBlock,
} from "@/utils/atsPdfRenderer";

/**
 * On-screen ATS resume preview rendered from raw Markdown using the same
 * parser the PDF exporter uses. Mirrors typography, margins and section gaps
 * of the generated PDF so what the user sees is what they download.
 *
 * Layout is in millimetres mapped to pixels at a fixed display width so the
 * preview stays visually identical regardless of container width.
 */

const A4_W_MM = 210;
const A4_H_MM = 297;
const PT_TO_PX = 1.3333; // 1pt = 1.3333px (CSS)
const LINE_HEIGHT = 1.15;

export function ATSPreview({
  markdown,
  marginMm,
  fontScale,
  displayWidthPx,
}: {
  markdown: string;
  marginMm: number;
  fontScale: number;
  displayWidthPx?: number;
}) {
  const blocks = useMemo(() => parseATSMarkdown(markdown), [markdown]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoWidth, setAutoWidth] = useState<number>(displayWidthPx ?? 600);

  useEffect(() => {
    if (displayWidthPx) return; // explicit override wins
    const el = containerRef.current;
    if (!el) return;
    const compute = () => {
      const w = el.clientWidth;
      if (w > 0) setAutoWidth(Math.min(w, 720));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [displayWidthPx]);

  const widthPx = displayWidthPx ?? autoWidth;

  // mm → px scale for the preview
  const mmToPx = widthPx / A4_W_MM;
  const pageHeightPx = A4_H_MM * mmToPx;
  const padPx = marginMm * mmToPx;
  const sectionGapPx = 4.2 * mmToPx;

  const sizePx = (basePt: number) => basePt * fontScale * PT_TO_PX;

  return (
    <div ref={containerRef} className="flex w-full flex-col items-center gap-3">
      <div
        className="relative bg-white text-black shadow-[0_8px_24px_-12px_rgba(15,23,42,0.45)] ring-1 ring-border"
        style={{
          width: widthPx,
          minHeight: pageHeightPx,
          paddingTop: padPx,
          paddingBottom: padPx,
          paddingLeft: padPx,
          paddingRight: padPx,
          fontFamily:
            'Helvetica, "Helvetica Neue", Arial, "Liberation Sans", sans-serif',
          lineHeight: LINE_HEIGHT,
        }}
      >
        {blocks.map((b, i) => (
          <BlockNode
            key={i}
            block={b}
            prev={blocks[i - 1]}
            sizePx={sizePx}
            sectionGapPx={sectionGapPx}
          />
        ))}
      </div>
      <span className="font-mono text-[10px] text-muted-foreground">
        ATS preview · {marginMm} mm margin · {Math.round(fontScale * 100)}% font scale
      </span>
    </div>
  );
}

function BlockNode({
  block,
  prev,
  sizePx,
  sectionGapPx,
}: {
  block: ATSBlock;
  prev: ATSBlock | undefined;
  sizePx: (pt: number) => number;
  sectionGapPx: number;
}) {
  switch (block.kind) {
    case "h1":
      return (
        <div
          style={{
            fontSize: sizePx(ATS_BASE_SIZES.name),
            fontWeight: 700,
            textAlign: "center",
            letterSpacing: 0.4,
            textTransform: "uppercase",
          }}
        >
          {block.text}
        </div>
      );
    case "contact":
      return (
        <div
          style={{
            fontSize: sizePx(ATS_BASE_SIZES.contact),
            textAlign: "center",
            marginBottom: sectionGapPx,
          }}
        >
          {block.lines.slice(0, 2).map((ln, i) => (
            <div key={i}>{ln}</div>
          ))}
        </div>
      );
    case "h2": {
      const needsGap = prev && prev.kind !== "h1" && prev.kind !== "contact";
      return (
        <div
          style={{
            marginTop: needsGap ? sectionGapPx : 0,
            marginBottom: 4,
            borderBottom: "1px solid #000",
            paddingBottom: 2,
          }}
        >
          <div
            style={{
              fontSize: sizePx(ATS_BASE_SIZES.h2),
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.3,
            }}
          >
            {block.text}
          </div>
        </div>
      );
    }
    case "h3":
      return (
        <div
          style={{
            fontSize: sizePx(ATS_BASE_SIZES.h3),
            fontWeight: 700,
            marginTop: 2,
          }}
        >
          {block.text}
        </div>
      );
    case "p":
      return (
        <div style={{ fontSize: sizePx(ATS_BASE_SIZES.body) }}>
          {block.text}
        </div>
      );
    case "li":
      return (
        <div
          style={{
            fontSize: sizePx(ATS_BASE_SIZES.body),
            display: "flex",
            gap: 6,
            paddingLeft: 4,
          }}
        >
          <span aria-hidden>•</span>
          <span style={{ flex: 1 }}>{block.text}</span>
        </div>
      );
  }
}