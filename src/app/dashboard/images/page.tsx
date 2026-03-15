"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ImagesPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/dashboard/brand"); }, [router]);
  return null;
}
