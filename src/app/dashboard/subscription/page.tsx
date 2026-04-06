"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { Zap, Check, Crown, Rocket, ArrowRight, Plus, Loader2 } from "lucide-react";

type SubData = { plan: string; creditsRemaining: number; creditsMonthly: number } | null;

const plans = [
  {
    id: "free",
    name: "Gratuit",
    price: "0€",
    period: "",
    credits: "2 crédits (2 publicités)",
    description: "Testez Klonr. gratuitement",
    features: [
      "2 publicités gratuites",
      "Accès à la bibliothèque",
      "4 modes de création",
      "Export HD",
    ],
    icon: Zap,
    color: "from-blue-500 to-cyan-500",
    bgLight: "bg-blue-50",
    borderColor: "border-blue-200",
    popular: false,
    badge: "Essai gratuit",
    badgeColor: "bg-green-100 text-green-700",
  },
  {
    id: "pro",
    name: "Pro",
    price: "29€",
    period: "/mois",
    credits: "500 crédits/mois",
    description: "Pour les e-commerces ambitieux",
    features: [
      "500 publicités/mois",
      "Accès complet à la bibliothèque",
      "4 modes de création",
      "Modification intelligente par IA",
      "Conversion carré ↔ story",
      "CTA personnalisable",
      "Support prioritaire",
    ],
    icon: Rocket,
    color: "from-violet-500 to-purple-500",
    bgLight: "bg-violet-50",
    borderColor: "border-violet-200",
    popular: true,
    badge: "",
    badgeColor: "",
  },
  {
    id: "agency",
    name: "Agency",
    price: "79€",
    period: "/mois",
    credits: "2 000 crédits/mois",
    description: "Volume illimité pour les agences",
    features: [
      "2 000 publicités/mois",
      "Tout le plan Pro inclus",
      "Multi-boutiques",
      "Support dédié",
      "Accès anticipé aux nouveautés",
    ],
    icon: Crown,
    color: "from-amber-500 to-orange-500",
    bgLight: "bg-amber-50",
    borderColor: "border-amber-200",
    popular: false,
    badge: "BEST ROI",
    badgeColor: "bg-amber-100 text-amber-700",
  },
];

const packs = [
  { id: "boost", name: "Boost", credits: 50, price: "4,90€" },
  { id: "growth", name: "Growth", credits: 130, price: "9,90€", best: true },
  { id: "scale", name: "Scale", credits: 300, price: "19,90€" },
];

export default function SubscriptionPage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const isAdmin = currentUser?.email === "mathys.hosin@gmail.com";
  const [sub, setSub] = useState<SubData>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user/subscription")
      .then((r) => r.json())
      .then((data) => { setSub(data); setLoading(false); })
      .catch(() => setLoading(false));
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
      alert("Erreur réseau");
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
  const planOrder = ["free", "pro", "agency"];
  const currentPlanIndex = planOrder.indexOf(currentPlan);

  return (
    <div className="max-w-5xl mx-auto px-5">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-full px-4 py-1.5 mb-4">
          <Zap className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-semibold text-violet-700">
            {isAdmin ? "Admin — Crédits illimités" : `${sub?.creditsRemaining ?? 0} crédits restants`}
          </span>
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">
          {currentPlan === "free" ? "Choisissez votre plan" : "Mon abonnement"}
        </h1>
        <p className="text-gray-500">
          {currentPlan === "free"
            ? "Commencez à générer des publicités qui convertissent"
            : "Gérez votre abonnement et vos crédits"
          }
        </p>
      </div>

      {/* Current plan banner */}
      {currentPlan !== "free" && (
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-6 text-white mb-10 flex items-center justify-between">
          <div>
            <p className="text-violet-200 text-sm font-medium">Plan actuel</p>
            <p className="text-2xl font-black">{currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}</p>
            <p className="text-violet-200 text-sm mt-1">{sub?.creditsRemaining} / {sub?.creditsMonthly} crédits ce mois</p>
          </div>
          <div className="text-right">
            <div className="w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center">
              <span className="text-xl font-black">
                {sub?.creditsMonthly ? Math.round(((sub?.creditsRemaining || 0) / sub.creditsMonthly) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-5 mb-16">
        {plans.map((plan) => {
          const planIndex = planOrder.indexOf(plan.id);
          const isCurrent = currentPlan === plan.id;
          const isDowngrade = planIndex <= currentPlanIndex && currentPlan !== "free";
          const isUpgrade = planIndex > currentPlanIndex;

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 p-6 transition-all ${
                plan.popular
                  ? "border-violet-400 shadow-lg shadow-violet-100 scale-[1.02]"
                  : isCurrent
                    ? `${plan.borderColor} bg-gray-50`
                    : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Badge above card */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                {isCurrent ? (
                  <span className="bg-green-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md whitespace-nowrap">
                    Plan actuel
                  </span>
                ) : plan.popular ? (
                  <span className="bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md whitespace-nowrap">
                    Le plus populaire
                  </span>
                ) : plan.badge ? (
                  <span className={`${plan.badgeColor} text-xs font-bold px-4 py-1 rounded-full shadow-sm whitespace-nowrap`}>
                    {plan.badge}
                  </span>
                ) : null}
              </div>

              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                <plan.icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{plan.description}</p>

              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-black text-gray-900">{plan.price}</span>
                <span className="text-sm text-gray-400">{plan.period}</span>
              </div>
              <p className="text-sm font-semibold text-violet-600 mb-6">{plan.credits}</p>

              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <button disabled className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 text-sm font-semibold cursor-not-allowed">
                  Plan actuel
                </button>
              ) : isDowngrade ? (
                <button disabled className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 text-sm font-semibold cursor-not-allowed">
                  Inclus dans votre plan
                </button>
              ) : (
                <button
                  onClick={() => handleCheckout("plan", plan.id)}
                  disabled={checkoutLoading === plan.id}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    plan.popular
                      ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:shadow-lg hover:shadow-violet-200"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {checkoutLoading === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {isUpgrade ? "Upgrader" : "Commencer"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Credit packs */}
      {currentPlan !== "free" && (
        <div className="mb-16">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Besoin de plus de crédits ?</h2>
          <p className="text-sm text-gray-500 mb-6">Achetez des crédits supplémentaires à utiliser quand vous voulez.</p>
          <div className="grid md:grid-cols-3 gap-4">
            {packs.map((pack) => (
              <div
                key={pack.id}
                className={`relative rounded-xl border-2 p-5 transition-all hover:border-violet-300 ${
                  pack.best ? "border-violet-300 bg-violet-50/50" : "border-gray-200"
                }`}
              >
                {pack.best && (
                  <span className="absolute -top-2.5 right-4 bg-violet-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full">
                    Meilleur rapport
                  </span>
                )}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{pack.name}</p>
                    <p className="text-sm text-gray-500">+{pack.credits} crédits</p>
                  </div>
                  <p className="text-xl font-black text-gray-900">{pack.price}</p>
                </div>
                <button
                  onClick={() => handleCheckout("pack", pack.id)}
                  disabled={checkoutLoading === pack.id}
                  className="w-full py-2.5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                >
                  {checkoutLoading === pack.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Acheter
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
