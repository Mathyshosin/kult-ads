"use client";

import type { GeneratedAd } from "@/lib/types";
import { Download, RefreshCw } from "lucide-react";

interface AdPreviewCardProps {
  ad: GeneratedAd;
  onRegenerate?: () => void;
}

export default function AdPreviewCard({ ad, onRegenerate }: AdPreviewCardProps) {
  const isStory = ad.format === "story";

  function handleDownload() {
    const link = document.createElement("a");
    link.href = `data:${ad.mimeType};base64,${ad.imageBase64}`;
    link.download = `kult-ad-${ad.format}-${ad.id}.png`;
    link.click();
  }

  function handleCopyText() {
    const text = `${ad.headline}\n${ad.bodyText}\n${ad.callToAction}`;
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      {/* Ad preview */}
      <div
        className={`relative ${
          isStory ? "aspect-[9/16]" : "aspect-square"
        } overflow-hidden`}
      >
        <img
          src={`data:${ad.mimeType};base64,${ad.imageBase64}`}
          alt="Generated ad"
          className="w-full h-full object-cover"
        />
        {/* Text overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-4">
          <h3 className="text-white font-bold text-lg leading-tight">
            {ad.headline}
          </h3>
          <p className="text-white/90 text-sm mt-1">{ad.bodyText}</p>
          <div className="mt-3 inline-flex">
            <span className="bg-white text-foreground text-xs font-semibold px-4 py-1.5 rounded-full">
              {ad.callToAction}
            </span>
          </div>
        </div>

        {/* Format badge */}
        <div className="absolute top-3 right-3 bg-black/50 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
          {isStory ? "Story" : "Carré"}
        </div>
      </div>

      {/* Actions */}
      <div className="p-3 flex items-center gap-2">
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-white py-2 rounded-lg text-xs font-medium hover:bg-primary-dark transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Télécharger
        </button>
        <button
          onClick={handleCopyText}
          className="flex-1 flex items-center justify-center gap-1.5 bg-surface border border-border text-foreground py-2 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors"
        >
          Copier le texte
        </button>
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="p-2 rounded-lg border border-border text-muted hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
