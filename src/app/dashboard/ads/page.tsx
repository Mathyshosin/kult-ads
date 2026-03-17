"use client";

import { useState, useRef, useCallback } from "react";
import { useWizardStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import { updateGeneratedAdFavorite } from "@/lib/supabase/sync";
import type { GeneratedAd } from "@/lib/types";
import {
  Download,
  Trash2,
  Sparkles,
  Loader2,
  AlertCircle,
  X,
  Heart,
  Pencil,
  Send,
  LayoutGrid,
  Bug,
  ChevronDown,
} from "lucide-react";
import { toPng } from "html-to-image";

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
function CompletedCard({ ad, onClick, onToggleFavorite }: { ad: GeneratedAd; onClick: () => void; onToggleFavorite: () => void }) {
  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite();
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
      <div className="absolute top-2.5 left-2.5 z-10">
        <span className="bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
          {ad.format === "story" ? "Story" : "Carré"}
        </span>
      </div>
      {/* Favorite button — always visible */}
      <button
        onClick={handleFavorite}
        className="absolute top-2.5 right-2.5 z-20 p-1.5 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors"
        title={ad.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
      >
        <Heart
          className={`w-4 h-4 transition-colors ${
            ad.isFavorite ? "fill-red-500 text-red-500" : "text-white/70 hover:text-white"
          }`}
        />
      </button>
    </div>
  );
}

// ── Ad detail modal ──
function AdDetailModal({ ad, onClose, onDelete, onModify, onToggleFavorite }: {
  ad: GeneratedAd;
  onClose: () => void;
  onDelete: (id: string) => void;
  onModify: (ad: GeneratedAd, prompt: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  const isStory = ad.format === "story";
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showModify, setShowModify] = useState(false);
  const [modifyPrompt, setModifyPrompt] = useState("");

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

  const handleToggleFavorite = useCallback(() => {
    onToggleFavorite(ad.id);
  }, [ad.id, onToggleFavorite]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative max-w-md w-full animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-50 p-2 rounded-full bg-white shadow-lg text-muted hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="max-h-[90vh] overflow-y-auto rounded-2xl">

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
            onClick={handleToggleFavorite}
            className={`p-2.5 rounded-xl border text-xs transition-all ${
              ad.isFavorite
                ? "bg-red-50 border-red-200 text-red-500"
                : "border-border/60 bg-white text-muted hover:text-foreground"
            }`}
            title={ad.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <Heart className={`w-3.5 h-3.5 ${ad.isFavorite ? "fill-red-500" : ""}`} />
          </button>
          {ad._debug && (
            <button
              onClick={() => setShowDebug(!showDebug)}
              className={`p-2.5 rounded-xl border text-xs transition-all ${
                showDebug
                  ? "bg-amber-500 border-amber-500 text-white"
                  : "border-border/60 bg-white text-muted hover:text-foreground"
              }`}
              title="Voir le prompt"
            >
              <Bug className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setShowModify(!showModify)}
            className={`p-2.5 rounded-xl border text-xs transition-all ${
              showModify
                ? "bg-primary border-primary text-white"
                : "border-border/60 bg-white text-muted hover:text-foreground"
            }`}
            title="Modifier cette ad"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { onDelete(ad.id); onClose(); }}
            className="p-2.5 rounded-xl border border-red-200 bg-white text-red-400 hover:bg-red-50 transition-all"
            title="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modify input */}
        {showModify && (
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={modifyPrompt}
                onChange={(e) => setModifyPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && modifyPrompt.trim()) {
                    onModify(ad, modifyPrompt.trim());
                    setModifyPrompt("");
                    setShowModify(false);
                    onClose();
                  }
                }}
                placeholder="Ex: change le fond en bleu, agrandis le logo..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-border/60 bg-white text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                autoFocus
              />
              <button
                onClick={() => {
                  if (modifyPrompt.trim()) {
                    onModify(ad, modifyPrompt.trim());
                    setModifyPrompt("");
                    setShowModify(false);
                    onClose();
                  }
                }}
                disabled={!modifyPrompt.trim()}
                className="p-2.5 rounded-xl btn-gradient text-white disabled:opacity-40 transition-all"
                title="Envoyer la modification"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-muted mt-1.5 px-1">Appuyez sur Entrée pour envoyer. Une nouvelle ad modifiée sera générée.</p>
          </div>
        )}

        {/* Debug panel */}
        {showDebug && ad._debug && (
          <div className="mt-3 bg-gray-900 text-gray-100 rounded-xl p-4 text-xs space-y-3 max-h-[50vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-amber-400 text-sm">Debug — Prompt Gemini</h4>
              <button onClick={() => setShowDebug(false)} className="text-gray-500 hover:text-gray-300">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {ad._debug.templateType && (
              <div>
                <span className="text-gray-400 font-medium">Template type:</span>
                <span className="ml-2 text-emerald-400">{ad._debug.templateType}</span>
              </div>
            )}

            <div>
              <button
                onClick={() => {
                  const el = document.getElementById("debug-scene");
                  if (el) el.classList.toggle("hidden");
                }}
                className="flex items-center gap-1 text-gray-400 font-medium hover:text-gray-200 mb-1"
              >
                Scene Description <ChevronDown className="w-3 h-3" />
              </button>
              <pre id="debug-scene" className="whitespace-pre-wrap text-gray-300 bg-gray-800 rounded-lg p-3 leading-relaxed hidden">
                {ad._debug.sceneDescription}
              </pre>
            </div>

            <div>
              <button
                onClick={() => {
                  const el = document.getElementById("debug-prompt");
                  if (el) el.classList.toggle("hidden");
                }}
                className="flex items-center gap-1 text-gray-400 font-medium hover:text-gray-200 mb-1"
              >
                Prompt Gemini complet <ChevronDown className="w-3 h-3" />
              </button>
              <pre id="debug-prompt" className="whitespace-pre-wrap text-gray-300 bg-gray-800 rounded-lg p-3 leading-relaxed text-[11px] hidden">
                {ad._debug.geminiPrompt}
              </pre>
            </div>

            {ad._debug.referenceImageLabels.length > 0 && (
              <div>
                <span className="text-gray-400 font-medium">Reference images:</span>
                <ul className="mt-1 space-y-1">
                  {ad._debug.referenceImageLabels.map((label, i) => (
                    <li key={i} className="text-gray-300 bg-gray-800 rounded-lg px-3 py-1.5">{label}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Template reference image */}
            {ad._debug.templateImageBase64 && (
              <div>
                <span className="text-gray-400 font-medium">Template utilisé :</span>
                <img
                  src={`data:${ad._debug.templateMimeType || "image/png"};base64,${ad._debug.templateImageBase64}`}
                  alt="Template"
                  className="mt-2 rounded-lg w-32 h-auto border border-gray-700"
                />
              </div>
            )}
          </div>
        )}
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

  const [filter, setFilter] = useState<"all" | "square" | "story" | "favorites">("all");
  const [selectedAd, setSelectedAd] = useState<GeneratedAd | null>(null);

  // Sort: generating first, then by timestamp desc
  const sorted = [...generatedAds].sort((a, b) => {
    if (a.status === "generating" && b.status !== "generating") return -1;
    if (a.status !== "generating" && b.status === "generating") return 1;
    return b.timestamp - a.timestamp;
  });

  const filtered = (() => {
    if (filter === "favorites") return sorted.filter((ad) => ad.isFavorite);
    if (filter === "all") return sorted;
    return sorted.filter((ad) => ad.format === filter);
  })();

  const completedCount = generatedAds.filter((a) => a.status !== "generating" && a.status !== "failed").length;
  const generatingCount = generatedAds.filter((a) => a.status === "generating").length;
  const favoritesCount = generatedAds.filter((a) => a.isFavorite).length;

  const handleDelete = (id: string) => {
    removeGeneratedAd(id);
    if (currentUser) syncDeleteGeneratedAd(currentUser.id, id);
  };

  const handleToggleFavorite = (id: string) => {
    const ad = generatedAds.find((a) => a.id === id);
    if (ad) {
      const newFav = !ad.isFavorite;
      updateGeneratedAd(id, { isFavorite: newFav });
      if (currentUser) {
        updateGeneratedAdFavorite(currentUser.id, id, newFav).catch(console.error);
      }
    }
  };

  const brandAnalysis = useWizardStore((s) => s.brandAnalysis);
  const uploadedImages = useWizardStore((s) => s.uploadedImages);
  const brandLogo = useWizardStore((s) => s.brandLogo);
  const addGeneratedAd = useWizardStore((s) => s.addGeneratedAd);
  const startGeneration = useWizardStore((s) => s.startGeneration);
  const completeGeneration = useWizardStore((s) => s.completeGeneration);
  const failGeneration = useWizardStore((s) => s.failGeneration);
  const syncGeneratedAd = useWizardStore((s) => s.syncGeneratedAd);

  const handleModify = async (ad: GeneratedAd, prompt: string) => {
    if (!brandAnalysis) return;

    // Find the product used in this ad
    const product = brandAnalysis.products.find((p) => p.id === ad.productId) || brandAnalysis.products[0];
    if (!product) return;

    // Find product image
    const productImage = uploadedImages.find((img) => img.productId === product.id);

    // Start a generating placeholder
    const tempId = startGeneration({ format: ad.format, productId: product.id });

    try {
      const res = await fetch("/api/generate-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandAnalysis,
          product,
          format: ad.format,
          modificationPrompt: prompt,
          previousAdId: ad.id,
          productImageBase64: productImage?.base64,
          productImageMimeType: productImage?.mimeType,
          brandLogoBase64: brandLogo?.base64,
          brandLogoMimeType: brandLogo?.mimeType,
        }),
      });

      if (!res.ok) {
        let errMsg = "Erreur de modification";
        try {
          const err = await res.json();
          errMsg = err.error || errMsg;
        } catch {
          const text = await res.text();
          errMsg = text.slice(0, 200) || `Erreur ${res.status}`;
        }
        throw new Error(errMsg);
      }

      const data = await res.json();
      completeGeneration(tempId, data);

      // Sync to Supabase
      const newAd = useWizardStore.getState().generatedAds.find((a) => a.id === tempId);
      if (newAd && currentUser) {
        syncGeneratedAd(currentUser.id, newAd);
      }
    } catch (err) {
      failGeneration(tempId, err instanceof Error ? err.message : "Erreur");
    }
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
          {(["all", "square", "story", "favorites"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
                filter === f ? "toggle-pill-active" : "text-muted hover:text-foreground"
              }`}
            >
              {f === "favorites" && <Heart className={`w-3 h-3 ${filter === "favorites" ? "fill-current" : ""}`} />}
              {f === "all" ? "Tous" : f === "square" ? "Carré" : f === "story" ? "Story" : "Favoris"}
              {f === "favorites" && favoritesCount > 0 && (
                <span className="text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full font-semibold">{favoritesCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
            {filter === "favorites" ? (
              <Heart className="w-7 h-7 text-primary/40" />
            ) : (
              <Sparkles className="w-7 h-7 text-primary/40" />
            )}
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground">
              {filter === "favorites" ? "Aucun favori" : "Aucune publicité"}
            </p>
            <p className="text-sm text-muted mt-1">
              {filter === "favorites"
                ? "Cliquez sur le coeur d'une publicité pour l'ajouter aux favoris"
                : "Rendez-vous dans le Générateur pour créer votre première pub !"}
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
                onToggleFavorite={() => handleToggleFavorite(ad.id)}
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
          onDelete={handleDelete}
          onModify={handleModify}
          onToggleFavorite={handleToggleFavorite}
        />
      )}
    </div>
  );
}
