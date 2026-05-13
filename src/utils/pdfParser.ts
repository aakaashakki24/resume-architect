import * as pdfjsLib from "pdfjs-dist";

// Match worker version to installed pdfjs-dist version via CDN.
// unpkg mirrors npm exactly and serves the .mjs worker for v5+.
const PDFJS_VERSION = (pdfjsLib as unknown as { version: string }).version;
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

export async function extractTextFromPDF(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items
      .map((item) => ("str" in item ? (item as { str: string }).str : ""))
      .filter(Boolean);
    pages.push(strings.join(" "));
  }

  return pages.join("\n\n");
}