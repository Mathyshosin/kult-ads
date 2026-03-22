import Link from "next/link";
import Image from "next/image";
import { KultLogoFull, KultLogoIcon } from "@/components/kult-logo";
import {
  ArrowRight,
  Check,
  Zap,
  MessageSquare,
  Layers,
  BookOpen,
  ChevronDown,
} from "lucide-react";

/* ─────────────────────── NAVBAR ─────────────────────── */

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-900/5">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" aria-label="Accueil">
          <KultLogoFull />
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="hidden sm:inline text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Connexion
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 px-5 py-2 rounded-xl hover:opacity-90 transition-opacity"
          >
            Commencer gratuitement
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ─────────────────────── HERO ─────────────────────── */

function Hero() {
  return (
    <section className="pt-28 pb-16 md:pt-32 md:pb-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        {/* Copy */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-block text-xs font-medium text-violet-600 bg-violet-50 px-3 py-1 rounded-full mb-6">
            Générateur de publicités par IA
          </span>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight">
            Créez des publicités professionnelles en 30&nbsp;secondes
          </h1>

          <p className="mt-5 text-base md:text-lg text-gray-500 max-w-lg mx-auto leading-relaxed">
            Collez l&apos;URL de votre site. Notre IA analyse votre marque et
            génère des pubs inspirées des meilleures ads du marché.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 text-white font-semibold bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 px-7 py-3.5 text-base rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/20"
            >
              Créer ma première pub — c&apos;est gratuit
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <p className="mt-4 text-xs text-gray-400">
            Sans carte bancaire · Première pub offerte
          </p>
        </div>

        {/* Before/After Slider — THE product demo */}
        <div className="mt-14 md:mt-16 max-w-2xl mx-auto">
          <div className="relative aspect-square overflow-hidden rounded-2xl shadow-2xl shadow-gray-900/10 border border-gray-200">
            {/* Before (Template) */}
            <div className="absolute inset-0">
              <Image
                src="/after.png"
                alt="Template d'inspiration"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 90vw, 672px"
                priority
              />
            </div>

            {/* After (Generated) — animated clip */}
            <div className="absolute inset-0 hero-after-slide">
              <Image
                src="/before.png"
                alt="Publicité générée par kultads"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 90vw, 672px"
                priority
              />
            </div>

            {/* Slider line */}
            <div className="absolute inset-0 flex items-center pointer-events-none hero-slider-line z-20">
              <div className="w-[2px] h-full bg-white/80" />
            </div>

            {/* Labels */}
            <div className="absolute bottom-3 left-3 bg-gray-900/70 backdrop-blur-sm text-white text-[10px] font-semibold tracking-wider uppercase px-3 py-1.5 z-10 rounded-full">
              Template
            </div>
            <div className="absolute bottom-3 right-3 bg-gradient-to-r from-indigo-500 to-violet-500 backdrop-blur-sm text-white text-[10px] font-semibold tracking-wider uppercase px-3 py-1.5 z-10 rounded-full">
              Généré
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-3">
            Template → Votre publicité en 30s
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── HOW IT WORKS ─────────────────────── */

function HowItWorks() {
  const steps = [
    {
      num: "1",
      title: "Collez votre URL",
      desc: "On récupère votre logo, vos produits et vos couleurs automatiquement.",
    },
    {
      num: "2",
      title: "Choisissez un style",
      desc: "Parcourez la bibliothèque d'ads gagnantes ou uploadez votre référence.",
    },
    {
      num: "3",
      title: "Votre pub est prête",
      desc: "30 secondes. Format carré ou story. Modifiable par prompt.",
    },
  ];

  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-14">
          Comment ça marche
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
          {steps.map((step) => (
            <div key={step.num} className="text-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white font-bold text-sm flex items-center justify-center mx-auto mb-4">
                {step.num}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                {step.desc}
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
      icon: Zap,
      title: "4 modes de création",
      desc: "Auto, Bibliothèque, Copy-Ads ou Prompt libre. Chaque mode répond à un workflow différent.",
    },
    {
      icon: MessageSquare,
      title: "Modification par prompt",
      desc: "Écrivez ce que vous voulez changer en français. L'IA applique en temps réel.",
    },
    {
      icon: Layers,
      title: "Carré & Story",
      desc: "Générez en 1:1 pour le feed ou en 9:16 pour les stories. Conversion en un clic.",
    },
    {
      icon: BookOpen,
      title: "Bibliothèque d'ads",
      desc: "Les pubs les plus performantes du marché, mises à jour chaque jour. Du testé, pas du théorique.",
    },
  ];

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-14">
          Tout ce qu&apos;il vous faut
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-10">
          {features.map((f) => (
            <div key={f.title} className="flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                <f.icon className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  {f.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Social proof — single line */}
        <div className="mt-14 text-center">
          <p className="text-sm text-gray-400">
            <span className="font-semibold text-gray-600">500+</span>{" "}
            publicités générées par nos utilisateurs
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── PRICING ─────────────────────── */

function PricingCard({
  name,
  price,
  period,
  subtitle,
  features,
  highlighted,
}: {
  name: string;
  price: string;
  period?: string;
  subtitle: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl p-6 md:p-8 flex flex-col ${
        highlighted
          ? "bg-gray-900 text-white ring-2 ring-violet-500"
          : "bg-white border border-gray-200"
      }`}
    >
      {highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-semibold bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-3 py-1 rounded-full">
          Le plus populaire
        </span>
      )}

      <div className="mb-6">
        <h3
          className={`text-lg font-bold ${highlighted ? "text-white" : "text-gray-900"}`}
        >
          {name}
        </h3>
        <p
          className={`text-sm mt-1 ${highlighted ? "text-white/50" : "text-gray-400"}`}
        >
          {subtitle}
        </p>
      </div>

      <div className="mb-6">
        <span
          className={`text-4xl font-extrabold ${highlighted ? "text-white" : "text-gray-900"}`}
        >
          {price}
        </span>
        {period && (
          <span
            className={`text-sm ml-1 ${highlighted ? "text-white/40" : "text-gray-400"}`}
          >
            {period}
          </span>
        )}
      </div>

      <ul className="space-y-2.5 mb-8 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check
              className={`w-4 h-4 mt-0.5 shrink-0 ${highlighted ? "text-violet-400" : "text-violet-500"}`}
            />
            <span className={highlighted ? "text-white/70" : "text-gray-600"}>
              {f}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href="/signup"
        className={`block text-center text-sm font-semibold py-2.5 rounded-xl transition-all ${
          highlighted
            ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:opacity-90"
            : "border border-gray-200 text-gray-700 hover:bg-gray-50"
        }`}
      >
        Commencer
      </Link>
    </div>
  );
}

function Pricing() {
  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4">
          Tarifs simples, sans surprise
        </h2>
        <p className="text-sm text-gray-400 text-center mb-14 max-w-md mx-auto">
          Commencez gratuitement. Passez Pro quand vous êtes convaincu.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <PricingCard
            name="Starter"
            price="0€"
            subtitle="Pour tester"
            features={[
              "1 pub offerte",
              "Bibliothèque limitée",
              "Format carré uniquement",
            ]}
          />
          <PricingCard
            name="Pro"
            price="29€"
            period="/mois"
            subtitle="Pour les e-commerces ambitieux"
            highlighted
            features={[
              "Créations illimitées",
              "Carré + Story",
              "Modification par prompt",
              "1 pub offerte / jour",
              "Bibliothèque complète",
            ]}
          />
          <PricingCard
            name="Agency"
            price="79€"
            period="/mois"
            subtitle="Multi-marques & agences"
            features={[
              "Tout le plan Pro",
              "Multi-marques",
              "Accès API",
              "Support dédié",
            ]}
          />
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── FAQ ─────────────────────── */

function FAQ() {
  const questions = [
    {
      q: "C'est quoi kultads, en une phrase ?",
      a: "Vous collez l'URL de votre site, notre IA analyse votre marque et génère une publicité professionnelle en 30 secondes, inspirée des meilleures ads du marché.",
    },
    {
      q: "Quels formats sont disponibles ?",
      a: "Carré (1:1) pour le feed Instagram/Facebook et story (9:16) pour les Reels et stories. Conversion de l'un à l'autre en un clic.",
    },
    {
      q: "Je peux modifier une pub après génération ?",
      a: "Oui. Écrivez ce que vous voulez changer en texte libre (« change le fond en rouge », « ajoute un badge -30% ») et l'IA applique.",
    },
    {
      q: "C'est légal ?",
      a: "Les publicités générées sont originales et créées pour votre marque. Vous en êtes propriétaire et pouvez les utiliser librement.",
    },
    {
      q: "Combien de temps pour générer une pub ?",
      a: "30 secondes en moyenne. Collez votre URL, choisissez un style, c'est prêt.",
    },
  ];

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12">
          Questions fréquentes
        </h2>

        <div className="space-y-2">
          {questions.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-gray-200 overflow-hidden"
            >
              <summary className="cursor-pointer flex items-center justify-between p-5 text-sm font-medium text-gray-900 list-none [&::-webkit-details-marker]:hidden hover:bg-gray-50 transition-colors">
                {item.q}
                <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-4 group-open:rotate-180 transition-transform duration-200" />
              </summary>
              <div className="px-5 pb-5 text-sm text-gray-500 leading-relaxed">
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
    <section className="py-20 px-6 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white">
          Prêt à créer votre première pub ?
        </h2>
        <p className="mt-3 text-sm text-white/60">
          Gratuit, sans carte bancaire.
        </p>
        <div className="mt-8">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold px-7 py-3.5 text-base rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
          >
            Créer ma première pub
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── FOOTER ─────────────────────── */

function Footer() {
  return (
    <footer className="py-8 px-6 bg-white border-t border-gray-100">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <KultLogoIcon className="w-7 h-7 opacity-40" />
        <div className="flex items-center gap-6 text-xs text-gray-400">
          <Link href="/cgu" className="hover:text-gray-600 transition-colors">
            CGU
          </Link>
          <a
            href="mailto:contact@kultads.com"
            className="hover:text-gray-600 transition-colors"
          >
            Contact
          </a>
        </div>
        <p className="text-xs text-gray-300">© 2026 kultads</p>
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
        <HowItWorks />
        <Features />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
