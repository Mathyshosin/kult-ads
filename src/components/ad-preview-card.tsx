"use client";

import { useState, useRef, useCallback } from "react";
import type { GeneratedAd } from "@/lib/types";
import { Download, RefreshCw, Pencil, Check, Type } from "lucide-react";
import { toPng } from "html-to-image";

interface AdPreviewCardProps {
  ad: GeneratedAd;
  onRegenerate?: () => void;
  onUpdateAd?: (id: string, updates: Partial<GeneratedAd>) => void;
}

// Different visual styles for the text overlay
const AD_STYLES = [
  {
    id: "gradient-bottom",
    label: "Gradient bas",
    overlay: "bg-gradient-to-t from-black/80 via-black/30 to-transparent",
    textPosition: "justify-end",
    headlineClass: "text-white font-black uppercase tracking-tight",
    bodyClass: "text-white/85 font-medium",
    ctaClass:
      "bg-white text-black font-bold hover:bg-white/90 transition-colors",
  },
  {
    id: "gradient-top",
    label: "Gradient haut",
    overlay: "bg-gradient-to-b from-black/80 via-black/30 to-transparent",
    textPosition: "justify-start",
    headlineClass: "text-white font-black uppercase tracking-tight",
    bodyClass: "text-white/85 font-medium",
    ctaClass:
      "bg-white text-black font-bold hover:bg-white/90 transition-colors",
  },
  {
    id: "center-bold",
    label: "Centre bold",
    overlay: "bg-black/40",
    textPosition: "justify-center items-center text-center",
    headlineClass: "text-white font-black uppercase tracking-tight",
    bodyClass: "text-white/90 font-medium",
    ctaClass:
      "bg-white text-black font-bold hover:bg-white/90 transition-colors",
  },
  {
    id: "minimal-bottom",
    label: "Minimal",
    overlay: "",
    textPosition: "justify-end",
    headlineClass: "text-white font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]",
    bodyClass: "text-white/90 font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]",
    ctaClass:
      "bg-white/95 text-black font-bold backdrop-blur-sm shadow-lg",
  },
  {
    id: "dark-box",
    label: "Box sombre",
    overlay: "",
    textPosition: "justify-end",
    headlineClass: "text-white font-black uppercase tracking-tight",
    bodyClass: "text-white/90 font-medium",
    ctaClass:
      "bg-white text-black font-bold",
    hasBox: true,
  },
];

