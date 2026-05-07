import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

/**
 * Export the on-screen A4 preview node to a multi-page-safe PDF.
 * The preview is rendered at design resolution (816x1154) but transformed
 * via CSS scale; we capture the *unscaled* inner page node for crisp output.
 *
 * ATS NOTE: This uses html2canvas → image-based PDF. For true text-searchable
 * ATS resumes, plug in @react-pdf/renderer in a follow-up; the template
 * components are already kept structurally clean (semantic h1/h2/ul) for that.
 */
export async function exportResumeToPDF(filename: string) {
  const node = document.querySelector<HTMLElement>(
    "#resume-print-target > *",
  );
  if (!node) throw new Error("Resume preview not found");

  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
  });

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgData = canvas.toDataURL("image/png");
  pdf.addImage(imgData, "PNG", 0, 0, pageW, pageH);
  pdf.save(filename);
}