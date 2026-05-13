import { createServerFn } from "@tanstack/react-start";

const SYSTEM_PROMPT = `You are the Syntax AI, an expert ATS optimization engine. Transform the raw user data into a flawlessly formatted, single-column resume in raw Markdown.

Header Alignment: Use pipe separators: **Title** | Company | Location | Dates.

Horizontal Density: Eliminate orphan words. Ensure final lines of bullets occupy at least 50% of horizontal space.

Dynamic Scaling: Output must naturally fill exactly one page (70:30 text-to-whitespace ratio). If the user is Entry-Level, expand 'Core Competencies' into 3 categories and write 2-3 line compound bullets. If Senior-Level, compress older roles to 1 line and limit recent roles to exactly 4 dense bullets.

XYZ Framework: Every bullet must start with an Action Verb and follow 'Accomplished [X] as measured by [Y], by doing [Z].' Intelligently estimate conservative metrics if exact numbers are missing.

Output: Raw Markdown only. No brackets, no conversational preamble.`;

export type ATSResumeInput = {
  resumeJson: string;
  jobDescription: string;
  seniority?: "entry" | "mid" | "senior";
};

export const generateATSResume = createServerFn({ method: "POST" })
  .inputValidator((data: ATSResumeInput) => data)
  .handler(async ({ data }): Promise<{ markdown: string; error?: string }> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return {
        markdown: "",
        error:
          "LOVABLE_API_KEY is not configured. Enable Lovable Cloud / AI to generate.",
      };
    }

    const userPrompt = `Seniority hint: ${data.seniority ?? "auto-detect"}.

=== RAW USER RESUME DATA (JSON) ===
${data.resumeJson}

=== TARGET JOB DESCRIPTION ===
${data.jobDescription || "(none provided — optimize for the user's stated target role)"}

Now produce the single-page ATS-optimized resume in raw Markdown per the system rules.`;

    try {
      const res = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: userPrompt },
            ],
          }),
        },
      );

      if (!res.ok) {
        const text = await res.text();
        if (res.status === 429)
          return { markdown: "", error: "Rate limit reached. Try again shortly." };
        if (res.status === 402)
          return {
            markdown: "",
            error:
              "AI credits exhausted. Add credits in Settings → Workspace → Usage.",
          };
        return { markdown: "", error: `AI gateway error (${res.status}): ${text.slice(0, 200)}` };
      }

      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const md = json.choices?.[0]?.message?.content?.trim() ?? "";
      if (!md) return { markdown: "", error: "Empty AI response" };
      return { markdown: md };
    } catch (e) {
      return {
        markdown: "",
        error: e instanceof Error ? e.message : "Unknown error",
      };
    }
  });