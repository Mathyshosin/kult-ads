"use client";

import { useState, useRef, useCallback } from "react";
import { useWizardStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import type { GeneratedAd } from "@/lib/types";
import {
  Download,
  Trash2,
  Sparkles,
  Loader2,
  AlertCircle,
  X,
  Filter,
  Pencil,
  Check,
  Type,
  Smartphone,
  LayoutGrid,
} from "lucide-react";
import { toPng } from "html-to-image";

const AD_STYLES = [
  {
    id: "gradient-bottom",
    label: "Gradient bas",
    overlay: "bg-gradient-to-t from-black/80 via-black/20 to-transparent",
    textPosition: "justify-end",
    headlineClass: "text-white font-black uppercase tracking-tight",
    bodyClass: "text-white/85 font-medium",
    ctaClass: "bg-white text-black font-bold",
    hasBox: false,
  },
  {
    id: "center-bold",
    label: "Centre bold",
    overlay: "bg-black/30",
    textPosition: "justify-center items-center text-center",
    headlineClass: "text-white font-black uppercase tracking-tight",
    bodyClass: "text-white/90 font-medium",
    ctaClass: "bg-white text-black font-bold",
    hasBox: false,
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
    hasBox: false,
  },
];

// ── Skeleton card for generating ads ──
function GeneratingCard({ ad }: { ad: GeneratedAd }) {
  return (
    <div
      className={`relative ${
        ad.format === "story" ? "aspect-[9/16]" : "aspect-square"
      } rounded-2xl overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5 border border-border/40 shadow-soft`}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 animate-pulse blur-xl" />
        </div>
        <div className="text-center px-6">
          <p className="text-sm font-semibold text-foreground">Génération en cours...</p>
          <p className="text-xs text-muted mt-1">Cela peut prendre jusqu&apos;à 1 minute</p>
        </div>
        <div className="w-24 h-1 rounded-full bg-border overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full animate-[shimmer_2s_ease-in-out_infinite]" style={{ width: "60%" }} />
        </div>
      </div>
    </div>
  );
}

// ── Failed card ──
function FailedCard({ ad, onRetry, onDelete }: { ad: GeneratedAd; onRetry?: () => void; onDelete: () => void }) {
  return (
    <div
      className={`relative ${
        ad.format === "story" ? "aspect-[9/16]" : "aspect-square"
      } rounded-2xl overflow-hidden bg-red-500/5 border border-red-500/20 shadow-soft`}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <p className="text-sm font-medium text-foreground text-center">Échec de la génération</p>
        {ad.error && <p className="text-xs text-muted text-center line-clamp-2">{ad.error}</p>}
        <div className="flex gap-2 mt-1">
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Réessayer
            </button>
          )}
          <button
            onClick={onDelete}
            className="text-xs font-semibold text-red-400 hover:underline"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Completed card ──
function CompletedCard({ ad, onClick, onDelete }: { ad: GeneratedAd; onClick: () => void; onDelete: () => void }) {
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = `data:${ad.mimeType};base64,${ad.imageBase64}`;
    link.download = `kult-ad-${ad.format}-${Date.now()}.png`;
    link.click();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div
      onClick={onClick}
      className={`group relative ${
        ad.format === "story" ? "aspect-[9/16]" : "aspect-square"
      } rounded-2xl overflow-hidden bg-black shadow-soft hover:shadow-glow-lg transition-all duration-300 cursor-pointer`}
    >
      <img
        src={`data:${ad.mimeType};base64,${ad.imageBase64}`}
        alt="Ad"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Format badge */}
      <div className="absolute top-2.5 right-2.5 z-10">
        <span className="bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
          {ad.format === "story" ? "Story" : "Carré"}
        </span>
      </div>
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 z-20">
        <button
          onClick={handleDownload}
          className="p-2.5 rounded-xl bg-white/90 text-foreground hover:bg-white transition-colors shadow-lg"
          title="Télécharger"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={handleDelete}
          className="p-2.5 rounded-xl bg-red-500/90 text-white hover:bg-red-500 transition-colors shadow-lg"
          title="Supprimer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Ad detail modal ──
function AdDetailModal({ ad, onClose, onUpdate, onDelete }: {
  ad: GeneratedAd;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<GeneratedAd>) => void;
  onDelete: (id: string) => void;
}) {
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
    onUpdate(ad.id, { headline, bodyText, callToAction });
  }, [ad.id, headline, bodyText, callToAction, onUpdate]);

  async function handleDownload() {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      await new Promise((r) => setTimeout(r, 50));
      const dataUrl = await toPng(cardRef.current, { quality: 1, pixelRatio: 2, cacheBust: true });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `kult-ad-${ad.format}-${Date.now()}.png`;
      link.click();
    } catch {
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

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative max-w-md w-full max-h-[90vh] overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-50 p-2 rounded-full bg-white shadow-lg text-muted hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Ad image */}
        <div
          ref={cardRef}
          className={`relative ${isStory ? "aspect-[9/16]" : "aspect-square"} rounded-2xl overflow-hidden bg-black`}
        >
          <img
            src={`data:${ad.mimeType};base64,${ad.imageBase64}`}
            alt="Ad"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {showTextOverlay && (
            <>
              {style.overlay && <div className={`absolute inset-0 ${style.overlay} z-10`} />}
              <div className={`absolute inset-0 flex flex-col ${style.textPosition} ${padding} z-20`}>
                {style.hasBox ? (
                  <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4 space-y-2">
                    {isEditing ? (
                      <>
                        <input value={headline} onChange={(e) => setHeadline(e.target.value)} className={`${headlineSize} ${style.headlineClass} bg-transparent border-b border-white/30 w-full outline-none pb-1 leading-tight`} />
                        <textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} rows={2} className={`${bodySize} ${style.bodyClass} bg-transparent border-b border-white/30 w-full outline-none resize-none pb-1 leading-snug`} />
                        <input value={callToAction} onChange={(e) => setCallToAction(e.target.value)} className={`${ctaSize} ${style.ctaClass} px-5 py-2 rounded-full w-fit outline-none`} />
                      </>
                    ) : (
                      <>
                        <h3 className={`${headlineSize} ${style.headlineClass} leading-tight`}>{headline}</h3>
                        <p className={`${bodySize} ${style.bodyClass} leading-snug`}>{bodyText}</p>
                        <span className={`${ctaSize} ${style.ctaClass} px-5 py-2 rounded-full inline-block w-fit`}>{callToAction}</span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 max-w-[90%]">
                    {isEditing ? (
                      <>
                        <input value={headline} onChange={(e) => setHeadline(e.target.value)} className={`${headlineSize} ${style.headlineClass} bg-transparent border-b border-white/30 w-full outline-none pb-1 leading-tight`} />
                        <textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} rows={2} className={`${bodySize} ${style.bodyClass} bg-transparent border-b border-white/30 w-full outline-none resize-none pb-1 leading-snug`} />
                        <input value={callToAction} onChange={(e) => setCallToAction(e.target.value)} className={`${ctaSize} ${style.ctaClass} px-5 py-2 rounded-full w-fit outline-none`} />
                      </>
                    ) : (
                      <>
                        <h3 className={`${headlineSize} ${style.headlineClass} leading-tight`}>{headline}</h3>
                        <p className={`${bodySize} ${style.bodyClass} leading-snug`}>{bodyText}</p>
                        <span className={`${ctaSize} ${style.ctaClass} px-5 py-2 rounded-full inline-block w-fit`}>{callToAction}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
          {!isExporting && (
            <div className="absolute top-3 right-3 z-30">
              <span className="bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                {isStory ? "Story" : "Carré"}
              </span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 mt-3">
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="btn-gradient flex-1 flex items-center justify-center gap-1.5 text-white py-2.5 rounded-xl text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            {isExporting ? "Export..." : "Télécharger"}
          </button>
          <button
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
            className={`p-2.5 rounded-xl border text-xs transition-all ${
              isEditing
                ? "bg-emerald-500 border-emerald-500 text-white"
                : "border-border/60 bg-white text-muted hover:text-foreground"
            }`}
            title={isEditing ? "Sauvegarder" : "Modifier le texte"}
          >
            {isEditing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setShowTextOverlay(!showTextOverlay)}
            className={`p-2.5 rounded-xl border text-xs transition-all ${
              !showTextOverlay
                ? "bg-surface border-border text-foreground"
                : "border-border/60 bg-white text-muted hover:text-foreground"
            }`}
            title={showTextOverlay ? "Masquer le texte" : "Afficher le texte"}
          >
            <Type className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setStyleIndex((i) => (i + 1) % AD_STYLES.length)}
            className="p-2.5 rounded-xl border border-border/60 bg-white text-muted hover:text-foreground transition-all"
            title={`Style: ${style.label}`}
          >
            <span className="text-[10px] font-bold w-3.5 h-3.5 flex items-center justify-center">
              S{styleIndex + 1}
            </span>
          </button>
          <button
            onClick={() => { onDelete(ad.id); onClose(); }}
            className="p-2.5 rounded-xl border border-red-200 bg-white text-red-400 hover:bg-red-50 transition-all"
            title="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──
export default function AdsGalleryPage() {
  const generatedAds = useWizardStore((s) => s.generatedAds);
  const updateGeneratedAd = useWizardStore((s) => s.updateGeneratedAd);
  const removeGeneratedAd = useWizardStore((s) => s.removeGeneratedAd);
  const syncDeleteGeneratedAd = useWizardStore((s) => s.syncDeleteGeneratedAd);
  const currentUser = useAuthStore((s) => s.currentUser);

  const [filter, setFilter] = useState<"all" | "square" | "story">("all");
  const [selectedAd, setSelectedAd] = useState<GeneratedAd | null>(null);

  // Sort: generating first, then by timestamp desc
  const sorted = [...generatedAds].sort((a, b) => {
    if (a.status === "generating" && b.status !== "generating") return -1;
    if (a.status !== "generating" && b.status === "generating") return 1;
    return b.timestamp - a.timestamp;
  });

  const filtered = filter === "all" ? sorted : sorted.filter((ad) => ad.format === filter);
  const completedCount = generatedAds.filter((a) => a.status !== "generating" && a.status !== "failed").length;
  const generatingCount = generatedAds.filter((a) => a.status === "generating").length;

  const handleDelete = (id: string) => {
    removeGeneratedAd(id);
    if (currentUser) syncDeleteGeneratedAd(currentUser.id, id);
  };

  return (
    <div className="max-w-6xl mx-auto px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
            <LayoutGrid className="w-6 h-6 text-primary" />
            Mes Publicités
            {completedCount > 0 && (
              <span className="text-sm font-medium text-muted bg-surface px-2.5 py-0.5 rounded-full">
                {completedCount}
              </span>
            )}
          </h1>
          {generatingCount > 0 && (
            <p className="text-sm text-muted mt-1 flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              {generatingCount} génération{generatingCount > 1 ? "s" : ""} en cours...
            </p>
          )}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-1 toggle-pill">
          {(["all", "square", "story"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                filter === f ? "toggle-pill-active" : "text-muted hover:text-foreground"
              }`}
            >
              {f === "all" ? "Tous" : f === "square" ? "Carré" : "Story"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-primary/40" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground">Aucune publicité</p>
            <p className="text-sm text-muted mt-1">
              Rendez-vous dans le Générateur pour créer votre première pub !
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((ad) => {
            const status = ad.status || "completed";
            if (status === "generating") {
              return <GeneratingCard key={ad.id} ad={ad} />;
            }
            if (status === "failed") {
              return (
                <FailedCard
                  key={ad.id}
                  ad={ad}
                  onDelete={() => handleDelete(ad.id)}
                />
              );
            }
            return (
              <CompletedCard
                key={ad.id}
                ad={ad}
                onClick={() => setSelectedAd(ad)}
                onDelete={() => handleDelete(ad.id)}
              />
            );
          })}
        </div>
      )}

      {/* Modal */}
      {selectedAd && (
        <AdDetailModal
          ad={selectedAd}
          onClose={() => setSelectedAd(null)}
          onUpdate={updateGeneratedAd}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
