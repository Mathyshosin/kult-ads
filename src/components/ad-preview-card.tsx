"use client";

import { useState, useRef, useCallback } from "react";
import type { GeneratedAd } from "@/lib/types";
import { Download, Pencil, Check, Type, Smartphone, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";

interface AdPreviewCardProps {
  ad: GeneratedAd;
  onRegenerate?: () => void;
  onUpdateAd?: (id: string, updates: Partial<GeneratedAd>) => void;
  onConvertToStory?: () => void;
  isConvertingToStory?: boolean;
}

const AD_STYLES = [
  {
    id: "gradient-bottom",
    label: "Gradient bas",
    overlay: "bg-gradient-to-t from-black/80 via-black/20 to-transparent",
    textPosition: "justify-end",
    headlineClass: "text-white font-black uppercase tracking-tight",
    bodyClass: "text-white/85 font-medium",
    ctaClass: "bg-white text-black font-bold",
  },
  {
    id: "center-bold",
    label: "Centre bold",
    overlay: "bg-black/30",
    textPosition: "justify-center items-center text-center",
    headlineClass: "text-white font-black uppercase tracking-tight",
    bodyClass: "text-white/90 font-medium",
    ctaClass: "bg-white text-black font-bold",
  },
  {
    id: "dark-box",
    label: "Box sombre",
    overlay: "",
    textPosition: "justify-end",
    headlineClass: "text-white font-black uppercase tracking-tight",
    bodyClass: "text-white/90 font-medium",
    ctaClass: "bg-white text-black font-bold",
    hasBox: true,
  },
  {
    id: "minimal",
    label: "Minimal",
    overlay: "",
    textPosition: "justify-end",
    headlineClass: "text-white font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]",
    bodyClass: "text-white/90 font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]",
    ctaClass: "bg-white/95 text-black font-bold backdrop-blur-sm shadow-lg",
  },
  {
    id: "gradient-top",
    label: "Gradient haut",
    overlay: "bg-gradient-to-b from-black/80 via-black/20 to-transparent",
    textPosition: "justify-start",
    headlineClass: "text-white font-black uppercase tracking-tight",
    bodyClass: "text-white/85 font-medium",
    ctaClass: "bg-white text-black font-bold",
  },
];

export default function AdPreviewCard({
  ad,
  onUpdateAd,
  onConvertToStory,
  isConvertingToStory,
}: AdPreviewCardProps) {
  const isStory = ad.format === "story";
  const cardRef = useRef<HTMLDivElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [headline, setHeadline] = useState(ad.headline);
  const [bodyText, setBodyText] = useState(ad.bodyText);
  const [callToAction, setCallToAction] = useState(ad.callToAction);
  const [styleIndex, setStyleIndex] = useState(0);
  const [showTextOverlay, setShowTextOverlay] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const style = AD_STYLES[styleIndex];

  const handleSave = useCallback(() => {
    setIsEditing(false);
    onUpdateAd?.(ad.id, { headline, bodyText, callToAction });
  }, [ad.id, headline, bodyText, callToAction, onUpdateAd]);

  const cycleStyle = useCallback(() => {
    setStyleIndex((prev) => (prev + 1) % AD_STYLES.length);
  }, []);

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

  const headlineSize = isStory ? "text-xl" : "text-lg";
  const bodySize = isStory ? "text-sm" : "text-xs";
  const ctaSize = isStory ? "text-sm" : "text-xs";
  const padding = isStory ? "p-6" : "p-4";

  const renderTextContent = () => (
    <>
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
          <h3 className={`${headlineSize} ${style.headlineClass} leading-tight`}>
            {headline}
          </h3>
          <p className={`${bodySize} ${style.bodyClass} leading-snug`}>
            {bodyText}
          </p>
          <span className={`${ctaSize} ${style.ctaClass} px-5 py-2 rounded-full inline-block w-fit`}>
            {callToAction}
          </span>
        </>
      )}
    </>
  );

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
        {showTextOverlay && (
          <>
            {style.overlay && (
              <div className={`absolute inset-0 ${style.overlay} z-10`} />
            )}
            <div className={`absolute inset-0 flex flex-col ${style.textPosition} ${padding} z-20`}>
              {style.hasBox ? (
                <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4 space-y-2">
                  {renderTextContent()}
                </div>
              ) : (
                <div className="space-y-2 max-w-[90%]">{renderTextContent()}</div>
              )}
            </div>
          </>
        )}
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

        {/* Edit text */}
        <button
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
          className={`p-2.5 rounded-xl border text-xs transition-all ${
            isEditing
              ? "bg-emerald-500 border-emerald-500 text-white shadow-soft"
              : "border-border/60 bg-white text-muted hover:text-foreground hover:border-primary/20 shadow-soft"
          }`}
          title={isEditing ? "Sauvegarder" : "Modifier le texte"}
        >
          {isEditing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
        </button>

        {/* Toggle text */}
        <button
          onClick={() => setShowTextOverlay(!showTextOverlay)}
          className={`p-2.5 rounded-xl border text-xs transition-all ${
            !showTextOverlay
              ? "bg-surface border-border text-foreground"
              : "border-border/60 bg-white text-muted hover:text-foreground hover:border-primary/20 shadow-soft"
          }`}
          title={showTextOverlay ? "Masquer le texte" : "Afficher le texte"}
        >
          <Type className="w-3.5 h-3.5" />
        </button>

        {/* Cycle style */}
        <button
          onClick={cycleStyle}
          className="p-2.5 rounded-xl border border-border/60 bg-white text-muted hover:text-foreground hover:border-primary/20 transition-all shadow-soft"
          title={`Style: ${style.label}`}
        >
          <span className="text-[10px] font-bold w-3.5 h-3.5 flex items-center justify-center">
            S{styleIndex + 1}
          </span>
        </button>
      </div>
    </div>
  );
}
