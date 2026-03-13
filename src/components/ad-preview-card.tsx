"use client";

import { useState, useRef, useCallback } from "react";
import type { GeneratedAd, ProductPosition, PositionPreset } from "@/lib/types";
import { Download, RefreshCw, Pencil, Check, Type, Move, Minus, Plus } from "lucide-react";
import { toPng } from "html-to-image";

interface AdPreviewCardProps {
  ad: GeneratedAd;
  onRegenerate?: () => void;
  onUpdateAd?: (id: string, updates: Partial<GeneratedAd>) => void;
}

// Text overlay styles
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

// Position CSS mapping
const POSITION_CLASSES: Record<PositionPreset, string> = {
  "top-left": "top-[8%] left-[8%]",
  "top-center": "top-[8%] left-1/2 -translate-x-1/2",
  "top-right": "top-[8%] right-[8%]",
  "center-left": "top-1/2 left-[8%] -translate-y-1/2",
  "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  "center-right": "top-1/2 right-[8%] -translate-y-1/2",
  "bottom-left": "bottom-[8%] left-[8%]",
  "bottom-center": "bottom-[8%] left-1/2 -translate-x-1/2",
  "bottom-right": "bottom-[8%] right-[8%]",
};

const POSITION_GRID: PositionPreset[][] = [
  ["top-left", "top-center", "top-right"],
  ["center-left", "center", "center-right"],
  ["bottom-left", "bottom-center", "bottom-right"],
];

