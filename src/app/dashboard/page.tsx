"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/ads");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
    </div>
  );
}