export default function AdPreviewCard({
  ad,
  onRegenerate,
  onUpdateAd,
}: AdPreviewCardProps) {
  const isStory = ad.format === "story";
  const cardRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [headline, setHeadline] = useState(ad.headline);
  const [bodyText, setBodyText] = useState(ad.bodyText);
  const [callToAction, setCallToAction] = useState(ad.callToAction);
  const [styleIndex, setStyleIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [showTextOverlay, setShowTextOverlay] = useState(true);

  const style = AD_STYLES[styleIndex];

  const handleSave = useCallback(() => {
    setIsEditing(false);
    if (onUpdateAd) {
      onUpdateAd(ad.id, { headline, bodyText, callToAction });
    }
  }, [ad.id, headline, bodyText, callToAction, onUpdateAd]);

  const cycleStyle = useCallback(() => {
    setStyleIndex((prev) => (prev + 1) % AD_STYLES.length);
  }, []);

  async function handleDownload() {
    if (!cardRef.current) return;
    setIsExporting(true);
    // Hide action buttons during export
    try {
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
      // Fallback: download raw image
      const link = document.createElement("a");
      link.href = `data:${ad.mimeType};base64,${ad.imageBase64}`;
      link.download = `kult-ad-${ad.format}-${ad.id}.png`;
      link.click();
    }
    setIsExporting(false);
  }

  function handleCopyText() {
    const text = `${headline}\n${bodyText}\n${callToAction}`;
    navigator.clipboard.writeText(text);
  }

  // Font sizes based on format
  const headlineSize = isStory ? "text-xl" : "text-lg";
  const bodySize = isStory ? "text-sm" : "text-xs";
  const ctaSize = isStory ? "text-sm" : "text-xs";
  const padding = isStory ? "p-6" : "p-4";

  return (
    <div className="space-y-2">
      {/* The actual ad — this is what gets exported */}
      <div
        ref={cardRef}
        className={`relative ${
          isStory ? "aspect-[9/16]" : "aspect-square"
        } rounded-2xl overflow-hidden bg-black`}
      >
        {/* Background image */}
        <img
          src={`data:${ad.mimeType};base64,${ad.imageBase64}`}
          alt="Generated ad"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Text overlay */}
        {showTextOverlay && (
          <>
            {/* Full overlay for gradient styles */}
            {style.overlay && (
              <div className={`absolute inset-0 ${style.overlay}`} />
            )}

            {/* Text content */}
            <div
              className={`absolute inset-0 flex flex-col ${style.textPosition} ${padding}`}
            >
              {style.hasBox ? (
                <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4 space-y-2">
                  {isEditing ? (
                    <>
                      <input
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        className={`${headlineSize} ${style.headlineClass} bg-transparent border-b border-white/30 w-full outline-none pb-1`}
                      />
                      <textarea
                        value={bodyText}
                        onChange={(e) => setBodyText(e.target.value)}
                        rows={2}
                        className={`${bodySize} ${style.bodyClass} bg-transparent border-b border-white/30 w-full outline-none resize-none pb-1`}
                      />
                      <input
                        value={callToAction}
                        onChange={(e) => setCallToAction(e.target.value)}
                        className={`${ctaSize} ${style.ctaClass} px-5 py-2 rounded-full w-fit outline-none border border-transparent`}
                      />
                    </>
                  ) : (
                    <>
                      <h3
                        className={`${headlineSize} ${style.headlineClass} leading-tight`}
                      >
                        {headline}
                      </h3>
                      <p className={`${bodySize} ${style.bodyClass} leading-snug`}>
                        {bodyText}
                      </p>
                      <span
                        className={`${ctaSize} ${style.ctaClass} px-5 py-2 rounded-full inline-block w-fit`}
                      >
                        {callToAction}
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-w-[90%]">
                  {isEditing ? (
                    <>
                      <input
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        className={`${headlineSize} ${style.headlineClass} bg-transparent border-b border-white/30 w-full outline-none pb-1 leading-tight`}
                      />
                      <textarea
                        value={bodyText}
                        onChange={(e) => setBodyText(e.target.value)}
                        rows={2}
                        className={`${bodySize} ${style.bodyClass} bg-transparent border-b border-white/30 w-full outline-none resize-none pb-1 leading-snug`}
                      />
                      <input
                        value={callToAction}
                        onChange={(e) => setCallToAction(e.target.value)}
                        className={`${ctaSize} ${style.ctaClass} px-5 py-2 rounded-full w-fit outline-none`}
                      />
                    </>
                  ) : (
                    <>
                      <h3
                        className={`${headlineSize} ${style.headlineClass} leading-tight`}
                      >
                        {headline}
                      </h3>
                      <p className={`${bodySize} ${style.bodyClass} leading-snug`}>
                        {bodyText}
                      </p>
                      <span
                        className={`${ctaSize} ${style.ctaClass} px-5 py-2 rounded-full inline-block w-fit`}
                      >
                        {callToAction}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Format badge — hidden during export */}
        {!isExporting && (
          <div className="absolute top-3 right-3 bg-black/50 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
            {isStory ? "Story" : "Carré"}
          </div>
        )}
      </div>

      {/* Controls — outside the export area */}
      <div className="flex items-center gap-1.5">
        {/* Download */}
        <button
          onClick={handleDownload}
          disabled={isExporting}
          className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          {isExporting ? "Export..." : "Télécharger"}
        </button>

        {/* Edit / Save */}
        <button
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
          className={`p-2.5 rounded-xl border text-xs transition-colors ${
            isEditing
              ? "bg-green-500 border-green-500 text-white"
              : "border-border text-muted hover:bg-gray-100"
          }`}
          title={isEditing ? "Sauvegarder" : "Modifier le texte"}
        >
          {isEditing ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Pencil className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Toggle text overlay */}
        <button
          onClick={() => setShowTextOverlay(!showTextOverlay)}
          className={`p-2.5 rounded-xl border text-xs transition-colors ${
            showTextOverlay
              ? "border-border text-muted hover:bg-gray-100"
              : "bg-gray-200 border-gray-300 text-foreground"
          }`}
          title={showTextOverlay ? "Masquer le texte" : "Afficher le texte"}
        >
          <Type className="w-3.5 h-3.5" />
        </button>

        {/* Cycle style */}
        <button
          onClick={cycleStyle}
          className="p-2.5 rounded-xl border border-border text-muted hover:bg-gray-100 transition-colors"
          title={`Style: ${style.label}`}
        >
          <span className="text-[10px] font-bold w-3.5 h-3.5 flex items-center justify-center">
            S{styleIndex + 1}
          </span>
        </button>

        {/* Copy text */}
        <button
          onClick={handleCopyText}
          className="p-2.5 rounded-xl border border-border text-muted hover:bg-gray-100 transition-colors"
          title="Copier le texte"
        >
          <span className="text-[10px]">📋</span>
        </button>

        {/* Regenerate */}
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="p-2.5 rounded-xl border border-border text-muted hover:bg-gray-100 transition-colors"
            title="Régénérer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