export default function AdPreviewCard({
  ad,
  onRegenerate,
  onUpdateAd,
}: AdPreviewCardProps) {
  const isStory = ad.format === "story";
  const cardRef = useRef<HTMLDivElement>(null);

  // Text state
  const [isEditing, setIsEditing] = useState(false);
  const [headline, setHeadline] = useState(ad.headline);
  const [bodyText, setBodyText] = useState(ad.bodyText);
  const [callToAction, setCallToAction] = useState(ad.callToAction);
  const [styleIndex, setStyleIndex] = useState(0);
  const [showTextOverlay, setShowTextOverlay] = useState(true);

  // Product position state
  const [productPosition, setProductPosition] = useState<ProductPosition>(
    ad.productPosition || { preset: "center", scale: 45 }
  );
  const [showPositionPanel, setShowPositionPanel] = useState(false);

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  const style = AD_STYLES[styleIndex];

  const handleSave = useCallback(() => {
    setIsEditing(false);
    onUpdateAd?.(ad.id, { headline, bodyText, callToAction });
  }, [ad.id, headline, bodyText, callToAction, onUpdateAd]);

  const cycleStyle = useCallback(() => {
    setStyleIndex((prev) => (prev + 1) % AD_STYLES.length);
  }, []);

  const handlePositionChange = useCallback(
    (preset: PositionPreset) => {
      const newPos = { ...productPosition, preset };
      setProductPosition(newPos);
      onUpdateAd?.(ad.id, { productPosition: newPos });
    },
    [ad.id, productPosition, onUpdateAd]
  );

  const handleScaleChange = useCallback(
    (delta: number) => {
      const newScale = Math.min(80, Math.max(20, productPosition.scale + delta));
      const newPos = { ...productPosition, scale: newScale };
      setProductPosition(newPos);
      onUpdateAd?.(ad.id, { productPosition: newPos });
    },
    [ad.id, productPosition, onUpdateAd]
  );

  async function handleDownload() {
    if (!cardRef.current) return;
    setIsExporting(true);
    setShowPositionPanel(false);
    try {
      // Small delay to let state update (hide position panel)
      await new Promise((r) => setTimeout(r, 100));
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
      // Fallback: download background only
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

  // Font sizes
  const headlineSize = isStory ? "text-xl" : "text-lg";
  const bodySize = isStory ? "text-sm" : "text-xs";
  const ctaSize = isStory ? "text-sm" : "text-xs";
  const padding = isStory ? "p-6" : "p-4";

  // Text render helper (shared between box and non-box styles)
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
    <div className="space-y-2">
      {/* === THE AD (exported as PNG) === */}
      <div
        ref={cardRef}
        className={`relative ${
          isStory ? "aspect-[9/16]" : "aspect-square"
        } rounded-2xl overflow-hidden bg-black`}
      >
        {/* LAYER 0: Background (Gemini) */}
        <img
          src={`data:${ad.mimeType};base64,${ad.imageBase64}`}
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* LAYER 1: Product image (client PNG, composited via CSS) */}
        {ad.productImageBase64 && (
          <div
            className={`absolute ${POSITION_CLASSES[productPosition.preset]} z-10`}
            style={{ width: `${productPosition.scale}%` }}
          >
            <img
              src={`data:${ad.productImageMimeType || "image/png"};base64,${ad.productImageBase64}`}
              alt="Product"
              className="w-full h-auto object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
            />
          </div>
        )}

        {/* LAYER 2: Text overlay (CSS) */}
        {showTextOverlay && (
          <>
            {style.overlay && (
              <div className={`absolute inset-0 ${style.overlay} z-20`} />
            )}
            <div
              className={`absolute inset-0 flex flex-col ${style.textPosition} ${padding} z-30`}
            >
              {style.hasBox ? (
                <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4 space-y-2">
                  {renderTextContent()}
                </div>
              ) : (
                <div className="space-y-2 max-w-[90%]">
                  {renderTextContent()}
                </div>
              )}
            </div>
          </>
        )}

        {/* Format badge (hidden during export) */}
        {!isExporting && (
          <div className="absolute top-3 right-3 bg-black/50 text-white text-[10px] font-medium px-2 py-0.5 rounded-full z-40">
            {isStory ? "Story" : "Carré"}
          </div>
        )}
      </div>

      {/* === POSITION PANEL (outside export area) === */}
      {showPositionPanel && ad.productImageBase64 && (
        <div className="bg-white rounded-xl border border-border p-3 space-y-3">
          <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">
            Position du produit
          </p>

          {/* 3x3 position grid */}
          <div className="grid grid-cols-3 gap-1 w-20 mx-auto">
            {POSITION_GRID.map((row, rowIdx) =>
              row.map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePositionChange(preset)}
                  className={`w-6 h-6 rounded-sm border transition-colors ${
                    productPosition.preset === preset
                      ? "bg-primary border-primary"
                      : "bg-gray-100 border-border hover:bg-gray-200"
                  }`}
                  title={preset}
                />
              ))
            )}
          </div>

          {/* Size controls */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => handleScaleChange(-5)}
              className="p-1 rounded border border-border hover:bg-gray-100"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-xs font-medium text-foreground w-10 text-center">
              {productPosition.scale}%
            </span>
            <button
              onClick={() => handleScaleChange(5)}
              className="p-1 rounded border border-border hover:bg-gray-100"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* === CONTROLS === */}
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

        {/* Edit text */}
        <button
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
          className={`p-2.5 rounded-xl border text-xs transition-colors ${
            isEditing
              ? "bg-green-500 border-green-500 text-white"
              : "border-border text-muted hover:bg-gray-100"
          }`}
          title={isEditing ? "Sauvegarder" : "Modifier le texte"}
        >
          {isEditing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
        </button>

        {/* Position product */}
        {ad.productImageBase64 && (
          <button
            onClick={() => setShowPositionPanel(!showPositionPanel)}
            className={`p-2.5 rounded-xl border text-xs transition-colors ${
              showPositionPanel
                ? "bg-primary border-primary text-white"
                : "border-border text-muted hover:bg-gray-100"
            }`}
            title="Position du produit"
          >
            <Move className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Toggle text */}
        <button
          onClick={() => setShowTextOverlay(!showTextOverlay)}
          className={`p-2.5 rounded-xl border text-xs transition-colors ${
            !showTextOverlay
              ? "bg-gray-200 border-gray-300 text-foreground"
              : "border-border text-muted hover:bg-gray-100"
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
