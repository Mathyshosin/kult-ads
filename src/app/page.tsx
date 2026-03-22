import Link from "next/link";
import Image from "next/image";
import { KultLogoFull } from "@/components/kult-logo";
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
                <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm rounded-md px-2.5 py-1 text-[10px] font-bold text-white z-10">
                  Avant
                </div>
              </div>

              {/* After (Generated — HelloBoku) */}
              <div className="absolute inset-0 hero-after-slide">
                <Image src="/after.png" alt="Publicité générée par kultads" fill className="object-cover" sizes="500px" />
                <div className="absolute top-3 right-3 bg-violet-500/80 backdrop-blur-sm rounded-md px-2.5 py-1 text-[10px] font-bold text-white z-10">
                  Après
                </div>
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

function HowItWorks() {
  const steps = [
    {
      number: "1",
      icon: Globe,
      title: "Analysez votre marque",
      description:
        "Collez l'URL de votre site. Notre IA récupère automatiquement votre logo, vos produits, vos couleurs et votre ton de marque.",
    },
    {
      number: "2",
      icon: Library,
      title: "Choisissez votre style",
      description:
        "Parcourez notre bibliothèque d'ads gagnantes pour trouver l'inspiration, ou uploadez votre propre référence.",
    },
    {
      number: "3",
      icon: MousePointerClick,
      title: "Générez en 1 clic",
      description:
        "L'IA crée une publicité professionnelle adaptée à votre marque en 30 secondes. Prête à publier.",
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
              {/* Step number */}
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500 text-white text-xl font-bold mb-6 shadow-lg shadow-violet-500/20 group-hover:shadow-xl group-hover:shadow-violet-500/30 transition-shadow duration-300">
                {step.number}
              </div>
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <step.icon className="w-8 h-8 text-violet-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {step.title}
              </h3>
              <p className="text-gray-500 leading-relaxed">
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
      icon: Layers,
      title: "4 modes de création",
      description:
        "Auto, Bibliothèque, Copy-Ads ou Prompt personnalisé. Choisissez le mode qui correspond à votre workflow.",
    },
    {
      icon: PenTool,
      title: "Modification intelligente",
      description:
        "Modifiez vos publicités générées avec de simples instructions textuelles. L'IA comprend vos demandes.",
    },
    {
      icon: RectangleHorizontal,
      title: "Format Carré & Story",
      description:
        "Générez en carré et en story. Convertissez du carré au story en un seul clic.",
    },
    {
      icon: Library,
      title: "Bibliothèque d'ads gagnantes",
      description:
        "Une collection de publicités top-performers mise à jour chaque jour pour vous inspirer.",
    },
  ];

  return (
    <section id="fonctionnalites" className="py-24 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Tout ce dont vous avez besoin
          </h2>
          <p className="mt-4 text-gray-500 text-lg max-w-xl mx-auto">
            Des outils puissants pour créer des ads qui performent.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white p-8 rounded-2xl border border-gray-100 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center mb-5 group-hover:from-indigo-100 group-hover:to-violet-100 transition-colors duration-300">
                <feature.icon className="w-6 h-6 text-violet-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-500 leading-relaxed text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* BeforeAfter section removed — real images now in Hero */

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
        <DailyGift />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
