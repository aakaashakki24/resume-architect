import jsPDF from "jspdf";

/**
 * Render an ATS-friendly, text-selectable PDF from raw Markdown.
 *
 * Strict rules enforced:
 *  - Single column. Markdown tables stripped.
 *  - Helvetica (web-safe sans-serif).
 *  - Line-height 1.15.
 *  - Exactly ~12pt vertical gap between major sections.
 *  - Contact header compressed to max 2 centered lines.
 *  - All text rendered via jsPDF text APIs → selectable & ATS-parseable.
 */

type Block =
  | { kind: "h1"; text: string }
  | { kind: "contact"; lines: string[] }
  | { kind: "h2"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "p"; text: string }
  | { kind: "li"; text: string };

const MARGIN_MM = 14;
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN_MM * 2;

// Typography (pt)
const SIZE_NAME = 18;
const SIZE_CONTACT = 9.5;
const SIZE_H2 = 11;
const SIZE_H3 = 10;
const SIZE_BODY = 10;

const LINE_HEIGHT = 1.15;
const SECTION_GAP_MM = 4.2; // ~12px equivalent

function ptToMm(pt: number) {
  return pt * 0.3528;
}

/** Strip markdown tables and normalize the text for single-column layout. */
function stripTables(md: string): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  for (const line of lines) {
    // table separator |---|---|
    if (/^\s*\|?\s*:?-{3,}/.test(line) && line.includes("|")) continue;
    // table row — convert to pipe-joined plain line so info isn't lost
    if (/^\s*\|.*\|\s*$/.test(line)) {
      const cells = line
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean);
      out.push(cells.join(" | "));
      continue;
    }
    out.push(line);
  }
  return out.join("\n");
}

/** Inline markdown stripping (bold/italic/code/links) — keep visible text. */
function stripInline(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[(.+?)\]\((.+?)\)/g, "$1 ($2)")
    .trim();
}

function parseMarkdown(md: string): Block[] {
  const cleaned = stripTables(md).split(/\r?\n/);
  const blocks: Block[] = [];

  // Detect contact line: first non-heading line containing • | or email/phone.
  let nameSeen = false;
  let contactCaptured = false;

  for (let raw of cleaned) {
    const line = raw.replace(/\s+$/g, "");
    if (!line.trim()) continue;

    if (/^#\s+/.test(line)) {
      blocks.push({ kind: "h1", text: stripInline(line.replace(/^#\s+/, "")) });
      nameSeen = true;
      continue;
    }
    if (/^##\s+/.test(line)) {
      blocks.push({ kind: "h2", text: stripInline(line.replace(/^##\s+/, "")) });
      continue;
    }
    if (/^###\s+/.test(line)) {
      blocks.push({ kind: "h3", text: stripInline(line.replace(/^###\s+/, "")) });
      continue;
    }
    if (/^\s*[-*+]\s+/.test(line)) {
      blocks.push({
        kind: "li",
        text: stripInline(line.replace(/^\s*[-*+]\s+/, "")),
      });
      continue;
    }

    const txt = stripInline(line);

    // Capture contact block immediately after the name (max 2 lines).
    if (nameSeen && !contactCaptured) {
      const looksContact =
        /[|•·]/.test(txt) ||
        /@/.test(txt) ||
        /\+?\d[\d\s().-]{6,}/.test(txt) ||
        /linkedin|github|portfolio/i.test(txt);
      if (looksContact) {
        const last = blocks[blocks.length - 1];
        if (last && last.kind === "contact" && last.lines.length < 2) {
          last.lines.push(txt);
        } else {
          blocks.push({ kind: "contact", lines: [txt] });
        }
        // Mark captured once we have hit the next non-contact line.
        continue;
      } else {
        contactCaptured = true;
      }
    }

    blocks.push({ kind: "p", text: txt });
  }

  return blocks;
}

export async function exportATSResumePDF(filename: string, markdown: string) {
  const blocks = parseMarkdown(markdown);
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  pdf.setFont("helvetica", "normal");

  let y = MARGIN_MM;

  const ensureSpace = (needed: number) => {
    if (y + needed > PAGE_H - MARGIN_MM) {
      pdf.addPage();
      y = MARGIN_MM;
    }
  };

  const writeLines = (
    text: string,
    sizePt: number,
    opts: {
      bold?: boolean;
      align?: "left" | "center";
      indent?: number;
      bullet?: boolean;
    } = {},
  ) => {
    pdf.setFont("helvetica", opts.bold ? "bold" : "normal");
    pdf.setFontSize(sizePt);
    const lineH = ptToMm(sizePt) * LINE_HEIGHT;
    const indent = opts.indent ?? 0;
    const bulletGap = opts.bullet ? 3.2 : 0;
    const wrapW = CONTENT_W - indent - bulletGap;
    const lines = pdf.splitTextToSize(text, wrapW) as string[];
    for (let i = 0; i < lines.length; i++) {
      ensureSpace(lineH);
      const x = MARGIN_MM + indent + bulletGap;
      if (opts.bullet && i === 0) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(sizePt);
        pdf.text("•", MARGIN_MM + indent, y + ptToMm(sizePt) * 0.85);
        pdf.setFont("helvetica", opts.bold ? "bold" : "normal");
      }
      if (opts.align === "center") {
        pdf.text(lines[i], PAGE_W / 2, y + ptToMm(sizePt) * 0.85, {
          align: "center",
        });
      } else {
        pdf.text(lines[i], x, y + ptToMm(sizePt) * 0.85);
      }
      y += lineH;
    }
  };

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const prev = blocks[i - 1];

    switch (b.kind) {
      case "h1":
        writeLines(b.text.toUpperCase(), SIZE_NAME, {
          bold: true,
          align: "center",
        });
        y += 1;
        break;
      case "contact": {
        // Max 2 compact centered lines.
        const lines = b.lines.slice(0, 2);
        for (const ln of lines) {
          writeLines(ln, SIZE_CONTACT, { align: "center" });
        }
        y += SECTION_GAP_MM;
        break;
      }
      case "h2": {
        if (prev && prev.kind !== "h1" && prev.kind !== "contact") {
          y += SECTION_GAP_MM;
        }
        writeLines(b.text.toUpperCase(), SIZE_H2, { bold: true });
        // underline rule
        ensureSpace(1.2);
        pdf.setDrawColor(0);
        pdf.setLineWidth(0.3);
        pdf.line(MARGIN_MM, y, PAGE_W - MARGIN_MM, y);
        y += 1.6;
        break;
      }
      case "h3":
        writeLines(b.text, SIZE_H3, { bold: true });
        break;
      case "p":
        writeLines(b.text, SIZE_BODY);
        break;
      case "li":
        writeLines(b.text, SIZE_BODY, { bullet: true, indent: 1 });
        break;
    }
  }

  pdf.save(filename);
}