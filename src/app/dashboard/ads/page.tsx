"use client";

import { useState, useRef, useCallback, useMemo } from "react";
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
  Bug,
  ChevronDown,
  Lightbulb,
  Images,
  Filter,
  Smartphone,
} from "lucide-react";
import { toPng } from "html-to-image";

// Helper: use public URL when available, fallback to base64
function adImageSrc(ad: GeneratedAd): string {
  if (ad.imageUrl) return ad.imageUrl;
  if (ad.imageBase64) return `data:${ad.mimeType};base64,${ad.imageBase64}`;
  return "";
}

// ── Growth hacking & marketing fun facts ──
const FUN_FACTS = [
  "Dropbox a augmenté ses inscriptions de 60% grâce à un simple programme de parrainage offrant 500 Mo gratuits.",
  "Airbnb a hacké Craigslist pour publier automatiquement ses annonces et voler du trafic à la plateforme.",
  "Hotmail a ajouté \"PS: I love you. Get your free email at Hotmail\" en bas de chaque email. Résultat : 12 millions d'users en 18 mois.",
  "Le bouton \"Share\" de Facebook génère plus de 10 milliards d'impressions par jour sur des sites tiers.",
  "Instagram a été lancé un lundi et avait 25 000 utilisateurs le premier jour, sans aucune pub.",
  "Le rouge dans un CTA peut augmenter les conversions de 21% par rapport au vert, selon une étude HubSpot.",
  "Les emails envoyés le mardi à 10h ont le meilleur taux d'ouverture selon 14 études marketing.",
  "Amazon génère 35% de son chiffre d'affaires grâce à son moteur de recommandation \"Les clients ont aussi acheté\".",
  "Le fondateur de Spanx a envoyé son produit à Oprah sans autorisation. Oprah l'a nommé \"Favori de l'Année\".",
  "Dollar Shave Club a dépensé 4 500$ pour sa vidéo virale. Résultat : 12 000 commandes en 48h.",
  "PayPal donnait littéralement 10$ à chaque nouvel inscrit. Coût d'acquisition : 60M$. Valorisation : 1,5 milliard.",
  "Les landing pages avec une seule CTA convertissent 266% mieux que celles avec plusieurs options.",
  "Spotify crée 30 millions de playlists personnalisées chaque lundi. C'est la fonctionnalité qui retient le plus d'abonnés.",
  "Nike a dépensé 0$ en pub TV pour le lancement de Nike+. Tout était du marketing produit intégré.",
  "Le taux de conversion moyen d'un e-commerce est de 2,86%. Les meilleurs atteignent 11%.",
  "Un A/B test chez Google sur 41 nuances de bleu pour un lien a rapporté 200M$ de revenus supplémentaires.",
  "LinkedIn a atteint ses premiers 2 millions d'utilisateurs uniquement via les invitations email des membres existants.",
  "Les publicités vidéo de moins de 15 secondes ont un taux de complétion 72% plus élevé que les vidéos de 30 secondes.",
  "Le packaging d'Apple coûte en moyenne 7$ par boîte d'iPhone. L'expérience unboxing est un investissement marketing.",
  "Slack n'avait aucun commercial quand il a atteint 1 million d'utilisateurs payants. Tout était du bouche-à-oreille.",
  "Les marques qui publient 16+ articles de blog par mois génèrent 3,5x plus de trafic.",
  "Tesla dépense 0$ en publicité traditionnelle. Elon Musk est leur stratégie marketing.",
  "Une étude montre que les prix en 9 (9,99€ vs 10€) augmentent les ventes de 24% en moyenne.",
  "Red Bull a investi 30% de son CA en marketing et seulement 1% en R&D. La marque EST le produit.",
  "GitHub a grandi uniquement par le bouche-à-oreille développeur pendant ses 4 premières années.",
  "Les stories Instagram génèrent 500 millions de vues par jour. C'est le format publicitaire qui croît le plus vite.",
  "Le premier logo de Google a été créé sur GIMP (logiciel gratuit) par Sergey Brin en 5 minutes.",
  "Les emails avec un emoji dans l'objet ont un taux d'ouverture 56% plus élevé.",
  "Notion a attendu 3 ans avant de lancer sa V1. La patience est une stratégie de growth sous-estimée.",
  "Le coût d'acquisition d'un nouveau client est 5 à 25x plus élevé que de fidéliser un client existant.",
];

