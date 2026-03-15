"use client";

import { useState, useEffect } from "react";
import { Lightbulb } from "lucide-react";

const TIPS = [
  "Les publicités avec des visages humains ont un taux de clic 38% plus élevé",
  "Les couleurs chaudes (rouge, orange) créent un sentiment d'urgence",
  "Un CTA clair augmente les conversions de 121%",
  "Les vidéos courtes (<15s) ont le meilleur ROI sur les réseaux sociaux",
  "Le retargeting peut augmenter les conversions de 150%",
  "Les témoignages clients augmentent la confiance de 72%",
  "Les publicités avec des chiffres précis génèrent 73% plus de partages",
  "Le contenu UGC a un taux d'engagement 4x supérieur aux ads classiques",
  "Un sentiment de rareté augmente les ventes de 226%",
  "Les emojis dans les titres augmentent le taux d'ouverture de 25%",
  "80% des consommateurs préfèrent regarder une vidéo plutôt que lire un texte",
  "Les publicités personnalisées ont un CTR 2x plus élevé",
  "Le storytelling augmente la mémorisation de marque de 22x",
  "Les images haute qualité augmentent les conversions de 40%",
  "Les publicités en carrousel ont un coût par acquisition 30% inférieur",
  "La preuve sociale (avis, nombre de clients) booste les conversions de 34%",
  "Les publicités mobiles-first ont un taux de conversion 64% supérieur",
  "Un bon contraste texte/fond améliore la lisibilité et le CTR de 52%",
];

export default function GrowthTips() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % TIPS.length);
        setVisible(true);
      }, 400);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="max-w-sm mx-auto transition-all duration-500"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
      }}
    >
      <div className="bg-white rounded-2xl border border-amber-100/80 shadow-soft px-5 py-4 flex items-start gap-3.5">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center">
          <Lightbulb className="w-4 h-4 text-amber-500" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider mb-1">
            Le saviez-vous ?
          </p>
          <p className="text-sm text-muted leading-relaxed">{TIPS[currentIndex]}</p>
        </div>
      </div>
    </div>
  );
}
