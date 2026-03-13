import DashboardHeader from "@/components/dashboard-header";
import StepIndicator from "@/components/step-indicator";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
