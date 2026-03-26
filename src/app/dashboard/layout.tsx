"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import DashboardHeader from "@/components/dashboard-header";
import AuthGuard from "@/components/auth-guard";
import { useWizardStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import { ToastContainer } from "@/components/toast";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const hydrateFromSupabase = useWizardStore((s) => s.hydrateFromSupabase);
  const isHydrated = useWizardStore((s) => s.isHydrated);
  const pathname = usePathname();
  const router = useRouter();
  const [subChecked, setSubChecked] = useState(false);

  useEffect(() => {
    if (currentUser && !isHydrated) {
      hydrateFromSupabase(currentUser.id);
    }
  }, [currentUser, isHydrated, hydrateFromSupabase]);

  // Redirect new users without subscription to pricing page
  useEffect(() => {
    if (!currentUser || subChecked) return;
    if (currentUser.email === "mathys.hosin@gmail.com") { setSubChecked(true); return; }
    if (pathname === "/dashboard/subscription" || pathname === "/dashboard/brand") { setSubChecked(true); return; }

    fetch("/api/user/subscription")
      .then((r) => r.json())
      .then((data) => {
        if (data.plan === "free" && (data.creditsRemaining ?? 0) <= 0) {
          router.replace("/dashboard/subscription");
        }
        setSubChecked(true);
      })
      .catch(() => setSubChecked(true));
  }, [currentUser, pathname, subChecked, router]);

  const isGeneratePage = pathname === "/dashboard/generate";

  return (
    <div className="min-h-screen bg-gray-50/50">
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
