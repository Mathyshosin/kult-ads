"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReviewPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/dashboard/brand"); }, [router]);
  return null;
}
