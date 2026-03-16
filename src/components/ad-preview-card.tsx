"use client";

import { useState, useRef } from "react";
import type { GeneratedAd } from "@/lib/types";
import { Download, Smartphone, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";

interface AdPreviewCardProps {
  ad: GeneratedAd;
  onRegenerate?: () => void;
  onUpdateAd?: (id: string, updates: Partial<GeneratedAd>) => void;
  onConvertToStory?: () => void;
  isConvertingToStory?: boolean;
}

export default function AdPreviewCard({
  ad,
  onConvertToStory,
  isConvertingToStory,
}: AdPreviewCardProps) {
  const isStory = ad.format === "story";
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  async function handleDownload() {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      await new Promise((r) => setTimeout(r, 50));
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `kult-ad-${ad.format}-${Date.now()}.png`;
      link.click();
    } catch (err) {
      console.error("Export error:", err);
      const link = document.createElement("a");
      link.href = `data:${ad.mimeType};base64,${ad.imageBase64}`;
      link.download = `kult-ad-${ad.format}-${ad.id}.png`;
      link.click();
    }
    setIsExporting(false);
  }

  return (
    <div className="space-y-3">
      {/* ── The Ad ── */}
      <div
        ref={cardRef}
        className={`relative ${
          isStory ? "aspect-[9/16]" : "aspect-square"
        } rounded-2xl overflow-hidden bg-black shadow-glow-lg`}
      >
        <img
          src={`data:${ad.mimeType};base64,${ad.imageBase64}`}
          alt="Ad"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {!isExporting && (
          <div className="absolute top-3 right-3 flex gap-1.5 z-30">
            {ad.conversionAngle && (
              <span className="bg-gradient-to-r from-primary/80 to-accent/80 backdrop-blur-sm text-white text-[9px] font-semibold px-2.5 py-0.5 rounded-full">
                {ad.conversionAngle}
              </span>
            )}
            <span className="bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
              {isStory ? "Story" : "Carré"}
            </span>
          </div>
        )}
      </div>

      {/* ── Controls ── */}
      <div className="flex items-center gap-1.5">
        {/* Download */}
        <button
          onClick={handleDownload}
          disabled={isExporting}
          className="btn-gradient flex-1 flex items-center justify-center gap-1.5 text-white py-2.5 rounded-xl text-xs font-semibold"
        >
          <Download className="w-3.5 h-3.5" />
          {isExporting ? "Export..." : "Télécharger"}
        </button>

        {/* Story */}
        {onConvertToStory && (
          <button
            onClick={onConvertToStory}
            disabled={isConvertingToStory}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border/60 bg-white text-xs font-medium text-muted hover:text-foreground hover:border-primary/20 transition-all shadow-soft disabled:opacity-50"
            title="Format Story"
          >
            {isConvertingToStory ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Smartphone className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
