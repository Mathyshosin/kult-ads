"use client";

import { useEffect } from "react";
import DashboardHeader from "@/components/dashboard-header";
import StepIndicator from "@/components/step-indicator";
import AuthGuard from "@/components/auth-guard";
import { useWizardStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import { Loader2 } from "lucide-react";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const hydrateFromSupabase = useWizardStore((s) => s.hydrateFromSupabase);
  const isHydrated = useWizardStore((s) => s.isHydrated);

  useEffect(() => {
    if (currentUser && !isHydrated) {
      hydrateFromSupabase(currentUser.id);
    }
  }, [currentUser, isHydrated, hydrateFromSupabase]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm text-muted">Chargement de vos données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <DashboardHeader />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <StepIndicator />
        <div className="mt-10">{children}</div>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <DashboardContent>{children}</DashboardContent>
    </AuthGuard>
  );
}
