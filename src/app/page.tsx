import Link from "next/link";
import Image from "next/image";
import { KultLogoFull, KultLogoIcon } from "@/components/kult-logo";
import LiveTemplateCarousel from "@/components/live-template-carousel";
import LiveCounter from "@/components/live-counter";
import LandingNavbar from "@/components/landing-navbar";
import AnimatedCounter30 from "@/components/animated-counter-30";
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
  return <LandingNavbar />;
}

/* ─────────────────────── HERO ─────────────────────── */

function Hero({ adsCount }: { adsCount: number }) {
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
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-[1.1] tracking-tight animate-fade-in-up">
          Doublez vos ventes avec des pubs{" "}
          <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent">
            prêtes en <AnimatedCounter30 />
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          Fini les heures sur Canva et les freelances à 500€/mois.
          Collez votre URL, choisissez un style, lancez vos campagnes.
        </p>

        {/* Live counter */}
        <div className="mt-6 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
          <LiveCounter initialCount={adsCount} />
        </div>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <Link
            href="/signup"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white font-semibold px-8 py-4 rounded-2xl text-base sm:text-lg hover:shadow-xl hover:shadow-violet-500/25 transition-all duration-300 hover:scale-[1.02] w-full sm:w-auto"
          >
            <span>Essayer gratuitement</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#comment-ca-marche"
            className="flex items-center justify-center gap-2 text-gray-500 hover:text-gray-900 font-medium px-6 py-4 rounded-2xl border border-gray-200 hover:border-gray-300 transition-all duration-200 w-full sm:w-auto"
          >
            <ChevronDown className="w-4 h-4" />
            Voir comment ça marche
          </a>
        </div>

        {/* Trust line */}
        <p className="mt-5 text-sm text-gray-400 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          Sans carte bancaire &middot; 1 pub offerte &middot; Résultat en 30 secondes
        </p>

        {/* Before/After Mockup in Hero — real images */}
        <div className="mt-16 max-w-sm sm:max-w-lg mx-auto animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-violet-500/10 border border-gray-100">
            <div className="relative aspect-square hero-ba-container">
              {/* Before (Template — Decorté) */}
              <div className="absolute inset-0">
                <Image src="/template-before.png" alt="Template d'inspiration" fill className="object-cover" sizes="500px" />
              </div>

              {/* After (Generated — HelloBoku) */}
              <div className="absolute inset-0 hero-after-slide overflow-hidden">
                <Image src="/template-after.png" alt="Publicité générée par kultads" fill className="object-cover" sizes="500px" />
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
          <Image src="/template-before.png" alt="Template original" fill className="object-cover" sizes="300px" />
        </div>
        {/* After — real generated ad */}
        <div className="absolute inset-0 step-generate-reveal">
          <Image src="/template-after.png" alt="Ad générée" fill className="object-cover" sizes="300px" />
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
      title: "Collez votre URL",
      description: "Notre IA scanne votre site, vos produits, vos couleurs. Zéro configuration.",
      demo: <StepUrlAnimation />,
    },
    {
      number: "2",
      title: "Choisissez une ad qui cartonne",
      description: "Parcourez des centaines d'ads performantes ou uploadez la vôtre.",
      demo: <StepTemplateAnimation />,
    },
    {
      number: "3",
      title: "Lancez vos campagnes",
      description: "Votre pub est prête. Téléchargez-la et lancez-la sur Meta, Google, TikTok.",
      demo: <StepGenerateAnimation />,
    },
  ];

  return (
    <section id="comment-ca-marche" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            3 étapes. 30 secondes. C&apos;est tout.
          </h2>
          <p className="mt-4 text-gray-500 text-lg max-w-xl mx-auto">
            Pas besoin d&apos;être designer. Pas besoin de brief créatif.
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
        "Laissez l'IA choisir, copiez une ad qui cartonne, parcourez la bibliothèque ou décrivez exactement ce que vous voulez.",
      icon: Layers,
    },
    {
      title: "Retouchez en une phrase",
      description:
        "\"Retire le texte en bas\" — l'IA comprend et modifie. Pas besoin de Photoshop.",
      icon: PenTool,
    },
    {
      title: "Carré, Story, Feed — tout y est",
      description:
        "Générez dans tous les formats. Convertissez du carré au story en un clic. Prêt pour Meta, TikTok, Google.",
      icon: RectangleHorizontal,
    },
    {
      title: "Des centaines d'ads qui marchent",
      description:
        "Notre équipe alimente la bibliothèque chaque jour avec des ads qui génèrent vraiment du CA.",
      icon: Library,
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
            Tout est inclus. Zéro compétence requise.
          </h2>
          <p className="mt-4 text-gray-500 text-lg max-w-xl mx-auto">
            Vous gérez votre boutique. On s&apos;occupe de vos pubs.
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
                    <feature.icon className="w-5 h-5 text-gray-700" />
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
            Vous avez déjà essayé. Ça n&apos;a pas marché.
          </h2>
          <p className="mt-4 text-gray-500 text-lg max-w-2xl mx-auto">
            ChatGPT ne sait pas vendre. Les agences coûtent une fortune. On a créé la 3ème option.
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
    <section className="py-24 px-6 bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 relative overflow-hidden">
      <div className="max-w-5xl mx-auto relative">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white border border-violet-200 rounded-full px-4 py-1.5 text-xs font-medium text-violet-600 mb-5 shadow-sm">
            <Star className="w-3.5 h-3.5" />
            Notre ADN
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5">
            Pas juste un outil.<br />
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Une expertise.
            </span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
            {"Derrière kultads, une agence qui a créé des milliers de publicités e-commerce. Notre IA ne génère pas au hasard — elle reproduit ce qui fait vraiment vendre."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white/80 backdrop-blur-sm border border-white rounded-2xl p-7 hover:shadow-lg hover:shadow-violet-100 transition-all duration-500">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center mb-4">
              <RefreshCw className="w-5 h-5 text-violet-600" />
            </div>
            <h3 className="text-gray-900 font-semibold text-base mb-2">{"Entraînée chaque jour"}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              {"Chaque jour, nous alimentons la base avec de nouvelles ads qui performent sur Meta, TikTok et Google. Pas des templates Canva."}
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-white rounded-2xl p-7 hover:shadow-lg hover:shadow-violet-100 transition-all duration-500">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-gray-900 font-semibold text-base mb-2">{"Uniquement des ads qui convertissent"}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              {"Chaque template est une publicité qui a généré du chiffre. On sélectionne uniquement les ads avec un ROAS prouvé."}
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-white rounded-2xl p-7 hover:shadow-lg hover:shadow-violet-100 transition-all duration-500">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-gray-900 font-semibold text-base mb-2">{"30 secondes au lieu de 2 jours"}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              {"Notre équipe valide chaque ad de la bibliothèque. Vous obtenez la qualité d'une agence à la vitesse de l'IA."}
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-white rounded-2xl p-7 hover:shadow-lg hover:shadow-violet-100 transition-all duration-500">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mb-4">
              <Layers className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-gray-900 font-semibold text-base mb-2">{"+1 000 ads, un cercle vertueux"}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              {"Plus la bibliothèque grandit, plus l'IA est précise. Plus elle est précise, plus vos ads performent."}
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm italic max-w-lg mx-auto">
            {"\u00AB On a créé l'outil qu'on aurait rêvé d'avoir quand on faisait 200 ads par mois pour nos clients. \u00BB"}
          </p>
          <p className="text-violet-600 text-xs font-semibold mt-2">{"L'équipe kultads"}</p>
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
      price: "5€",
      period: "",
      description: "Pour tester la puissance de l'outil",
      features: [
        "5 crédits de génération",
        "Tous les formats (carré + story)",
        "Accès à la bibliothèque complète",
        "Retouche IA incluse",
        "Paiement unique, pas d'abonnement",
      ],
      cta: "Commencer pour 5€",
      highlighted: false,
      planId: "starter",
    },
    {
      name: "Pro",
      price: "29€",
      period: "/mois",
      description: "Pour les e-commerçants qui veulent scaler",
      badge: "Le plus populaire",
      features: [
        "500 crédits / mois",
        "Tous les formats (carré + story)",
        "Retouche IA illimitée",
        "1 pub offerte chaque jour",
        "Bibliothèque complète",
        "Copy-ads illimité",
      ],
      cta: "Choisir le Pro",
      highlighted: true,
      planId: "pro",
    },
    {
      name: "Agency",
      price: "79€",
      period: "/mois",
      description: "Pour les agences et les gros volumes",
      features: [
        "2 000 crédits / mois",
        "Tout le plan Pro inclus",
        "Multi-marques",
        "Support prioritaire",
        "Accès API (bientôt)",
      ],
      cta: "Choisir Agency",
      highlighted: false,
      planId: "agency",
    },
  ];

  const packs = [
    { name: "Boost", credits: 50, price: "4,90€", packId: "boost" },
    { name: "Growth", credits: 130, price: "9,90€", packId: "growth" },
    { name: "Scale", credits: 300, price: "19,90€", packId: "scale" },
  ];

  return (
    <section id="tarifs" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Moins cher qu&apos;un freelance. Plus rapide qu&apos;une agence.
          </h2>
          <p className="mt-4 text-gray-500 text-lg">
            Commencez dès 5€. Sans engagement. Sans carte bancaire pour tester.
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
                href={`/signup?plan=${plan.planId}`}
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

/* ─────────────────────── Testimonials ─────────────────────── */

function Testimonials() {
  const reviews = [
    {
      name: "Sarah M.",
      role: "Fondatrice, Skincare Brand",
      text: "On a remplacé notre freelance à 800€/mois par Kultads. Les résultats sont bluffants, surtout en copy-ads. On génère nos visuels en 2 minutes chrono.",
      stars: 5,
      metric: "ROAS x2.3",
    },
    {
      name: "Thomas L.",
      role: "E-commerce Manager",
      text: "L'outil est devenu indispensable. La bibliothèque de templates est une mine d'or. Je teste 20 créas par semaine maintenant contre 3 avant.",
      stars: 5,
      metric: "20 créas/semaine",
    },
    {
      name: "Julie D.",
      role: "Dropshippeuse",
      text: "Franchement sceptique au début. Mais la qualité des ads générées m'a surprise. Le mode copy-ads est génial pour s'inspirer de ce qui marche déjà.",
      stars: 5,
      metric: "CPA divisé par 2",
    },
    {
      name: "Marc R.",
      role: "CEO, Agence Digitale",
      text: "On utilise Kultads pour nos clients qui n'ont pas le budget pour un DA. Le rapport qualité/prix est imbattable. La modification par prompt est un game-changer.",
      stars: 4,
      metric: "15 clients équipés",
    },
  ];

  return (
    <section className="py-24 px-5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 mb-4">
            <span className="text-amber-600 text-sm">★★★★★</span>
            <span className="text-sm font-medium text-amber-700">4.9/5 de satisfaction</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Ils créent des ads qui performent
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Découvrez pourquoi des centaines de e-commerçants nous font confiance.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {reviews.map((review, i) => (
            <div
              key={i}
              className="relative bg-white rounded-2xl border border-gray-100 p-7 hover:shadow-lg transition-shadow duration-300 group"
            >
              {/* Metric badge */}
              <div className="absolute top-6 right-6">
                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full border border-green-100">
                  ↑ {review.metric}
                </span>
              </div>

              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }, (_, j) => (
                  <svg key={j} className={`w-4 h-4 ${j < review.stars ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-600 leading-relaxed mb-6 text-[15px]">
                &ldquo;{review.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                  {review.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{review.name}</p>
                  <p className="text-gray-400 text-xs">{review.role}</p>
                </div>
              </div>
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
            Vos concurrents lancent déjà leurs pubs.<br className="hidden md:block" />
            Et vous ?
          </h2>
          <p className="mt-5 text-lg text-white/70 max-w-xl mx-auto">
            30 secondes pour créer votre première pub. Gratuitement. Sans carte bancaire.
          </p>
          <div className="mt-10">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-white text-violet-600 font-bold px-8 py-4 rounded-2xl text-lg hover:shadow-xl hover:shadow-black/10 transition-all duration-200 hover:scale-[1.02]"
            >
              Essayer maintenant
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

async function getAdsCount(): Promise<number> {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { count } = await supabase
      .from("generated_ads")
      .select("*", { count: "exact", head: true });
    return count || 0;
  } catch {
    return 0;
  }
}

export default async function Home() {
  const adsCount = await getAdsCount();
  return (
    <>
      <Navbar />
      <main>
        <Hero adsCount={adsCount} />
        <SocialProofBar />
        <HowItWorks />
        <Features />
        <Comparison />
        <DailyGift />
        <Pricing />
        <WhyUs />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
