"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

export default function LiveTemplateCarousel() {
  const [templates, setTemplates] = useState<{ id: string; previewUrl: string }[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/templates/preview")
      .then((r) => r.json())
      .then((data) => {
        const tpls = (data.templates || []).slice(0, 8);
        setTemplates(tpls);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // Fallback gradient cards while loading or if no templates
  const fallbackColors = [
    "from-blue-400 to-cyan-300",
    "from-pink-400 to-rose-300",
    "from-amber-400 to-yellow-300",
    "from-green-400 to-emerald-300",
    "from-violet-400 to-purple-300",
    "from-red-400 to-orange-300",
  ];

  return (
    <div className="bg-gray-50 rounded-xl p-4 mb-6 overflow-hidden">
      <div className="flex gap-2 step-templates-scroll">
        {loaded && templates.length > 0 ? (
          // Real templates — duplicate for seamless scroll
          [...templates, ...templates].map((t, i) => (
            <div
              key={`${t.id}-${i}`}
              className={`relative flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden ${
                i === 3 ? "ring-2 ring-violet-500 ring-offset-2 scale-105" : "opacity-60"
              } transition-all`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={t.previewUrl}
                alt="Template"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          ))
        ) : (
          // Fallback gradient cards
          [...fallbackColors, ...fallbackColors].map((c, i) => (
            <div
              key={i}
              className={`flex-shrink-0 w-16 h-20 rounded-lg bg-gradient-to-br ${c} ${
                i === 3 ? "ring-2 ring-violet-500 ring-offset-2 scale-105" : "opacity-60"
              } transition-all`}
            />
          ))
        )}
      </div>
      <div className="flex items-center justify-center gap-1.5 mt-3">
        <div className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center step-check-pop">
          <Check className="w-2.5 h-2.5 text-white" />
        </div>
        <span className="text-[10px] font-medium text-violet-600">Template choisi</span>
      </div>
    </div>
  );
}
