import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

/**
 * Export the on-screen A4 preview to a multi-page PDF.
 *
 * Strategy:
 *  - Clone the unscaled #resume-print-target page node into an off-screen
 *    container so we can measure / capture the FULL content height (the
 *    on-screen node is clipped to 1154px by the A4 frame).
 *  - Render the entire content to a single tall canvas at 2x.
 *  - Slice that canvas into A4-page-sized chunks and addImage() each chunk
 *    onto its own jsPDF page. This preserves the template's typography,
 *    margins, and 1:1.414 A4 proportions while paginating long résumés.
 */
const PAGE_W_PX = 816; // matches A4Preview design width
const PAGE_H_PX = Math.round(PAGE_W_PX * 1.414); // 1154

export type ExportOptions = {
  /** Page margin in millimeters (applied on all four sides). 0–25mm. */
  marginMm?: number;
  /** Content scale factor (0.6–1.1). <1 fits more vertical content per page. */
  scale?: number;
};

export async function exportResumeToPDF(
  filename: string,
  opts: ExportOptions = {},
) {
  const marginMm = clamp(opts.marginMm ?? 10, 0, 25);
  const scale = clamp(opts.scale ?? 1, 0.6, 1.1);
  const source = document.querySelector<HTMLElement>(
    "#resume-print-target > *",
  );
  if (!source) throw new Error("Resume preview not found");

  // Off-screen mount so we can measure the natural (un-clipped) height.
  const stage = document.createElement("div");
  stage.style.cssText = [
    "position:fixed",
    "left:-10000px",
    "top:0",
    `width:${PAGE_W_PX}px`,
    "background:#ffffff",
    "pointer-events:none",
    "z-index:-1",
  ].join(";");

  const clone = source.cloneNode(true) as HTMLElement;
  // Strip the fixed h=1154 the preview imposes; let content flow.
  clone.style.width = `${PAGE_W_PX}px`;
  clone.style.height = "auto";
  clone.style.minHeight = `${PAGE_H_PX}px`;

  stage.appendChild(clone);
  document.body.appendChild(stage);

  try {
    // Wait a frame so layout/fonts settle.
    await new Promise((r) => requestAnimationFrame(() => r(null)));

    const fullHeightPx = Math.max(clone.scrollHeight, PAGE_H_PX);

    const canvas = await html2canvas(clone, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      width: PAGE_W_PX,
      height: fullHeightPx,
      windowWidth: PAGE_W_PX,
      windowHeight: fullHeightPx,
    });

    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pdfWmm = pdf.internal.pageSize.getWidth(); // 210
    const pdfHmm = pdf.internal.pageSize.getHeight(); // 297
    const printWmm = pdfWmm - 2 * marginMm;
    const printHmm = pdfHmm - 2 * marginMm;

    // Drawn content width on the PDF page (mm). When scale<1 we shrink the
    // content uniformly inside the printable area so it occupies less width
    // (and proportionally less height per source-pixel) — this fits MORE
    // vertical content per page. A4 aspect of the page itself never changes.
    const drawWmm = printWmm * scale;
    const mmPerSrcPx = drawWmm / canvas.width;
    const srcPxPerPage = Math.max(1, Math.floor(printHmm / mmPerSrcPx));
    const totalPages = Math.max(1, Math.ceil(canvas.height / srcPxPerPage));
    const xOffsetMm = marginMm + (printWmm - drawWmm) / 2; // center horizontally

    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = srcPxPerPage;
    const ctx = sliceCanvas.getContext("2d")!;

    for (let i = 0; i < totalPages; i++) {
      const sy = i * srcPxPerPage;
      const sliceHeight = Math.min(srcPxPerPage, canvas.height - sy);

      sliceCanvas.height = sliceHeight;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      ctx.drawImage(
        canvas,
        0,
        sy,
        canvas.width,
        sliceHeight,
        0,
        0,
        canvas.width,
        sliceHeight,
      );

      const imgData = sliceCanvas.toDataURL("image/png");
      if (i > 0) pdf.addPage();
      const drawHmm = sliceHeight * mmPerSrcPx;
      pdf.addImage(imgData, "PNG", xOffsetMm, marginMm, drawWmm, drawHmm);
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(stage);
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}