// ── Loading state with fun facts ──
function AdsLoadingState() {
  const fact = useMemo(() => FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)], []);

  return (
    <div className="flex flex-col items-center justify-center py-32 gap-8 animate-fade-in">
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-50 to-violet-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Récupération de vos ads...
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Chargement de votre bibliothèque
        </p>
      </div>
      <div className="max-w-md bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Le saviez-vous ?</p>
            <p className="text-sm text-gray-600 leading-relaxed">{fact}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton card for generating ads ──
function GeneratingCard({ ad }: { ad: GeneratedAd }) {
  return (
    <div
      className={`relative ${
        ad.format === "story" ? "aspect-[9/16]" : "aspect-square"
      } rounded-2xl overflow-hidden bg-white border border-gray-100`}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-blue-500 animate-pulse" />
        </div>
        <div className="text-center px-6">
          <p className="text-sm font-semibold text-gray-900">Création en cours</p>
          <p className="text-xs text-gray-400 mt-1">~30 secondes</p>
        </div>
        <div className="w-24 h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-400 to-violet-400 rounded-full animate-[shimmer_2s_ease-in-out_infinite]" style={{ width: "60%" }} />
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
      } rounded-2xl overflow-hidden bg-white border border-red-100`}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6">
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-red-400" />
        </div>
        <p className="text-sm font-medium text-gray-900 text-center">Échec</p>
        {ad.error && <p className="text-xs text-gray-400 text-center line-clamp-2">{ad.error}</p>}
        <div className="flex gap-4 mt-1">
          {onRetry && (
            <button onClick={onRetry} className="text-xs font-semibold text-blue-500 hover:text-blue-600">
              Réessayer
            </button>
          )}
          <button onClick={onDelete} className="text-xs font-semibold text-red-400 hover:text-red-500">
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
      } rounded-2xl overflow-hidden bg-gray-100 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-0.5 active:scale-[0.98]`}
    >
      <img
        src={adImageSrc(ad)}
        alt="Ad"
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      {/* Format badge */}
      <div className="absolute top-3 left-3 z-10">
        <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-semibold px-2.5 py-1 rounded-lg shadow-sm">
          {ad.format === "story" ? "Story" : "Carré"}
        </span>
      </div>
      {/* Favorite button */}
      <button
        onClick={handleFavorite}
        className="absolute top-3 right-3 z-20 w-8 h-8 rounded-xl flex items-center justify-center bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white transition-all active:scale-90"
        title={ad.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
      >
        <Heart
          className={`w-4 h-4 transition-colors ${
            ad.isFavorite ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-gray-600"
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
      link.href = ad.imageUrl || `data:${ad.mimeType};base64,${ad.imageBase64}`;
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <div
        className="relative max-w-md w-full animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-50 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors active:scale-90"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="max-h-[90vh] overflow-y-auto rounded-3xl">
          {/* Ad image */}
          <div
            ref={cardRef}
            className={`relative ${isStory ? "aspect-[9/16]" : "aspect-square"} rounded-3xl overflow-hidden bg-gray-100`}
          >
            <img
              src={adImageSrc(ad)}
              alt="Ad"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {!isExporting && (
              <div className="absolute top-4 right-4 z-30">
                <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-sm">
                  {isStory ? "Story" : "Carré"}
                </span>
              </div>
            )}
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-violet-500 rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isExporting ? "Export..." : "Télécharger"}
            </button>
            <button
              onClick={handleToggleFavorite}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                ad.isFavorite
                  ? "bg-red-50 text-red-500 ring-1 ring-red-100"
                  : "bg-white ring-1 ring-gray-200 text-gray-400 hover:text-gray-600"
              }`}
            >
              <Heart className={`w-4.5 h-4.5 ${ad.isFavorite ? "fill-red-500" : ""}`} />
            </button>
            <button
              onClick={() => setShowModify(!showModify)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                showModify
                  ? "bg-blue-500 text-white ring-1 ring-blue-500"
                  : "bg-white ring-1 ring-gray-200 text-gray-400 hover:text-gray-600"
              }`}
              title="Modifier"
            >
              <Pencil className="w-4 h-4" />
            </button>
            {/* Convert to Story — only for square ads */}
            {!isStory && (
              <button
                onClick={() => {
                  onModify(ad, "Étends cette image au format vertical 9:16 (story) en ajoutant du fond décoratif au-dessus et en-dessous. Garde TOUT le contenu existant identique (texte, produit, logo, mise en page). Agrandis légèrement les éléments si nécessaire pour remplir l'espace.");
                  onClose();
                }}
                className="w-12 h-12 rounded-xl flex items-center justify-center bg-white ring-1 ring-gray-200 text-gray-400 hover:text-violet-500 hover:ring-violet-200 hover:bg-violet-50 transition-all active:scale-90"
                title="Adapter en Story"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            )}
            {ad._debug && (
              <button
                onClick={() => setShowDebug(!showDebug)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                  showDebug
                    ? "bg-amber-500 text-white ring-1 ring-amber-500"
                    : "bg-white ring-1 ring-gray-200 text-gray-400 hover:text-gray-600"
                }`}
              >
                <Bug className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => { onDelete(ad.id); onClose(); }}
              className="w-12 h-12 rounded-xl flex items-center justify-center bg-white ring-1 ring-gray-200 text-red-400 hover:bg-red-50 hover:ring-red-100 transition-all active:scale-90"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Modify input */}
          {showModify && (
            <div className="mt-4 animate-fade-in">
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
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
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
                  className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors disabled:opacity-30 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2 px-1">Appuyez sur Entrée pour envoyer la modification</p>
            </div>
          )}

          {/* Debug panel */}
          {showDebug && ad._debug && (
            <div className="mt-4 bg-gray-900 text-gray-100 rounded-2xl p-5 text-xs space-y-3 max-h-[50vh] overflow-y-auto animate-fade-in">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-amber-400 text-sm">Debug</h4>
                <button onClick={() => setShowDebug(false)} className="text-gray-500 hover:text-gray-300">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {ad._debug.templateType && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">Template:</span>
                  <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md text-xs">{ad._debug.templateType}</span>
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
                <pre id="debug-scene" className="whitespace-pre-wrap text-gray-300 bg-gray-800 rounded-xl p-3 leading-relaxed hidden">
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
                  Prompt Gemini <ChevronDown className="w-3 h-3" />
                </button>
                <pre id="debug-prompt" className="whitespace-pre-wrap text-gray-300 bg-gray-800 rounded-xl p-3 leading-relaxed text-[11px] hidden">
                  {ad._debug.geminiPrompt}
                </pre>
              </div>

              {ad._debug.referenceImageLabels.length > 0 && (
                <div>
                  <span className="text-gray-500 text-xs">References:</span>
                  <ul className="mt-1 space-y-1">
                    {ad._debug.referenceImageLabels.map((label, i) => (
                      <li key={i} className="text-gray-300 bg-gray-800 rounded-xl px-3 py-1.5">{label}</li>
                    ))}
                  </ul>
                </div>
              )}

              {ad._debug.templateImageBase64 && (
                <div>
                  <span className="text-gray-500 text-xs">Template :</span>
                  <img
                    src={`data:${ad._debug.templateMimeType || "image/png"};base64,${ad._debug.templateImageBase64}`}
                    alt="Template"
                    className="mt-2 rounded-xl w-32 h-auto border border-gray-700"
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
  const isHydrated = useWizardStore((s) => s.isHydrated);
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
  const startGeneration = useWizardStore((s) => s.startGeneration);
  const completeGeneration = useWizardStore((s) => s.completeGeneration);
  const failGeneration = useWizardStore((s) => s.failGeneration);
  const syncGeneratedAd = useWizardStore((s) => s.syncGeneratedAd);
  const brandAnalysisId = useWizardStore((s) => s.brandAnalysisId);

  const handleModify = async (ad: GeneratedAd, prompt: string) => {
    if (!brandAnalysis) return;

    const product = brandAnalysis.products.find((p) => p.id === ad.productId) || brandAnalysis.products[0];
    if (!product) return;

    const productImage = uploadedImages.find((img) => img.productId === product.id);
    const originalId = ad.id;

    updateGeneratedAd(originalId, { status: "generating", error: undefined });
    setSelectedAd(null);

    try {
      const res = await fetch("/api/generate-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandAnalysis,
          product,
          format: ad.format,
          modificationPrompt: prompt,
          previousAdId: originalId,
          previousAdBase64: ad.imageBase64,
          previousAdMimeType: ad.mimeType,
          productImageBase64: productImage?.base64,
          productImageMimeType: productImage?.mimeType,
          brandLogoBase64: brandLogo?.base64,
          brandLogoMimeType: brandLogo?.mimeType,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        let errMsg = `Erreur ${res.status}`;
        try {
          const err = JSON.parse(text);
          errMsg = err.error || errMsg;
        } catch {
          errMsg = text.slice(0, 200) || errMsg;
        }
        throw new Error(errMsg);
      }

      const data = await res.json();

      updateGeneratedAd(originalId, {
        imageBase64: data.imageBase64,
        mimeType: data.mimeType,
        headline: data.headline,
        bodyText: data.bodyText,
        callToAction: data.callToAction,
        _debug: data._debug,
        status: "completed",
        error: undefined,
      });

      if (currentUser && brandAnalysisId) {
        const updatedAd = useWizardStore.getState().generatedAds.find((a) => a.id === originalId);
        if (updatedAd) {
          syncDeleteGeneratedAd(currentUser.id, originalId).catch(console.error);
          syncGeneratedAd(currentUser.id, updatedAd);
        }
      }
    } catch (err) {
      updateGeneratedAd(originalId, {
        status: "completed",
        error: err instanceof Error ? err.message : "Échec de la modification",
      });
    }
  };

  // Show loading state while hydrating from Supabase
  if (!isHydrated) {
    return (
      <div className="max-w-7xl mx-auto px-5">
        <AdsLoadingState />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-violet-50 flex items-center justify-center">
            <Images className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Mes Publicités
              {completedCount > 0 && (
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                  {completedCount}
                </span>
              )}
            </h1>
            {generatingCount > 0 && (
              <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-0.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                {generatingCount} en cours...
              </p>
            )}
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1 bg-gray-100/80 rounded-xl p-1">
          <Filter className="w-3.5 h-3.5 text-gray-400 ml-2 mr-1" />
          {(["all", "square", "story", "favorites"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f === "favorites" && <Heart className={`w-3 h-3 ${filter === "favorites" ? "fill-red-500 text-red-500" : ""}`} />}
              {f === "all" ? "Tous" : f === "square" ? "Carré" : f === "story" ? "Story" : "Favoris"}
              {f === "favorites" && favoritesCount > 0 && (
                <span className="text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full font-bold ml-0.5">{favoritesCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 gap-5 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
            {filter === "favorites" ? (
              <Heart className="w-7 h-7 text-gray-300" />
            ) : (
              <Images className="w-7 h-7 text-gray-300" />
            )}
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-gray-900">
              {filter === "favorites" ? "Aucun favori" : "Aucune publicité"}
            </p>
            <p className="text-sm text-gray-400 mt-1 max-w-xs">
              {filter === "favorites"
                ? "Cliquez sur le cœur d'une publicité pour l'ajouter ici"
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
