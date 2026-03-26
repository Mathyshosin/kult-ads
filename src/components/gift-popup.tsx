"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Gift, Sparkles, X, Loader2, PartyPopper } from "lucide-react";
import { useWizardStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import type { GeneratedAd } from "@/lib/types";

export default function GiftPopup() {
  const router = useRouter();
  const addGeneratedAd = useWizardStore((s) => s.addGeneratedAd);
  const syncGeneratedAd = useWizardStore((s) => s.syncGeneratedAd);
  const currentUser = useAuthStore((s) => s.currentUser);

  const [state, setState] = useState<"hidden" | "checking" | "intro" | "generating" | "ready" | "revealed">("checking");
  const [minimized, setMinimized] = useState(false);
  const [adImage, setAdImage] = useState<string | null>(null);
  const [adMime, setAdMime] = useState<string>("image/png");
  const generatingRef = useRef(false);

  useEffect(() => {
    fetch("/api/gift")
      .then((r) => r.json())
      .then((data) => {
        if (!data.gift) { setState("hidden"); return; }
        if (data.gift.seen) { setState("hidden"); return; }
        if (data.gift.status === "pending") {
          setState("intro");
        } else if (data.gift.status === "completed" && !data.gift.seen) {
          setState("ready");
        }
      })
      .catch(() => setState("hidden"));
  }, []);

  const doGenerate = useCallback(async () => {
    if (generatingRef.current) return;
    generatingRef.current = true;

    try {
      const res = await fetch("/api/gift", { method: "POST" });
      const data = await res.json();

      if (!data.generatePayload) { setState("ready"); return; }

      // Force square format
      data.generatePayload.format = "square";

      const genRes = await fetch("/api/generate-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.generatePayload),
      });

      if (genRes.ok) {
        const adData = await genRes.json();
        if (adData.imageBase64) {
          setAdImage(adData.imageBase64);
          setAdMime(adData.mimeType || "image/png");
        }

        const newAd: GeneratedAd = {
          id: adData.id || `gift-${Date.now()}`,
          format: "square",
          imageBase64: adData.imageBase64,
          mimeType: adData.mimeType || "image/png",
          headline: adData.headline || "",
          bodyText: adData.bodyText || "",
          callToAction: adData.callToAction || "",
          productId: adData.productId,
          templateId: adData.templateId,
          timestamp: Date.now(),
          isGift: true,
        };

        addGeneratedAd(newAd);
        if (currentUser) {
          syncGeneratedAd(currentUser.id, newAd);
        }

        await fetch("/api/gift", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "complete", adId: newAd.id }),
        });
      }

      setState("ready");
      setMinimized(false);
    } catch (err) {
      console.error("[gift] Generation failed:", err);
      setState("ready");
      setMinimized(false);
    }
  }, [addGeneratedAd, syncGeneratedAd, currentUser]);

  const handleDiscover = useCallback(() => {
    if (state === "intro") {
      setState("generating");
      doGenerate();
    } else if (state === "ready") {
      setState("revealed");
    }
  }, [state, doGenerate]);

  const handleMinimize = () => {
    setMinimized(true);
  };

  const handleRestore = () => {
    setMinimized(false);
  };

  const handleClose = () => {
    setState("hidden");
    fetch("/api/gift", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }).catch(() => {});
  };

  const handleGoToAds = () => {
    setState("hidden");
    fetch("/api/gift", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }).catch(() => {});
    router.push("/dashboard/ads");
  };

  if (state === "hidden" || state === "checking") return null;

  // ── Minimized notification bar ──
  if (minimized && state === "generating") {
    return (
      <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom duration-300">
        <div
          onClick={handleRestore}
          className="flex items-center gap-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-5 py-3 rounded-2xl shadow-xl shadow-amber-500/20 cursor-pointer hover:shadow-2xl transition-all"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm font-bold">Cadeau en préparation...</span>
          <Gift className="w-4 h-4" />
        </div>
      </div>
    );
  }

  if (minimized && state === "ready") {
    return (
      <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom duration-300">
        <div
          onClick={() => { setMinimized(false); setState("ready"); }}
          className="flex items-center gap-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-5 py-3 rounded-2xl shadow-xl shadow-amber-500/20 cursor-pointer hover:shadow-2xl hover:scale-105 transition-all animate-pulse"
        >
          <PartyPopper className="w-4 h-4" />
          <span className="text-sm font-bold">Votre cadeau est prêt !</span>
          <span className="bg-white/20 rounded-lg px-2 py-0.5 text-xs font-bold">Ouvrir</span>
        </div>
      </div>
    );
  }

  // ── Full popup ──
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={state === "generating" ? handleMinimize : undefined} />

      {/* Confetti */}
      {(state === "intro" || state === "ready" || state === "revealed") && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-bounce"
              style={{
                left: `${10 + (i * 4.2) % 80}%`,
                top: `${5 + (i * 7.3) % 85}%`,
                backgroundColor: ["#F59E0B", "#EC4899", "#8B5CF6", "#10B981", "#3B82F6"][i % 5],
                animationDelay: `${(i * 0.15) % 2}s`,
                animationDuration: `${1.5 + (i % 3) * 0.5}s`,
                opacity: 0.6,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 max-w-sm w-full mx-4">
        {/* INTRO */}
        {state === "intro" && (
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl text-center">
            <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-pink-500 p-8">
              <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 animate-bounce" style={{ animationDuration: "2s" }}>
                <Gift className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-black text-white mb-1">Vous avez un cadeau !</h2>
              <p className="text-white/80 text-sm">Une publicité exclusive générée rien que pour vous</p>
            </div>
            <div className="p-6">
              <button
                onClick={handleDiscover}
                className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold py-4 rounded-2xl hover:shadow-lg hover:shadow-amber-200 transition-all text-lg flex items-center justify-center gap-3"
              >
                <Sparkles className="w-5 h-5" />
                Découvrir mon cadeau
              </button>
              <button onClick={handleClose} className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                Plus tard
              </button>
            </div>
          </div>
        )}

        {/* GENERATING */}
        {state === "generating" && (
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl text-center">
            <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-pink-500 p-8 relative">
              <button
                onClick={handleMinimize}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
              </div>
              <h2 className="text-xl font-black text-white mb-1">Préparation en cours...</h2>
              <p className="text-white/80 text-sm">Notre IA crée votre publicité du jour</p>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-center gap-3 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                <span className="text-sm font-medium">Génération en cours (~30s)</span>
              </div>
              <div className="mt-4 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full animate-pulse" style={{ width: "60%" }} />
              </div>
              <button onClick={handleMinimize} className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                Continuer en arrière-plan
              </button>
            </div>
          </div>
        )}

        {/* READY */}
        {state === "ready" && (
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl text-center">
            <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-pink-500 p-8">
              <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                <PartyPopper className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-black text-white mb-1">Votre cadeau est prêt !</h2>
              <p className="text-white/80 text-sm">Cliquez pour découvrir votre pub du jour</p>
            </div>
            <div className="p-6">
              <button
                onClick={handleDiscover}
                className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold py-4 rounded-2xl hover:shadow-lg hover:shadow-amber-200 transition-all text-lg flex items-center justify-center gap-3 animate-pulse"
              >
                <Gift className="w-5 h-5" />
                Ouvrir le cadeau
              </button>
            </div>
          </div>
        )}

        {/* REVEALED */}
        {state === "revealed" && (
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gift className="w-5 h-5 text-white" />
                <span className="font-bold text-white">Cadeau du jour</span>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {adImage ? (
              <div className="p-4">
                <div className="rounded-2xl overflow-hidden mb-4 shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`data:${adMime};base64,${adImage}`}
                    alt="Cadeau du jour"
                    className="w-full"
                  />
                </div>
                <button
                  onClick={handleGoToAds}
                  className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Voir dans Mes Ads
                </button>
              </div>
            ) : (
              <div className="p-8 text-center">
                <PartyPopper className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                <p className="text-gray-600 font-semibold mb-1">Publicité ajoutée !</p>
                <p className="text-sm text-gray-400 mb-4">Retrouvez-la dans votre bibliothèque</p>
                <button
                  onClick={handleGoToAds}
                  className="bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold px-8 py-3 rounded-xl hover:shadow-lg transition-all"
                >
                  Voir dans Mes Ads
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
