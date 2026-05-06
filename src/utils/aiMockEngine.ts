export interface ParsedResume {
  personalInfo: { name: string; role: string };
  experience: Array<{ company: string; role: string; bullets: string[] }>;
  skills: string[];
}

export interface GapAnalysisResult {
  strongMatches: string[];
  partialMatches: string[];
  missingGaps: string[];
}

export interface AIAnalysisResult {
  parsedResume: ParsedResume;
  gapAnalysis: GapAnalysisResult;
}

/**
 * Mock AI mapping engine.
 * Simulates a 2s LLM round-trip and returns a strict JSON shape mapping the
 * raw resume text + raw JD text into a parsed resume + gap analysis.
 *
 * NOTE: This is a deterministic mock. The real engine would use the
 * `rawResumeText` and `rawJDText` arguments — they are accepted here to
 * lock in the future call signature.
 */
export function simulateAIAnalysis(
  _rawResumeText: string,
  _rawJDText: string,
): Promise<AIAnalysisResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        parsedResume: {
          personalInfo: { name: "John Doe", role: "Content Writer" },
          experience: [
            {
              company: "The Hindu",
              role: "Intern",
              bullets: ["Wrote daily sports reports"],
            },
          ],
          skills: ["Copywriting", "Editing"],
        },
        gapAnalysis: {
          strongMatches: ["Copywriting"],
          partialMatches: ["Time Management"],
          missingGaps: ["Lead Generation", "B2B Sales"],
        },
      });
    }, 2000);
  });
}