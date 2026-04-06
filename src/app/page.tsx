import Link from "next/link";
import Image from "next/image";
import { KultadsLogoFull, KultadsLogoIcon } from "@/components/adly-logo";
import LiveTemplateCarousel from "@/components/live-template-carousel";
import LiveCounter from "@/components/live-counter";
import LandingNavbar from "@/components/landing-navbar";
import AnimatedCounter30 from "@/components/animated-counter-30";
import {
  Zap,
  Globe,
  Check,
  ArrowRight,
  ChevronDown,
  BarChart3,
  Star,
  RefreshCw,
  Clock,
  Layers,
} from "lucide-react";

/* ─────────────────────── HERO ─────────────────────── */

function Hero({ adsCount }: { adsCount: number }) {
  return (
    <section className="pt-52 pb-20 px-6 bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-dots opacity-40 pointer-events-none" />

      <div className="max-w-5xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-full px-4 py-1.5 mb-6 animate-fade-in">
          <span className="text-sm font-semibold text-violet-700">Outil n°1 en France pour créer des publicités par IA</span>
        </div>
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-[1.1] tracking-tight animate-fade-in-up">
          Doublez vos ventes avec des pubs{" "}
          <span className="text-violet-600">
            prêtes en <AnimatedCounter30 />
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          Fini les heures sur Canva et les freelances à 500€/mois.
          Collez votre URL, choisissez un style, lancez vos campagnes.
        </p>

        <div className="mt-6 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
          <LiveCounter initialCount={adsCount} />
        </div>

        <div className="mt-10 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 bg-violet-600 text-white font-semibold px-8 py-4 rounded-2xl text-base sm:text-lg hover:bg-violet-700 hover:shadow-xl hover:shadow-violet-500/25 transition-all duration-300 hover:scale-[1.02]"
          >
            <span>Essayer gratuitement</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <p className="mt-5 text-sm text-gray-400 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          1 pub offerte &middot; Résultat en 30 secondes
        </p>

        {/* Before/After */}
        <div className="mt-16 max-w-sm sm:max-w-lg mx-auto animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-gray-300/30 border border-gray-100">
            <div className="relative aspect-square hero-ba-container">
              <div className="absolute inset-0">
                <Image src="/template-before.png" alt="Template d'inspiration" fill className="object-cover" sizes="500px" />
              </div>
              <div className="absolute inset-0 hero-after-slide overflow-hidden">
                <Image src="/template-after.png" alt="Publicité générée par Klonr." fill className="object-cover" sizes="500px" />
              </div>
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-md px-2.5 py-1 text-[10px] font-bold text-white z-30 hero-label-before">
                Avant
              </div>
              <div className="absolute top-3 right-3 bg-violet-600/90 backdrop-blur-sm rounded-md px-2.5 py-1 text-[10px] font-bold text-white z-30 hero-label-after">
                Après
              </div>
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

/* ─────────────────────── HOW IT WORKS ─────────────────────── */

function StepUrlAnimation() {
  return (
    <div className="bg-gray-900 rounded-xl p-4 overflow-hidden h-[280px]">
      <div className="flex items-center gap-1.5 mb-3">
        <div className="w-2 h-2 rounded-full bg-red-400" />
        <div className="w-2 h-2 rounded-full bg-yellow-400" />
        <div className="w-2 h-2 rounded-full bg-green-400" />
      </div>
      <div className="bg-gray-800 rounded-lg px-3 py-2 flex items-center gap-2 mb-3">
        <Globe className="w-3 h-3 text-gray-500 flex-shrink-0" />
        <div className="text-[11px] text-violet-400 font-mono step-url-typing">
          www.votre-boutique.com
        </div>
      </div>
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
  return (
    <div className="h-[280px] flex items-center justify-center bg-gray-50 rounded-xl">
      <LiveTemplateCarousel />
    </div>
  );
}

function StepGenerateAnimation() {
  return (
    <div className="rounded-xl h-[280px] relative">
      <div className="absolute inset-0 rounded-xl overflow-hidden bg-gray-100">
        {/* Before */}
        <Image src="/template-before.png" alt="Template original" fill className="object-contain" sizes="400px" />
        {/* Cooking animation overlay */}
        <div className="absolute inset-0 step-cooking-overlay bg-violet-600/90 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs font-bold text-white/80">Génération...</span>
          </div>
        </div>
        {/* After */}
        <div className="absolute inset-0 step-generate-reveal z-20">
          <Image src="/template-after.png" alt="Ad générée" fill className="object-contain" sizes="400px" />
        </div>
      </div>
      <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5 z-30">
        <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-violet-600 step-zap-pulse" />
          <span className="text-[10px] font-medium text-gray-600">~30 secondes</span>
        </div>
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
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-violet-600 text-white text-sm font-bold mb-5 shadow-lg shadow-violet-500/20">
                {step.number}
              </div>
              <div className="mb-5">
                {step.demo}
              </div>
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

/* ─────────────────────── COMPARISON ─────────────────────── */

function Comparison() {
  return (
    <section className="py-24 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Vous avez déjà testé ChatGPT pour vos pubs.
          </h2>
          <p className="mt-4 text-gray-500 text-lg max-w-2xl mx-auto">
            Résultat : des visuels génériques qui ne vendent pas. Votre audience scroll sans s&apos;arrêter.
            La différence ? Un outil pensé pour vendre, pas pour &quot;faire joli&quot;.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {/* ChatGPT / Midjourney */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-gray-900 font-semibold text-sm">ChatGPT / Midjourney</span>
            </div>
            <div className="space-y-3.5">
              {[
                "Ne connaît pas le marketing e-commerce",
                "Vos produits ne sont jamais intégrés",
                "Des heures à rédiger le bon prompt",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-400 text-[10px] font-bold">✕</span>
                  </div>
                  <span className="text-gray-500 text-[13px]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Klonr. — highlighted center */}
          <div className="relative bg-violet-600 rounded-2xl p-6 shadow-2xl shadow-violet-500/25 md:-mt-4 md:mb-[-16px]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-[10px] font-bold uppercase tracking-wider text-gray-900 px-4 py-1 rounded-full shadow-lg whitespace-nowrap">
              Outil n°1 pour le e-commerce
            </div>
            <div className="flex items-center gap-3 mb-6 mt-2">
              <KultadsLogoIcon className="w-10 h-10" />
              <span className="text-white font-bold text-lg">Klonr.</span>
            </div>
            <div className="space-y-3.5">
              {[
                "Entraîné sur 1 000+ ads qui convertissent",
                "Intègre automatiquement vos produits",
                "Clone les pubs des leaders de votre marché",
                "Retouche en une phrase, sans Photoshop",
                "Carré + Story en un clic",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
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

          {/* Concurrents */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-gray-400" />
              </div>
              <span className="text-gray-900 font-semibold text-sm">AdCreative, Pencil...</span>
            </div>
            <div className="space-y-3.5">
              {[
                "Templates génériques, pas de vraies ads",
                "Impossible de copier une ad concurrente",
                "Abonnements à 49-149$/mois minimum",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-400 text-[10px] font-bold">✕</span>
                  </div>
                  <span className="text-gray-500 text-[13px]">{item}</span>
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
    <section className="py-24 px-6 bg-violet-50/50 relative overflow-hidden">
      <div className="max-w-5xl mx-auto relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5">
            Pas juste un outil.<br />
            <span className="text-violet-600">Une expertise.</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
            {"Derrière Klonr., une agence qui a créé des milliers de publicités e-commerce. Notre IA ne génère pas au hasard — elle reproduit ce qui fait vraiment vendre."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white border border-gray-100 rounded-2xl p-7 hover:shadow-lg transition-all duration-500">
            <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center mb-4">
              <RefreshCw className="w-5 h-5 text-violet-600" />
            </div>
            <h3 className="text-gray-900 font-semibold text-base mb-2">{"Entraînée chaque jour"}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              {"Chaque jour, nous alimentons la base avec de nouvelles ads qui performent sur Meta, TikTok et Google. Pas des templates Canva."}
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-7 hover:shadow-lg transition-all duration-500">
            <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5 text-violet-600" />
            </div>
            <h3 className="text-gray-900 font-semibold text-base mb-2">{"Uniquement des ads qui convertissent"}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              {"Chaque template est une publicité qui a généré du chiffre. On sélectionne uniquement les ads avec un ROAS prouvé."}
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-7 hover:shadow-lg transition-all duration-500">
            <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 text-violet-600" />
            </div>
            <h3 className="text-gray-900 font-semibold text-base mb-2">{"30 secondes au lieu de 2 jours"}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              {"Notre équipe valide chaque ad de la bibliothèque. Vous obtenez la qualité d'une agence à la vitesse de l'IA."}
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-7 hover:shadow-lg transition-all duration-500">
            <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center mb-4">
              <Layers className="w-5 h-5 text-violet-600" />
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
          <p className="text-violet-600 text-xs font-semibold mt-2">{"L'équipe Klonr."}</p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── PRICING ─────────────────────── */

function Pricing() {
  const plans = [
    {
      name: "Gratuit",
      price: "0€",
      period: "",
      description: "Testez Klonr. gratuitement sur votre marque",
      badge: "Essai gratuit",
      features: [
        "2 crédits offerts (2 publicités)",
        "Tous les formats (carré + story)",
        "Accès à la bibliothèque complète",
        "Retouche IA incluse",
        "Sans carte bancaire",
      ],
      cta: "Essayer gratuitement",
      highlighted: false,
      planId: "free",
    },
    {
      name: "Pro",
      price: "39€",
      period: "/mois",
      description: "Pour les e-commerçants qui veulent scaler leurs campagnes",
      badge: "Le plus populaire",
      features: [
        "2 000 crédits / mois (200 publicités)",
        "Tous les formats (carré + story)",
        "Retouche IA illimitée",
        "Bibliothèque complète",
        "Copy-ads illimité",
        "Support prioritaire",
      ],
      cta: "Choisir le Pro",
      highlighted: true,
      planId: "pro",
    },
    {
      name: "Agency",
      price: "79€",
      period: "/mois",
      description: "Pour les agences et les e-commerces à fort volume",
      badge: "BEST ROI",
      features: [
        "5 000 crédits / mois (500 publicités)",
        "Tout le plan Pro inclus",
        "Multi-marques",
        "Support dédié",
        "Accès API (bientôt)",
      ],
      cta: "Choisir Agency",
      highlighted: false,
      planId: "agency",
    },
  ];

  return (
    <section id="tarifs" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Moins cher qu&apos;un freelance. Plus rapide qu&apos;une agence.
          </h2>
          <p className="mt-4 text-gray-500 text-lg">
            2 pubs offertes pour tester. Sans engagement. Sans carte bancaire.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 border transition-shadow duration-300 ${
                plan.highlighted
                  ? "border-violet-200 bg-violet-50/50 shadow-xl shadow-violet-500/10 ring-2 ring-violet-200 md:scale-105"
                  : "border-gray-100 bg-white hover:shadow-lg"
              }`}
            >
              {plan.badge && (
                <span className={`inline-block text-xs font-bold px-3.5 py-1.5 rounded-full mb-4 ${
                  plan.highlighted
                    ? "bg-violet-600 text-white"
                    : plan.name === "Agency"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-blue-100 text-blue-700"
                }`}>
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
                    <Check className="w-4 h-4 text-violet-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={`/signup?plan=${plan.planId}`}
                className={`block w-full text-center py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  plan.highlighted
                    ? "bg-violet-600 text-white hover:bg-violet-700 hover:shadow-lg"
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

/* ─────────────────────── TESTIMONIALS ─────────────────────── */

function Testimonials() {
  const reviews = [
    {
      name: "Sarah M.",
      role: "Fondatrice, Skincare Brand",
      text: "On a remplacé notre freelance à 800€/mois par Klonr. Les résultats sont bluffants, surtout en copy-ads. On génère nos visuels en 2 minutes chrono.",
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
      text: "On utilise Klonr. pour nos clients qui n'ont pas le budget pour un DA. Le rapport qualité/prix est imbattable. La modification par prompt est un game-changer.",
      stars: 4,
      metric: "15 clients équipés",
    },
  ];

  return (
    <section className="py-24 px-5 bg-white">
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
              className="relative bg-white rounded-2xl border border-gray-100 p-7 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="absolute top-6 right-6">
                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full border border-green-100">
                  ↑ {review.metric}
                </span>
              </div>
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }, (_, j) => (
                  <svg key={j} className={`w-4 h-4 ${j < review.stars ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 leading-relaxed mb-6 text-[15px]">
                &ldquo;{review.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm">
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
      q: "Comment fonctionne Klonr. ?",
      a: "Collez l'URL de votre boutique en ligne, notre IA analyse votre marque (logo, couleurs, produits, ton) puis génère des publicités professionnelles inspirées des meilleures ads du marché. Le tout en 30 secondes.",
    },
    {
      q: "Quels formats sont disponibles ?",
      a: "Format carré (1:1, pour le feed Instagram et Facebook) et format story (9:16, pour les stories et Reels). La conversion carré → story se fait en un clic.",
    },
    {
      q: "Est-ce que c'est légal ?",
      a: "Oui. Les publicités générées sont originales et créées spécifiquement pour votre marque. Vous en êtes le propriétaire et pouvez les utiliser librement sur vos canaux marketing.",
    },
    {
      q: "Puis-je modifier une pub après génération ?",
      a: "Absolument. Donnez une instruction en texte libre (\"change le fond en rouge\", \"ajoute un badge -30%\") et l'IA applique les changements.",
    },
    {
      q: "Quelle différence avec ChatGPT ou Midjourney ?",
      a: "ChatGPT génère des images génériques sans connaître le marketing e-commerce. Klonr. est entraîné sur des milliers d'ads qui ont fait leurs preuves et intègre automatiquement vos produits.",
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
    <section className="bg-violet-600 py-20 md:py-28 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-4">
          Vos concurrents utilisent déjà l&apos;IA.<br className="hidden md:block" />
          Et vous ?
        </h2>
        <p className="text-lg text-white/70 max-w-xl mx-auto mb-10">
          Lancez votre première campagne gagnante en 5 minutes.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 bg-white text-violet-700 font-bold px-10 py-4 rounded-2xl text-lg hover:shadow-xl hover:shadow-black/10 transition-all duration-200 hover:scale-[1.02]"
        >
          Essayer gratuitement
          <ArrowRight className="w-5 h-5" />
        </Link>
        <p className="mt-5 text-sm text-white/50">
          Testez Klonr. sur votre marque &middot; Résultat immédiat
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────── FOOTER ─────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-gray-100 py-12 px-6 bg-white">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <KultadsLogoFull />
        <div className="flex items-center gap-8 text-sm text-gray-400">
          <Link href="/changelog" className="hover:text-gray-700 transition-colors">
            Changelog
          </Link>
          <Link href="/cgu" className="hover:text-gray-700 transition-colors">
            CGU
          </Link>
          <a href="mailto:contact@kult-agency.com" className="hover:text-gray-700 transition-colors">
            Contact
          </a>
        </div>
        <p className="text-sm text-gray-400">
          &copy; 2026 Klonr.
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
    // Race with 5s timeout to avoid build failures
    const result = await Promise.race([
      supabase.from("generated_ads").select("*", { count: "exact", head: true }),
      new Promise<{ count: null }>((resolve) => setTimeout(() => resolve({ count: null }), 5000)),
    ]);
    return (result as { count: number | null }).count || 100;
  } catch {
    return 100;
  }
}

export default async function Home() {
  const adsCount = await getAdsCount();
  return (
    <>
      <LandingNavbar />
      <main>
        <Hero adsCount={adsCount} />
        <HowItWorks />
        <Comparison />
        <Pricing />
        <WhyUs />
        <Testimonials />
        <FAQ />
        <FinalCTA />
        <div className="py-8 text-center">
          <Link
            href="/changelog"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-violet-600 transition-colors"
          >
            <Clock className="w-4 h-4" />
            Voir toutes les mises à jour
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
