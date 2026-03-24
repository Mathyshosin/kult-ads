"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

export default function LiveCounter() {
  const [count, setCount] = useState(0);
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    fetch("/api/stats/public")
      .then((r) => r.json())
      .then((data) => setCount(data.adsGenerated || 0))
      .catch(() => {});
  }, []);

  // Animate counting up
  useEffect(() => {
    if (count === 0) return;
    const duration = 1500;
    const steps = 40;
    const increment = count / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= count) {
        setDisplayed(count);
        clearInterval(timer);
      } else {
        setDisplayed(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [count]);

  if (count === 0) return null;

  return (
    <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-violet-200 rounded-full px-4 py-2 shadow-sm">
      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      <span className="text-sm font-medium text-gray-700">
        <span className="font-bold text-violet-600 tabular-nums">{displayed.toLocaleString("fr-FR")}</span>
        {" "}ads générées
      </span>
      <Sparkles className="w-3.5 h-3.5 text-violet-400" />
    </div>
  );
}
