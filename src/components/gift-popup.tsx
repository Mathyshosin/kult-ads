"use client";

import { useState, useEffect } from "react";
import { Gift, Sparkles, X, Loader2 } from "lucide-react";

export default function GiftPopup() {
  const [state, setState] = useState<"hidden" | "checking" | "generating" | "reveal" | "show">("checking");
  const [adImage, setAdImage] = useState<string | null>(null);
  const [adMime, setAdMime] = useState<string>("image/png");

  useEffect(() => {
    // Check if there's a pending gift
    fetch("/api/gift")
      .then((r) => r.json())
      .then((data) => {
        if (!data.gift) { setState("hidden"); return; }
        if (data.gift.seen) { setState("hidden"); return; }

        if (data.gift.status === "pending") {
          // Gift needs to be generated
          setState("generating");
          fetch("/api/gift", { method: "POST" })
            .then((r) => r.json())
            .then((genData) => {
              if (genData.gift?.ad) {
                setAdImage(genData.gift.ad.imageBase64);
                setAdMime(genData.gift.ad.mimeType || "image/png");
                setState("reveal");
              } else {
                setState("hidden");
              }
            })
            .catch(() => setState("hidden"));
        } else if (data.gift.status === "completed" && !data.gift.seen) {
          // Gift already generated but not seen — we need the image
          // For now just show the reveal state
          setState("reveal");
        }
      })
      .catch(() => setState("hidden"));
  }, []);

  const handleSeen = () => {
    setState("hidden");
    fetch("/api/gift", { method: "PATCH" }).catch(() => {});
  };

  if (state === "hidden" || state === "checking") return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleSeen} />

      {/* Content */}
      <div className="relative z-10 max-w-sm w-full mx-4">
        {state === "generating" && (
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl animate-pulse">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-200">
              <Gift className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Votre cadeau arrive...</h2>
            <p className="text-sm text-gray-500 mb-6">Notre IA prépare votre publicité du jour</p>
            <Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
          </div>
        )}

        {(state === "reveal" || state === "show") && (
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 p-6 text-center relative">
              <button
                onClick={handleSeen}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-black text-white">Cadeau du jour</h2>
              <p className="text-sm text-white/80 mt-1">Votre publicité quotidienne offerte</p>
            </div>

            {/* Ad image */}
            {state === "reveal" && !adImage && (
              <div className="p-8 text-center">
                <Sparkles className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                <p className="text-sm text-gray-500">Votre cadeau a été ajouté à votre bibliothèque !</p>
                <button
                  onClick={handleSeen}
                  className="mt-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold px-8 py-3 rounded-xl hover:shadow-lg transition-all"
                >
                  Voir dans Mes Ads
                </button>
              </div>
            )}

            {state === "reveal" && adImage && (
              <div className="p-4">
                <div className="rounded-2xl overflow-hidden mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`data:${adMime};base64,${adImage}`}
                    alt="Cadeau du jour"
                    className="w-full"
                  />
                </div>
                <button
                  onClick={handleSeen}
                  className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Merci ! Voir dans Mes Ads
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
