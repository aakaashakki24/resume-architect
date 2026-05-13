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

export async function exportResumeToPDF(filename: string) {
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
    const pageWmm = pdf.internal.pageSize.getWidth(); // 210
    const pageHmm = pdf.internal.pageSize.getHeight(); // 297

    // px-per-page in the rendered canvas (canvas was scaled 2x).
    const pxPerPage = PAGE_H_PX * 2;
    const totalPages = Math.max(1, Math.ceil(canvas.height / pxPerPage));

    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = pxPerPage;
    const ctx = sliceCanvas.getContext("2d")!;

    for (let i = 0; i < totalPages; i++) {
      const sy = i * pxPerPage;
      const sliceHeight = Math.min(pxPerPage, canvas.height - sy);

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
      // Map full slice → full A4. Last (short) slice keeps proportional height
      // so content isn't stretched.
      const drawHmm = (sliceHeight / pxPerPage) * pageHmm;
      pdf.addImage(imgData, "PNG", 0, 0, pageWmm, drawHmm);
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(stage);
  }
}