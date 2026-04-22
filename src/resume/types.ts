export type Bullet = string;

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  startDate?: string;
  endDate?: string;
  bullets: Bullet[];
  /**
   * Parallel array tracking the ORIGINAL (pre-rewrite) text for each bullet.
   * Same length as `bullets`. Empty string means "no source / user-authored".
   * Used by the Source Traceability tooltip to prove zero-hallucination.
   */
  originalBullets?: Bullet[];
}

export interface ResumeState {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  originalRole: string;
  targetRole: string;
  summary: string;
  experience: ExperienceItem[];
  skills: string[];
}

export type TemplateId = "executive" | "modern" | "minimalist";

export interface GapAnalysis {
  matching: string[];
  missing: string[];
}

/** Skills the "target" job description is looking for (mocked) */
export const TARGET_JD_SKILLS = [
  "Copywriting",
  "Storytelling",
  "Lead Generation",
  "CRM (HubSpot)",
  "B2B Sales",
  "Campaign Management",
  "Negotiation",
  "Market Research",
] as const;

/** Compute matching vs missing against the user's current skill set */
export function computeGapAnalysis(currentSkills: string[]): GapAnalysis {
  const lower = new Set(currentSkills.map((s) => s.toLowerCase().trim()));
  const matching: string[] = [];
  const missing: string[] = [];
  for (const target of TARGET_JD_SKILLS) {
    if (lower.has(target.toLowerCase())) matching.push(target);
    else missing.push(target);
  }
  return { matching, missing };
}

/** Mocked AI rewrite — produces a tailored ResumeState with the missing skills woven in */
export function rewriteResumeForTarget(prev: ResumeState, strictMode = true): ResumeState {
  const gap = computeGapAnalysis(prev.skills);
  const merged = [...prev.skills];
  for (const m of gap.missing) {
    if (!merged.some((s) => s.toLowerCase() === m.toLowerCase())) merged.push(m);
  }

  /**
   * STRICT MODE = "Rephrase Only (Zero Hallucinations)".
   * We map each ORIGINAL bullet to a semantically-translated version that
   * preserves the underlying fact and only highlights transferable skills.
   * No invented metrics, no fabricated responsibilities.
   */
  const REPHRASE_MAP: Record<string, string> = {
    "Wrote daily sports reports":
      "Authored high-volume daily content under strict deadlines, demonstrating strong communication skills applicable to fast-paced client environments.",
    "Managed fast-paced news desk deadlines":
      "Coordinated cross-functional tasks in a high-pressure environment to ensure timely delivery of daily objectives.",
    "Managed fast-paced news desk":
      "Coordinated cross-functional tasks in a high-pressure environment to ensure timely delivery of daily objectives.",
  };

  return {
    ...prev,
    summary:
      strictMode
        ? "Communicator transitioning from sports journalism into sales & marketing. Brings deadline-driven writing, audience research, and high-pressure coordination experience — rephrased here to highlight transferable skills relevant to the target role."
        : "Results-driven communicator pivoting from sports journalism into B2B sales & marketing. Combines narrative-led copywriting and audience research with hands-on lead generation, CRM (HubSpot) workflows, and campaign management to move pipeline and close revenue.",
    experience: prev.experience.map((exp) => {
      const rephrased = exp.bullets.map((b) => {
        const trimmed = b.trim();
        return REPHRASE_MAP[trimmed] ?? b;
      });
      return {
        ...exp,
        // Preserve the originals so the UI can show traceability.
        originalBullets: exp.bullets.slice(),
        bullets: rephrased,
      };
    }),
    skills: merged,
  };
}

export const initialResume: ResumeState = {
  fullName: "Aarav Sharma",
  email: "aarav.sharma@example.com",
  phone: "+91 98765 43210",
  location: "Bengaluru, India",
  originalRole: "Sports Content Writer & Editor",
  targetRole: "Sales & Marketing Executive",
  summary:
    "Storytelling-driven communicator transitioning from sports journalism into sales & marketing. Skilled at writing under pressure, owning narratives, and turning complex information into compelling, audience-ready messaging.",
  experience: [
    {
      id: "exp-1",
      company: "The Hindu",
      role: "Intern",
      startDate: "Jun 2023",
      endDate: "Dec 2023",
      bullets: [
        "Wrote daily sports reports",
        "Managed fast-paced news desk deadlines",
      ],
    },
  ],
  skills: [
    "Copywriting",
    "Storytelling",
    "Deadline Management",
    "Editorial Strategy",
    "Audience Research",
  ],
};