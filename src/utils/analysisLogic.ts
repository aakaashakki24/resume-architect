export interface GapReport {
  matchPercent: number;
  strongMatches: string[];
  transferableSkills: { from: string; to: string }[];
  missingGaps: string[];
}

/**
 * Mock gap-analysis engine. Replace with a real LLM call later.
 * Scenario: Content Writer → Sales Executive transition.
 */
export function generateGapAnalysis(
  _resumeText: string,
  _jdText: string,
): Promise<GapReport> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        matchPercent: 85,
        strongMatches: [
          "Communication",
          "Copywriting",
          "Storytelling",
          "Deadline Management",
          "Audience Research",
        ],
        transferableSkills: [
          { from: "Editorial Planning", to: "Strategic Pipeline Management" },
          { from: "Interviewing Sources", to: "Client Discovery Calls" },
          { from: "Beat Reporting", to: "Account Management" },
          { from: "Headline Writing", to: "Cold Outreach Subject Lines" },
        ],
        missingGaps: [
          "CRM (HubSpot / Salesforce)",
          "B2B Lead Generation",
          "Quota Attainment",
          "Negotiation & Closing",
        ],
      });
    }, 1500);
  });
}