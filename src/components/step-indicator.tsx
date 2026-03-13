"use client";

import { useWizardStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { Check, Globe, ClipboardCheck, ImageIcon, Sparkles } from "lucide-react";

const steps = [
  { num: 1, label: "Analyse du site", icon: Globe, path: "/dashboard/analyze" },
  { num: 2, label: "Vérification", icon: ClipboardCheck, path: "/dashboard/review" },
  { num: 3, label: "Images", icon: ImageIcon, path: "/dashboard/images" },
  { num: 4, label: "Génération", icon: Sparkles, path: "/dashboard/generate" },
] as const;

export default function StepIndicator() {
  const currentStep = useWizardStore((s) => s.currentStep);
  const router = useRouter();

  return (
    <div className="flex items-center justify-between max-w-2xl mx-auto">
      {steps.map((step, i) => {
        const isCompleted = currentStep > step.num;
        const isActive = currentStep === step.num;
        const Icon = step.icon;

        return (
          <div key={step.num} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => {
                if (isCompleted) router.push(step.path);
              }}
              disabled={!isCompleted}
              className={`flex flex-col items-center gap-1.5 ${
                isCompleted ? "cursor-pointer" : "cursor-default"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isCompleted
                    ? "bg-primary text-white"
                    : isActive
                    ? "bg-primary text-white ring-4 ring-primary/20"
                    : "bg-surface border border-border text-muted"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span
                className={`text-xs font-medium whitespace-nowrap ${
                  isActive ? "text-primary" : isCompleted ? "text-foreground" : "text-muted"
                }`}
              >
                {step.label}
              </span>
            </button>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-3 mt-[-18px] ${
                  currentStep > step.num ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
