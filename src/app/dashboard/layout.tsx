"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import DashboardHeader from "@/components/dashboard-header";
import AuthGuard from "@/components/auth-guard";
import { useWizardStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import { Loader2 } from "lucide-react";
import { ToastContainer } from "@/components/toast";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const hydrateFromSupabase = useWizardStore((s) => s.hydrateFromSupabase);
  const isHydrated = useWizardStore((s) => s.isHydrated);
  const pathname = usePathname();

  useEffect(() => {
    if (currentUser && !isHydrated) {
      hydrateFromSupabase(currentUser.id);
    }
  }, [currentUser, isHydrated, hydrateFromSupabase]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm text-muted">Chargement...</p>
        </div>
      </div>
    );
  }

  const isGeneratePage = pathname === "/dashboard/generate";

  return (
    <div className="min-h-screen bg-surface bg-dots">
      <DashboardHeader />
      {isGeneratePage ? (
        children
      ) : (
        <div className="py-8">{children}</div>
      )}
      <ToastContainer />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DashboardContent>{children}</DashboardContent>
    </AuthGuard>
  );
}
