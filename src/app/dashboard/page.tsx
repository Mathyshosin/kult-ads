"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWizardStore } from "@/lib/store";

export default function DashboardPage() {
  const router = useRouter();
  const brandAnalysis = useWizardStore((s) => s.brandAnalysis);
  const isHydrated = useWizardStore((s) => s.isHydrated);

  useEffect(() => {
    if (isHydrated) {
      router.replace(brandAnalysis ? "/dashboard/ads" : "/dashboard/brand");
    }
  }, [router, brandAnalysis, isHydrated]);

  return null;
}
