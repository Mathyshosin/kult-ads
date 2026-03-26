"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { Zap, Check, Crown, Loader2, ShoppingCart, ArrowRight } from "lucide-react";

type SubData = {
  plan: string;
  creditsRemaining: number;
  creditsMonthly: number;
};

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "5€",
    period: "",
    credits: 5,
    description: "Paiement unique pour tester",
    features: ["5 crédits", "Tous les formats", "Bibliothèque complète"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "29€",
    period: "/mois",
    credits: 500,
    badge: "Populaire",
    description: "Pour scaler vos publicités",
    features: ["500 crédits / mois", "Tous les formats", "Retouche IA", "Copy-ads illimité", "1 pub offerte / jour"],
  },
  {
    id: "agency",
    name: "Agency",
    price: "79€",
    period: "/mois",
    credits: 2000,
    description: "Pour les gros volumes",
    features: ["2 000 crédits / mois", "Tout le plan Pro", "Multi-marques", "Support prioritaire"],
  },
];

const PACKS = [
  { id: "boost", name: "Boost", credits: 50, price: "4,90€" },
  { id: "growth", name: "Growth", credits: 130, price: "9,90€" },
  { id: "scale", name: "Scale", credits: 300, price: "19,90€" },
];

export default function BillingPage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const isAdmin = currentUser?.email === "mathys.hosin@gmail.com";
  const [sub, setSub] = useState<SubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user/subscription")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setSub(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCheckout = async (type: "plan" | "pack", id: string) => {
    setCheckoutLoading(id);
    try {
      const body = type === "plan" ? { planId: id } : { packId: id };
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Erreur lors du checkout");
        setCheckoutLoading(null);
      }
    } catch {
      alert("Erreur de connexion");
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
      </div>
    );
  }

  const currentPlan = sub?.plan || "free";

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      {/* Current plan */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Mon abonnement</h1>
        <p className="text-sm text-gray-400">Gérez votre plan et vos crédits</p>
      </div>

      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl p-6 mb-10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-5 h-5 text-violet-500" />
              <span className="text-lg font-bold text-gray-900">
                Plan {isAdmin ? "Admin" : currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {isAdmin ? "Crédits illimités" : `${sub?.creditsRemaining ?? 0} crédits restants`}
              {sub?.creditsMonthly ? ` sur ${sub.creditsMonthly} / mois` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 border border-violet-100">
            <Zap className="w-5 h-5 text-violet-500" />
            <span className="text-2xl font-extrabold text-violet-700">
              {isAdmin ? "∞" : (sub?.creditsRemaining ?? 0)}
            </span>
            <span className="text-xs text-violet-400">crédits</span>
          </div>
        </div>
      </div>

      {/* Plans */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">Changer de plan</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          return (
            <div
              key={plan.id}
              className={`rounded-2xl p-6 border transition-all ${
                plan.badge
                  ? "border-violet-200 bg-gradient-to-b from-violet-50/60 to-white ring-2 ring-violet-200"
                  : "border-gray-100 bg-white hover:shadow-md"
              } ${isCurrent ? "ring-2 ring-green-300" : ""}`}
            >
              {plan.badge && (
                <span className="inline-block bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full mb-3">
                  {plan.badge}
                </span>
              )}
              {isCurrent && (
                <span className="inline-block bg-green-100 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded-full mb-3 ml-1">
                  Plan actuel
                </span>
              )}
              <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{plan.description}</p>
              <div className="mt-4 mb-5">
                <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
                {plan.period && <span className="text-gray-400 text-sm ml-1">{plan.period}</span>}
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-3.5 h-3.5 text-violet-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleCheckout("plan", plan.id)}
                disabled={isCurrent || checkoutLoading === plan.id}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  isCurrent
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : plan.badge
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-lg hover:shadow-violet-500/25 cursor-pointer"
                    : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 cursor-pointer"
                }`}
              >
                {checkoutLoading === plan.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isCurrent ? (
                  "Plan actuel"
                ) : (
                  <>Choisir <ArrowRight className="w-3.5 h-3.5" /></>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Credit packs */}
      <h2 className="text-lg font-bold text-gray-900 mb-2">Acheter des crédits</h2>
      <p className="text-sm text-gray-400 mb-5">Besoin de plus ? Ajoutez des crédits instantanément.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PACKS.map((pack) => (
          <button
            key={pack.id}
            onClick={() => handleCheckout("pack", pack.id)}
            disabled={checkoutLoading === pack.id}
            className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-5 py-4 hover:shadow-md hover:border-violet-200 transition-all group cursor-pointer"
          >
            <div className="text-left">
              <p className="font-bold text-gray-900 group-hover:text-violet-700 transition-colors">{pack.name}</p>
              <p className="text-xs text-gray-400">{pack.credits} crédits</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold text-violet-600">{pack.price}</span>
              {checkoutLoading === pack.id ? (
                <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
              ) : (
                <ShoppingCart className="w-4 h-4 text-gray-300 group-hover:text-violet-400 transition-colors" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
