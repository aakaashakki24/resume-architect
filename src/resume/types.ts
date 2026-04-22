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