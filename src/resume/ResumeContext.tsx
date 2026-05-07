import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  computeGapAnalysis,
  initialResume,
  rewriteResumeForTarget,
  type ExperienceItem,
  type GapAnalysis,
  type ResumeState,
  type TemplateId,
} from "./types";
import type { AIAnalysisResult } from "@/utils/aiMockEngine";
import type { GapReport } from "@/utils/analysisLogic";

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

  /** Step-2 sub-view: 'gap' (analysis dashboard) or 'edit' (form editor) */
  editorView: "gap" | "edit";
  setEditorView: (v: "gap" | "edit") => void;

  gapAnalysis: GapAnalysis;
  isRewriting: boolean;
  autoRewrite: () => Promise<void>;
  rewritten: boolean;

  /** Result of the mock AI mapping engine. Null until "Analyze & Map" runs. */
  aiAnalysis: AIAnalysisResult | null;
  setAiAnalysis: (a: AIAnalysisResult | null) => void;

  /** Result of generateGapAnalysis (Content Writer → Sales scenario). */
  gapReport: GapReport | null;
  setGapReport: (r: GapReport | null) => void;

  /** Global "analysis in progress" flag — used to dim the A4 canvas. */
  analyzing: boolean;
  setAnalyzing: (v: boolean) => void;

  /** Strict Mode: rephrase-only, zero-hallucination guarantee. */
  strictMode: boolean;
  setStrictMode: (v: boolean) => void;

  template: TemplateId;
  setTemplate: (t: TemplateId) => void;

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
  const [editorView, setEditorView] = useState<"gap" | "edit">("gap");
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewritten, setRewritten] = useState(false);
  const [template, setTemplate] = useState<TemplateId>("executive");
  const [strictMode, setStrictMode] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [gapReport, setGapReport] = useState<GapReport | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

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
          ? {
              ...item,
              bullets: [...item.bullets, ""],
              originalBullets: item.originalBullets
                ? [...item.originalBullets, ""]
                : item.originalBullets,
            }
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
          originalBullets: item.originalBullets
            ? item.originalBullets.filter((_, i) => i !== index)
            : item.originalBullets,
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
    setEditorView("gap");
  }, []);

  const resetResume = useCallback(() => {
    setResume(initialResume);
    setAnalyzed(false);
    setStep(1);
    setEditorView("gap");
    setRewritten(false);
    setIsRewriting(false);
    setTemplate("executive");
    setStrictMode(true);
    setAiAnalysis(null);
    setGapReport(null);
    setAnalyzing(false);
  }, []);

  const autoRewrite = useCallback(async () => {
    setIsRewriting(true);
    await new Promise((r) => setTimeout(r, 2000));
    setResume((prev) => rewriteResumeForTarget(prev, strictMode));
    setRewritten(true);
    setIsRewriting(false);
    setEditorView("edit");
  }, [strictMode]);

  const gapAnalysis = useMemo(() => computeGapAnalysis(resume.skills), [resume.skills]);

  const value = useMemo<ResumeContextValue>(
    () => ({
      resume,
      step,
      setStep,
      analyzed,
      runAnalysis,
      resetResume,
      editorView,
      setEditorView,
      gapAnalysis,
      isRewriting,
      autoRewrite,
      rewritten,
      template,
      setTemplate,
      strictMode,
      setStrictMode,
      aiAnalysis,
      setAiAnalysis,
      gapReport,
      setGapReport,
      analyzing,
      setAnalyzing,
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
      editorView,
      gapAnalysis,
      isRewriting,
      autoRewrite,
      rewritten,
      template,
      strictMode,
      aiAnalysis,
      gapReport,
      analyzing,
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