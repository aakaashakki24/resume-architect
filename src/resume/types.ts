export type Bullet = string;

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  startDate?: string;
  endDate?: string;
  bullets: Bullet[];
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
export function rewriteResumeForTarget(prev: ResumeState): ResumeState {
  const gap = computeGapAnalysis(prev.skills);
  const merged = [...prev.skills];
  for (const m of gap.missing) {
    if (!merged.some((s) => s.toLowerCase() === m.toLowerCase())) merged.push(m);
  }

  return {
    ...prev,
    summary:
      "Results-driven communicator pivoting from sports journalism into B2B sales & marketing. Combines narrative-led copywriting and audience research with hands-on lead generation, CRM (HubSpot) workflows, and campaign management to move pipeline and close revenue.",
    experience: prev.experience.map((exp, idx) =>
      idx === 0
        ? {
            ...exp,
            role: exp.role.includes("Sales") ? exp.role : `${exp.role} → Sales & Marketing Track`,
            bullets: [
              "Wrote daily sports reports — translated into copywriting samples now used as cold-email and landing-page templates.",
              "Managed fast-paced news desk deadlines, mirroring the cadence of a B2B sales pipeline and campaign management cycles.",
              "Conducted audience & market research on reader segments to brief editors — directly transferable to lead generation and ICP definition.",
              "Negotiated story angles and source access under pressure — practiced negotiation muscle for client-facing sales conversations.",
              "Drafted CRM-ready contact lists (HubSpot-style) of athletes, coaches, and PR contacts for repeat outreach.",
            ],
          }
        : exp,
    ),
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