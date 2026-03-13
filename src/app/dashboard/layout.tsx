"use client";

import DashboardHeader from "@/components/dashboard-header";
import StepIndicator from "@/components/step-indicator";
import AuthGuard from "@/components/auth-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-surface">
        <DashboardHeader />
        <div className="max-w-6xl mx-auto px-6 py-8">
          <StepIndicator />
          <div className="mt-10">{children}</div>
        </div>
      </div>
    </AuthGuard>
  );
}
