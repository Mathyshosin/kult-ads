"use client";

import { useState, useEffect, useCallback } from "react";
import { Gift, Sparkles, X, Loader2, PartyPopper } from "lucide-react";

export default function GiftPopup() {
  const [state, setState] = useState<"hidden" | "checking" | "intro" | "generating" | "ready" | "revealed">("checking");
  const [adImage, setAdImage] = useState<string | null>(null);
  const [adMime, setAdMime] = useState<string>("image/png");

  useEffect(() => {
    fetch("/api/gift")
      .then((r) => r.json())
      .then((data) => {
        if (!data.gift) { setState("hidden"); return; }
        if (data.gift.seen) { setState("hidden"); return; }

        if (data.gift.status === "pending") {
          // Show intro first, generate on "Découvrir" click
          setState("intro");
        } else if (data.gift.status === "completed" && data.gift.adImage) {
          // Already generated, show it
          setAdImage(data.gift.adImage);
          setAdMime(data.gift.adMimeType || "image/png");
          setState("ready");
        } else if (data.gift.status === "completed" && !data.gift.seen) {
          // Completed but no image in response — show generic reveal
          setState("ready");
        }
      })
      .catch(() => setState("hidden"));
  }, []);

  const handleDiscover = useCallback(() => {
    if (state === "intro") {
      // Start generating
      setState("generating");
      fetch("/api/gift", { method: "POST" })
        .then((r) => r.json())
        .then((genData) => {
          if (genData.gift?.ad?.imageBase64) {
            setAdImage(genData.gift.ad.imageBase64);
            setAdMime(genData.gift.ad.mimeType || "image/png");
          }
          setState("ready");
        })
        .catch(() => setState("ready"));
    } else if (state === "ready") {
      setState("revealed");
    }
  }, [state]);

  const handleClose = () => {
    setState("hidden");
    fetch("/api/gift", { method: "PATCH" }).catch(() => {});
  };

  if (state === "hidden" || state === "checking") return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-300">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Confetti particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: ["#F59E0B", "#EC4899", "#8B5CF6", "#10B981", "#3B82F6"][i % 5],
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random() * 2}s`,
              opacity: 0.6,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-sm w-full mx-4">
        {/* INTRO — Gift box animation */}
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

        {/* GENERATING — Loading animation */}
        {state === "generating" && (
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl text-center">
            <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-pink-500 p-8">
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
            </div>
          </div>
        )}

        {/* READY — Show "Ouvrir" button */}
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

        {/* REVEALED — Show the ad */}
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
                  onClick={handleClose}
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
                  onClick={handleClose}
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
