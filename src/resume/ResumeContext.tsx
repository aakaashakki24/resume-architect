import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { initialResume, type ExperienceItem, type ResumeState } from "./types";

type ScalarKey = {
  [K in keyof ResumeState]: ResumeState[K] extends string ? K : never;
}[keyof ResumeState];

interface ResumeContextValue {
  resume: ResumeState;
  step: 1 | 2 | 3;
  setStep: (step: 1 | 2 | 3) => void;
  analyzed: boolean;
  runAnalysis: () => void;
  resetResume: () => void;

  setField: (field: ScalarKey, value: string) => void;

  updateExperience: (id: string, patch: Partial<ExperienceItem>) => void;
  addExperience: () => void;
  removeExperience: (id: string) => void;

  addBullet: (experienceId: string) => void;
  updateBullet: (experienceId: string, index: number, value: string) => void;
  removeBullet: (experienceId: string, index: number) => void;

  addSkill: (skill: string) => void;
  updateSkill: (index: number, value: string) => void;
  removeSkill: (index: number) => void;
}

const ResumeContext = createContext<ResumeContextValue | null>(null);

const uid = () =>
  `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function ResumeProvider({ children }: { children: ReactNode }) {
  const [resume, setResume] = useState<ResumeState>(initialResume);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [analyzed, setAnalyzed] = useState(false);

  const setField = useCallback((field: ScalarKey, value: string) => {
    setResume((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateExperience = useCallback(
    (id: string, patch: Partial<ExperienceItem>) => {
      setResume((prev) => ({
        ...prev,
        experience: prev.experience.map((item) =>
          item.id === id ? { ...item, ...patch } : item,
        ),
      }));
    },
    [],
  );

  const addExperience = useCallback(() => {
    setResume((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          id: uid(),
          company: "New Company",
          role: "Role Title",
          startDate: "",
          endDate: "",
          bullets: ["Describe a key achievement"],
        },
      ],
    }));
  }, []);

  const removeExperience = useCallback((id: string) => {
    setResume((prev) => ({
      ...prev,
      experience: prev.experience.filter((item) => item.id !== id),
    }));
  }, []);

  const addBullet = useCallback((experienceId: string) => {
    setResume((prev) => ({
      ...prev,
      experience: prev.experience.map((item) =>
        item.id === experienceId
          ? { ...item, bullets: [...item.bullets, ""] }
          : item,
      ),
    }));
  }, []);

  const updateBullet = useCallback(
    (experienceId: string, index: number, value: string) => {
      setResume((prev) => ({
        ...prev,
        experience: prev.experience.map((item) => {
          if (item.id !== experienceId) return item;
          const bullets = item.bullets.map((b, i) => (i === index ? value : b));
          return { ...item, bullets };
        }),
      }));
    },
    [],
  );

  const removeBullet = useCallback((experienceId: string, index: number) => {
    setResume((prev) => ({
      ...prev,
      experience: prev.experience.map((item) => {
        if (item.id !== experienceId) return item;
        return {
          ...item,
          bullets: item.bullets.filter((_, i) => i !== index),
        };
      }),
    }));
  }, []);

  const addSkill = useCallback((skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    setResume((prev) =>
      prev.skills.includes(trimmed)
        ? prev
        : { ...prev, skills: [...prev.skills, trimmed] },
    );
  }, []);

  const updateSkill = useCallback((index: number, value: string) => {
    setResume((prev) => ({
      ...prev,
      skills: prev.skills.map((s, i) => (i === index ? value : s)),
    }));
  }, []);

  const removeSkill = useCallback((index: number) => {
    setResume((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  }, []);

  const runAnalysis = useCallback(() => {
    setAnalyzed(true);
    setStep(2);
  }, []);

  const resetResume = useCallback(() => {
    setResume(initialResume);
    setAnalyzed(false);
    setStep(1);
  }, []);

  const value = useMemo<ResumeContextValue>(
    () => ({
      resume,
      step,
      setStep,
      analyzed,
      runAnalysis,
      resetResume,
      setField,
      updateExperience,
      addExperience,
      removeExperience,
      addBullet,
      updateBullet,
      removeBullet,
      addSkill,
      updateSkill,
      removeSkill,
    }),
    [
      resume,
      step,
      analyzed,
      runAnalysis,
      resetResume,
      setField,
      updateExperience,
      addExperience,
      removeExperience,
      addBullet,
      updateBullet,
      removeBullet,
      addSkill,
      updateSkill,
      removeSkill,
    ],
  );

  return (
    <ResumeContext.Provider value={value}>{children}</ResumeContext.Provider>
  );
}

export function useResume() {
  const ctx = useContext(ResumeContext);
  if (!ctx) throw new Error("useResume must be used inside <ResumeProvider />");
  return ctx;
}