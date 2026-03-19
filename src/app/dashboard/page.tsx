"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWizardStore } from "@/lib/store";

export default function DashboardPage() {
  const router = useRouter();
  const isHydrated = useWizardStore((s) => s.isHydrated);

  useEffect(() => {
    if (isHydrated) {
      router.replace("/dashboard/ads");
    }
  }, [router, isHydrated]);

  return null;
}
