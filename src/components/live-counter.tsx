"use client";

import { Sparkles } from "lucide-react";

export default function LiveCounter({ initialCount }: { initialCount: number }) {
  if (initialCount === 0) return null;

  return (
    <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-violet-200 rounded-full px-4 py-2 shadow-sm">
      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      <span className="text-sm font-medium text-gray-700">
        <span className="font-bold text-violet-600 tabular-nums">{initialCount.toLocaleString("fr-FR")}</span>
        {" "}ads générées
      </span>
      <Sparkles className="w-3.5 h-3.5 text-violet-400" />
    </div>
  );
}
