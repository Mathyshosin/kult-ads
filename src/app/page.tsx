import Link from "next/link";
import Image from "next/image";
import { KultLogoFull, KultLogoIcon } from "@/components/kult-logo";
import LiveTemplateCarousel from "@/components/live-template-carousel";
import {
  Sparkles,
  Zap,
  Globe,
  MousePointerClick,
  Layers,
  PenTool,
  RectangleHorizontal,
  Library,
  Gift,
  Check,
  ArrowRight,
  ChevronDown,
  BarChart3,
  Star,
  RefreshCw,
} from "lucide-react";

/* ─────────────────────── NAVBAR ─────────────────────── */

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" aria-label="Accueil">
          <KultLogoFull />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#fonctionnalites" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Fonctionnalités
          </a>
          <a href="#comment-ca-marche" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Comment ça marche
          </a>
          <a href="#tarifs" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Tarifs
          </a>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden sm:inline text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Connexion
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all duration-200"
          >
            Essayer gratuitement
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ─────────────────────── HERO ─────────────────────── */

function Hero() {
  return (
    <section className="pt-28 pb-20 px-6 bg-white relative overflow-hidden">
      {/* Subtle background dots */}
      <div className="absolute inset-0 bg-dots opacity-40 pointer-events-none" />

      <div className="max-w-5xl mx-auto text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-full px-5 py-2 mb-8 animate-fade-in">
          <Gift className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-semibold text-violet-700">
            Votre première publicité est offerte
          </span>
        </div>

        {/* H1 */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-[1.1] tracking-tight animate-fade-in-up">
          Créez des publicités qui{" "}
          <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent">
            convertissent
          </span>{" "}
          en 30 secondes
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          Collez l&apos;URL de votre site, notre IA analyse votre marque et génère
          des publicités professionnelles inspirées des meilleures ads du marché.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <Link
            href="/signup"
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white font-semibold px-8 py-4 rounded-2xl text-lg hover:shadow-xl hover:shadow-violet-500/25 transition-all duration-300 hover:scale-[1.02]"
          >
            Créer ma première pub gratuitement
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#comment-ca-marche"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium px-6 py-4 rounded-2xl border border-gray-200 hover:border-gray-300 transition-all duration-200"
          >
            <ChevronDown className="w-4 h-4" />
            Voir comment ça marche
          </a>
        </div>

        {/* Trust line */}
        <p className="mt-5 text-sm text-gray-400 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          Pas de carte bancaire requise &middot; Première pub offerte
        </p>

        {/* Before/After Mockup in Hero — real images */}
        <div className="mt-16 max-w-lg mx-auto animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-violet-500/10 border border-gray-100">
            <div className="relative aspect-square hero-ba-container">
              {/* Before (Template — Decorté) */}
              <div className="absolute inset-0">
                <Image src="/before.png" alt="Template d'inspiration" fill className="object-cover" sizes="500px" />
              </div>

              {/* After (Generated — HelloBoku) */}
              <div className="absolute inset-0 hero-after-slide overflow-hidden">
                <Image src="/after.png" alt="Publicité générée par kultads" fill className="object-cover" sizes="500px" />
              </div>

              {/* Labels — separate from layers for proper visibility */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-md px-2.5 py-1 text-[10px] font-bold text-white z-30 hero-label-before">
                Avant
              </div>
              <div className="absolute top-3 right-3 bg-violet-500/90 backdrop-blur-sm rounded-md px-2.5 py-1 text-[10px] font-bold text-white z-30 hero-label-after">
                Après
              </div>

              {/* Slider line */}
              <div className="absolute inset-0 flex items-center pointer-events-none hero-slider-line z-20">
                <div className="w-0.5 h-full bg-white shadow-lg" />
              </div>
            </div>
          </div>
          <div className="flex justify-between px-2 mt-2 text-[11px] font-medium text-gray-400">
            <span>Template d&apos;inspiration</span>
            <span>Votre publicité</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── SOCIAL PROOF BAR ─────────────────────── */

function SocialProofBar() {
  const stats = [
    { icon: Zap, label: "500+ ads générées", color: "text-amber-500" },
    { icon: Star, label: "50+ marques", color: "text-violet-500" },
    { icon: RefreshCw, label: "Bibliothèque mise à jour quotidiennement", color: "text-indigo-500" },
  ];

  return (
    <section className="py-8 px-6 bg-gray-50 border-y border-gray-100">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-3">
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
            <span className="text-sm font-semibold text-gray-700">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────── HOW IT WORKS ─────────────────────── */

function StepUrlAnimation() {
  return (
    <div className="bg-gray-900 rounded-xl p-4 mb-6 overflow-hidden">
      {/* Browser bar */}
      <div className="flex items-center gap-1.5 mb-3">
        <div className="w-2 h-2 rounded-full bg-red-400" />
        <div className="w-2 h-2 rounded-full bg-yellow-400" />
        <div className="w-2 h-2 rounded-full bg-green-400" />
      </div>
      {/* URL bar with typing */}
      <div className="bg-gray-800 rounded-lg px-3 py-2 flex items-center gap-2 mb-3">
        <Globe className="w-3 h-3 text-gray-500 flex-shrink-0" />
        <div className="text-[11px] text-violet-400 font-mono step-url-typing">
          www.votre-boutique.com
        </div>
      </div>
      {/* Scan results appearing */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 step-scan-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-[10px] text-gray-400">Logo</span>
          <div className="ml-auto w-5 h-5 rounded bg-violet-500/30 step-scan-pulse" />
        </div>
        <div className="flex items-center gap-2 step-scan-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-[10px] text-gray-400">3 produits</span>
          <div className="ml-auto flex gap-0.5">
            <div className="w-4 h-4 rounded bg-blue-500/30" />
            <div className="w-4 h-4 rounded bg-pink-500/30" />
            <div className="w-4 h-4 rounded bg-amber-500/30" />
          </div>
        </div>
        <div className="flex items-center gap-2 step-scan-3">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-[10px] text-gray-400">Couleurs</span>
          <div className="ml-auto flex gap-0.5">
            <div className="w-3 h-3 rounded-full bg-indigo-500" />
            <div className="w-3 h-3 rounded-full bg-white" />
            <div className="w-3 h-3 rounded-full bg-gray-700" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StepTemplateAnimation() {
  return <LiveTemplateCarousel />;
}

function StepGenerateAnimation() {
  return (
    <div className="bg-gray-50 rounded-xl p-4 mb-6 overflow-hidden">
      <div className="relative w-full aspect-square rounded-lg overflow-hidden">
        {/* Before — real template */}
        <div className="absolute inset-0">
          <Image src="/before.png" alt="Template original" fill className="object-cover" sizes="300px" />
        </div>
        {/* After — real generated ad */}
        <div className="absolute inset-0 step-generate-reveal">
          <Image src="/after.png" alt="Ad générée" fill className="object-cover" sizes="300px" />
        </div>
      </div>
      {/* Timer */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        <Zap className="w-3 h-3 text-violet-500 step-zap-pulse" />
        <span className="text-[10px] font-medium text-gray-500">~30 secondes</span>
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      number: "1",
      title: "Analysez votre marque",
      description: "Collez l'URL de votre site. Notre IA analyse tout automatiquement.",
      demo: <StepUrlAnimation />,
    },
    {
      number: "2",
      title: "Choisissez votre style",
      description: "Parcourez notre bibliothèque ou uploadez votre propre référence.",
      demo: <StepTemplateAnimation />,
    },
    {
      number: "3",
      title: "Générez en 1 clic",
      description: "Votre publicité pro est prête en 30 secondes.",
      demo: <StepGenerateAnimation />,
    },
  ];

  return (
    <section id="comment-ca-marche" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Comment ça marche
          </h2>
          <p className="mt-4 text-gray-500 text-lg max-w-xl mx-auto">
            3 étapes simples pour créer des publicités performantes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step) => (
            <div key={step.number} className="relative text-center group">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500 text-white text-sm font-bold mb-5 shadow-lg shadow-violet-500/20">
                {step.number}
              </div>
              {step.demo}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── FEATURES ─────────────────────── */

function Features() {
  const features = [
    {
      title: "4 modes de création",
      description:
        "Auto, Bibliothèque, Copy-Ads ou Prompt personnalisé. Choisissez le mode qui correspond à votre workflow.",
      svg: (
        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
          <rect x="2" y="3" width="9" height="9" rx="2" fill="#818CF8" opacity="0.3" />
          <rect x="5" y="6" width="9" height="9" rx="2" fill="#818CF8" opacity="0.5" />
          <rect x="8" y="9" width="9" height="9" rx="2" fill="#818CF8" opacity="0.7" />
          <rect x="11" y="12" width="9" height="9" rx="2" fill="#6366F1" />
          <path d="M15 15l2 2m-1-3a2 2 0 11-4 0 2 2 0 014 0z" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      title: "Modification intelligente",
      description:
        "Modifiez vos publicités générées avec de simples instructions textuelles. L'IA comprend vos demandes.",
      svg: (
        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
          <rect x="3" y="3" width="18" height="18" rx="3" fill="#FDA4AF" opacity="0.3" />
          <path d="M7 13l3-8 3 8" stroke="#E11D48" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 11h4" stroke="#E11D48" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M16 8v8" stroke="#E11D48" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="19" cy="5" r="3" fill="#F43F5E" />
          <path d="M18 5h2M19 4v2" stroke="white" strokeWidth="1" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      title: "Format Carré & Story",
      description:
        "Générez en carré et en story. Convertissez du carré au story en un seul clic.",
      svg: (
        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
          <rect x="2" y="5" width="11" height="11" rx="2.5" fill="#93C5FD" opacity="0.4" />
          <rect x="2" y="5" width="11" height="11" rx="2.5" stroke="#3B82F6" strokeWidth="1.2" />
          <rect x="15" y="2" width="7" height="18" rx="2" fill="#60A5FA" opacity="0.4" />
          <rect x="15" y="2" width="7" height="18" rx="2" stroke="#3B82F6" strokeWidth="1.2" />
          <path d="M12 11l4-2" stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 2" />
        </svg>
      ),
    },
    {
      title: "Bibliothèque d'ads gagnantes",
      description:
        "Une collection de publicités top-performers mise à jour chaque jour pour vous inspirer.",
      svg: (
        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
          <rect x="2" y="4" width="6" height="8" rx="1.5" fill="#FBBF24" opacity="0.5" />
          <rect x="9" y="4" width="6" height="8" rx="1.5" fill="#F59E0B" opacity="0.7" />
          <rect x="16" y="4" width="6" height="8" rx="1.5" fill="#D97706" />
          <rect x="2" y="14" width="6" height="8" rx="1.5" fill="#F59E0B" opacity="0.6" />
          <rect x="9" y="14" width="6" height="8" rx="1.5" fill="#D97706" opacity="0.8" />
          <rect x="16" y="14" width="6" height="8" rx="1.5" fill="#FBBF24" opacity="0.4" />
          <path d="M12 9l1.5-3 1.5 3-3 .5 2 2-.5 3-2.5-1.5L8.5 14.5 8 11.5l2-2z" fill="#F59E0B" stroke="#D97706" strokeWidth="0.5" />
        </svg>
      ),
    },
  ];

  const colors = [
    { bg: "from-indigo-500 to-violet-500", light: "from-indigo-50 to-violet-50" },
    { bg: "from-rose-500 to-pink-500", light: "from-rose-50 to-pink-50" },
    { bg: "from-blue-500 to-cyan-500", light: "from-blue-50 to-cyan-50" },
    { bg: "from-amber-500 to-orange-500", light: "from-amber-50 to-orange-50" },
  ];

  return (
    <section id="fonctionnalites" className="py-24 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 text-xs font-medium text-gray-600 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-violet-500" />
            Fonctionnalités
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Tout ce dont vous avez besoin
          </h2>
          <p className="mt-4 text-gray-500 text-lg max-w-xl mx-auto">
            Des outils puissants pour créer des ads qui performent.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {features.map((feature, i) => {
            const color = colors[i % colors.length];
            return (
              <div
                key={feature.title}
                className="relative bg-white p-7 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-500 group overflow-hidden"
              >
                {/* Gradient accent line at top */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color.light} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    {feature.svg}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1.5">
                      {feature.title}
                    </h3>
                    <p className="text-gray-500 leading-relaxed text-[13px]">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── COMPARISON ─────────────────────── */

function Comparison() {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-full px-4 py-1.5 text-xs font-medium text-violet-600 mb-4">
            <Zap className="w-3.5 h-3.5" />
            Comparatif
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Pourquoi choisir <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">kultads</span> ?
          </h2>
          <p className="mt-4 text-gray-500 text-lg max-w-2xl mx-auto">
            Les outils génériques ne comprennent pas le e-commerce. Les concurrents ne vont pas assez loin.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {/* ChatGPT / Midjourney */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-gray-900 font-semibold text-sm">ChatGPT / Midjourney</span>
            </div>
            <div className="space-y-3.5">
              {[
                "Aucune connaissance marketing",
                "Prompts complexes à rédiger",
                "N'intègre pas vos produits",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <div className="w-4.5 h-4.5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-500 text-[10px] font-bold">✕</span>
                  </div>
                  <span className="text-gray-500 text-[13px]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* kultads — highlighted center */}
          <div className="relative bg-gradient-to-br from-violet-600 via-indigo-600 to-violet-700 rounded-2xl p-6 shadow-2xl shadow-violet-500/25 md:-mt-4 md:mb-[-16px]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-400 text-[10px] font-bold uppercase tracking-wider text-gray-900 px-4 py-1 rounded-full shadow-lg whitespace-nowrap">
              Outil n°1 pour le e-commerce
            </div>
            <div className="flex items-center gap-3 mb-6 mt-2">
              <KultLogoIcon className="w-10 h-10" />
              <span className="text-white font-bold text-lg">kultads</span>
            </div>
            <div className="space-y-3.5">
              {[
                "Bibliothèque de 1 000+ ads gagnantes",
                "Intégration produit automatique",
                "Clone les ads qui convertissent",
                "Retouche par simple instruction",
                "Format carré + story en 1 clic",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <div className="w-4.5 h-4.5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-white/90 text-[13px] font-medium">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Link
                href="/signup"
                className="block w-full text-center bg-white text-violet-700 font-semibold py-3 rounded-xl hover:bg-violet-50 transition-colors text-sm"
              >
                Commencer gratuitement
              </Link>
            </div>
          </div>

          {/* Concurrents (AdCreative, Pencil, etc.) */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-gray-400" />
              </div>
              <span className="text-gray-900 font-semibold text-sm">AdCreative, Pencil...</span>
            </div>
            <div className="space-y-3.5">
              {[
                { text: "Templates génériques, pas de vraies ads", bad: true },
                { text: "Pas de copy-ads depuis une référence", bad: true },
                { text: "Abonnements à 49-149$/mois", bad: true },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-2.5">
                  <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${item.bad ? "bg-red-100" : "bg-green-100"}`}>
                    <span className={`text-[10px] font-bold ${item.bad ? "text-red-500" : "text-green-500"}`}>{item.bad ? "✕" : "✓"}</span>
                  </div>
                  <span className="text-gray-500 text-[13px]">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── WHY US ─────────────────────── */

function WhyUs() {
  return (
    <section className="py-24 px-6 bg-gray-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E\")" }} />

      <div className="max-w-5xl mx-auto relative">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-xs font-medium text-violet-400 mb-5">
            <Star className="w-3.5 h-3.5" />
            Notre ADN
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-5">
            Pas juste un outil.<br />
            <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
              Une expertise.
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            {"Derrière kultads, il y a une agence spécialisée dans les publicités statiques pour le e-commerce. On ne fait pas de l'IA pour le fun — on fait de l'IA qui vend."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-7 hover:bg-white/[0.08] transition-all duration-500">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center mb-5">
              <RefreshCw className="w-5 h-5 text-violet-400" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">{"Entraînée chaque jour"}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {"Notre IA apprend en continu. Chaque jour, nous alimentons sa base avec de nouvelles ads qui performent réellement sur Meta, TikTok et Google. Pas des templates Canva."}
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-7 hover:bg-white/[0.08] transition-all duration-500">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-5">
              <BarChart3 className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">{"Des ads qui convertissent, pas qui décorent"}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {"Chaque template de notre bibliothèque est une publicité qui a généré du chiffre d'affaires. On sélectionne uniquement les ads avec un ROAS prouvé."}
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-7 hover:bg-white/[0.08] transition-all duration-500">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center mb-5">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <path d="M9 12l2 2 4-4" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M15 3l3 3-3 3" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">{"Le regard d'une agence, la vitesse de l'IA"}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {"Notre équipe valide et catégorise chaque ad de la bibliothèque. L'IA génère en 30 secondes ce qu'un designer ferait en 2 jours — avec le même niveau d'exigence."}
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-7 hover:bg-white/[0.08] transition-all duration-500">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-5">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="#60A5FA" strokeWidth="1.5"/>
                <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="#60A5FA" strokeWidth="1.5"/>
                <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="#60A5FA" strokeWidth="1.5"/>
                <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="#60A5FA" strokeWidth="1.5" fill="#60A5FA" fillOpacity="0.2"/>
                <path d="M16 18h2M17 17v2" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">{"+1 000 ads et ça ne s'arrête pas"}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {"Notre bibliothèque grandit chaque jour. Plus elle grandit, plus l'IA est précise. Plus elle est précise, plus vos ads performent. Cercle vertueux."}
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm italic max-w-lg mx-auto">
            {"\u00AB On a créé l'outil qu'on aurait rêvé d'avoir quand on faisait 200 ads par mois pour nos clients. \u00BB"}
          </p>
          <p className="text-violet-400 text-xs font-medium mt-2">{"— L'équipe kultads"}</p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── DAILY GIFT ─────────────────────── */

function DailyGift() {
  return (
    <section className="py-20 px-6 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 text-white mb-6 shadow-lg shadow-amber-500/20">
          <Gift className="w-8 h-8" />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
          Un cadeau chaque jour
        </h2>
        <p className="mt-4 text-gray-600 text-lg max-w-xl mx-auto leading-relaxed">
          Les abonnés Pro et Agency reçoivent automatiquement{" "}
          <span className="font-semibold text-amber-700">1 publicité offerte chaque jour</span>,
          générée par notre IA à partir de votre marque. Ouvrez l&apos;app, votre pub vous attend.
        </p>
        <div className="mt-8">
          <Link
            href="#tarifs"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-400 text-white font-semibold px-7 py-3.5 rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-200"
          >
            Découvrir les offres
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── PRICING ─────────────────────── */

function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "0€",
      period: "",
      description: "Pour tester kultads",
      features: [
        "1 pub offerte",
        "Accès bibliothèque limité",
        "Format carré uniquement",
      ],
      cta: "Commencer gratuitement",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "29€",
      period: "/mois",
      description: "Pour les e-commerces ambitieux",
      badge: "Le plus populaire",
      features: [
        "Créations illimitées",
        "Tous les formats (carré + story)",
        "Modification IA",
        "Cadeau quotidien (1 pub/jour)",
        "Bibliothèque complète",
      ],
      cta: "Essayer gratuitement",
      highlighted: true,
    },
    {
      name: "Agency",
      price: "79€",
      period: "/mois",
      description: "Pour les agences et multi-marques",
      features: [
        "Tout le plan Pro",
        "Multi-marques",
        "Accès API",
        "Support dédié",
      ],
      cta: "Essayer gratuitement",
      highlighted: false,
    },
  ];

  return (
    <section id="tarifs" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Des tarifs simples et transparents
          </h2>
          <p className="mt-4 text-gray-500 text-lg">
            Commencez gratuitement, évoluez quand vous voulez.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 border transition-shadow duration-300 ${
                plan.highlighted
                  ? "border-violet-200 bg-gradient-to-b from-violet-50/80 to-white shadow-xl shadow-violet-500/10 ring-2 ring-violet-200 md:scale-105"
                  : "border-gray-100 bg-white hover:shadow-lg"
              }`}
            >
              {plan.highlighted && plan.badge && (
                <span className="inline-block bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-full mb-4">
                  {plan.badge}
                </span>
              )}
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="text-sm text-gray-400 mt-1">{plan.description}</p>
              <div className="mt-6 mb-8">
                <span className="text-4xl font-extrabold text-gray-900">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-gray-400 ml-1">{plan.period}</span>
                )}
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`block w-full text-center py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  plan.highlighted
                    ? "bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white hover:shadow-lg hover:shadow-violet-500/25"
                    : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── FAQ ─────────────────────── */

function FAQ() {
  const questions = [
    {
      q: "Comment fonctionne kultads ?",
      a: "Collez l'URL de votre boutique en ligne, notre IA analyse votre marque (logo, couleurs, produits, ton) puis génère des publicités professionnelles inspirées des meilleures ads du marché. Le tout en 30 secondes.",
    },
    {
      q: "Quels formats sont disponibles ?",
      a: "Vous pouvez générer des publicités en format carré (1:1, idéal pour le feed Instagram et Facebook) et en format story (9:16, pour les stories et Reels). La conversion carré → story se fait en un clic.",
    },
    {
      q: "Combien de temps faut-il pour générer une pub ?",
      a: "En moyenne, 30 secondes. Collez votre URL, choisissez votre style, et votre publicité est prête.",
    },
    {
      q: "Est-ce que c'est légal d'utiliser ces publicités ?",
      a: "Oui. Les publicités générées sont originales et créées spécifiquement pour votre marque. Vous en êtes le propriétaire et pouvez les utiliser librement sur vos canaux marketing.",
    },
    {
      q: "Puis-je modifier une pub après génération ?",
      a: "Absolument. Notre fonction de modification intelligente vous permet de donner des instructions en texte libre (par exemple \"change le fond en rouge\" ou \"ajoute un badge -30%\") et l'IA applique les changements.",
    },
    {
      q: "Qu'est-ce que le cadeau quotidien ?",
      a: "Les abonnés Pro et Agency reçoivent chaque jour une publicité générée automatiquement par notre IA, adaptée à leur marque. C'est un bonus offert sans action de votre part.",
    },
  ];

  return (
    <section className="py-24 px-6 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Questions fréquentes
          </h2>
        </div>

        <div className="space-y-3">
          {questions.map((item) => (
            <details
              key={item.q}
              className="group bg-white rounded-2xl border border-gray-100 overflow-hidden"
            >
              <summary className="flex items-center justify-between px-6 py-5 cursor-pointer text-gray-900 font-medium text-sm md:text-base list-none [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform duration-200 flex-shrink-0 ml-4" />
              </summary>
              <div className="px-6 pb-5 text-gray-500 text-sm leading-relaxed">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── FINAL CTA ─────────────────────── */

function FinalCTA() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 rounded-3xl p-12 md:p-20 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
            Prêt à créer votre première publicité ?
          </h2>
          <p className="mt-5 text-lg text-white/70 max-w-xl mx-auto">
            Votre première pub est offerte. Sans carte bancaire.
          </p>
          <div className="mt-10">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-white text-violet-600 font-bold px-8 py-4 rounded-2xl text-lg hover:shadow-xl hover:shadow-black/10 transition-all duration-200 hover:scale-[1.02]"
            >
              Créer ma première pub
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── FOOTER ─────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-gray-100 py-12 px-6 bg-white">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <KultLogoFull />
        <div className="flex items-center gap-8 text-sm text-gray-400">
          <Link href="/cgu" className="hover:text-gray-700 transition-colors">
            CGU
          </Link>
          <a href="mailto:contact@kultads.com" className="hover:text-gray-700 transition-colors">
            Contact
          </a>
          <a href="#fonctionnalites" className="hover:text-gray-700 transition-colors">
            Fonctionnalités
          </a>
        </div>
        <p className="text-sm text-gray-400">
          &copy; 2026 Kultads
        </p>
      </div>
    </footer>
  );
}

/* ─────────────────────── PAGE ─────────────────────── */

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <SocialProofBar />
        <HowItWorks />
        <Features />
        <Comparison />
        <WhyUs />
        <DailyGift />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
