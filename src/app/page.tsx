import Link from "next/link";
import Image from "next/image";
import { KultLogoFull, KultLogoIcon } from "@/components/kult-logo";
import {
  ArrowRight,
  Check,
  X,
  Search,
  ShoppingBag,
  Sparkles,
  ChevronDown,
  Star,
  Quote,
  RectangleHorizontal,
  Smartphone,
} from "lucide-react";

/* ─────────────────────── NAVBAR ─────────────────────── */

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-900/5">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
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
    <section className="pt-28 pb-16 md:pt-36 md:pb-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-[1.1] tracking-tight">
            Transformez n&apos;importe quelle pub gagnante en{" "}
            <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent">
              machine à cash
            </span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-gray-500 max-w-xl mx-auto leading-relaxed">
            Choisissez une pub qui cartonne, ajoutez votre produit, et
            l&apos;IA génère votre version en 30&nbsp;secondes.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 text-white font-semibold bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 px-8 py-4 text-base rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/25"
            >
              Générer ma première pub
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <p className="mt-4 text-sm text-gray-400">
            À partir de 0€ · Sans abonnement obligatoire
          </p>
        </div>

        {/* Before/After Slider */}
        <div className="mt-16 md:mt-20 max-w-2xl mx-auto">
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

          <p className="text-center text-xs text-gray-400 mt-4">
            Template → Votre publicité en 30s
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── 3-STEP PROCESS ─────────────────────── */

function HowItWorks() {
  const steps = [
    {
      num: "1",
      icon: Search,
      title: "Choisissez une pub qui cartonne",
      desc: "Parcourez notre bibliothèque d'ads gagnantes ou uploadez la vôtre comme référence.",
    },
    {
      num: "2",
      icon: ShoppingBag,
      title: "Ajoutez vos produits",
      desc: "Collez l'URL de votre site — on récupère tout automatiquement : logo, couleurs, produits.",
    },
    {
      num: "3",
      icon: Sparkles,
      title: "Générez votre version",
      desc: "L'IA adapte la pub à votre marque en 30 secondes. Modifiez par prompt si besoin.",
    },
  ];

  return (
    <section className="py-20 md:py-28 px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4">
          3 étapes, 30 secondes
        </h2>
        <p className="text-gray-500 text-center mb-16 max-w-md mx-auto">
          Pas de brief créatif. Pas de designer. Juste vous et une URL.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14">
          {steps.map((step) => (
            <div key={step.num} className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center mx-auto mb-5 shadow-lg shadow-violet-500/20">
                <step.icon className="w-6 h-6" />
              </div>
              <div className="inline-block text-xs font-bold text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-full mb-3">
                Étape {step.num}
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

/* ─────────────────────── FORMAT SHOWCASE ─────────────────────── */

function FormatShowcase() {
  return (
    <section className="py-20 md:py-28 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4">
          Tous les formats dont vous avez besoin
        </h2>
        <p className="text-gray-500 text-center mb-16 max-w-md mx-auto">
          Générez directement au bon format. Conversion en un clic.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-10 md:gap-16">
          {/* 1:1 Square */}
          <div className="text-center">
            <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 border-2 border-gray-200 flex items-center justify-center mx-auto mb-4 relative overflow-hidden">
              <RectangleHorizontal className="w-12 h-12 text-gray-300" />
              <div className="absolute top-2 right-2 bg-violet-100 text-violet-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                1:1
              </div>
            </div>
            <h3 className="text-base font-semibold text-gray-900">Carré</h3>
            <p className="text-sm text-gray-400 mt-1">Feed Instagram & Facebook</p>
          </div>

          {/* 9:16 Story */}
          <div className="text-center">
            <div className="w-32 h-56 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 border-2 border-gray-200 flex items-center justify-center mx-auto mb-4 relative overflow-hidden">
              <Smartphone className="w-10 h-10 text-gray-300" />
              <div className="absolute top-2 right-2 bg-violet-100 text-violet-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                9:16
              </div>
            </div>
            <h3 className="text-base font-semibold text-gray-900">Story</h3>
            <p className="text-sm text-gray-400 mt-1">Reels, Stories & TikTok</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── COMPARISON ─────────────────────── */

function Comparison() {
  const chatgptItems = [
    "Résultats génériques sans identité de marque",
    "Pas de bibliothèque d'ads gagnantes",
    "Prompts complexes à écrire",
    "Aucune compréhension de votre marque",
  ];

  const kultItems = [
    "Ads adaptées à VOTRE marque automatiquement",
    "Bibliothèque de pubs performantes mise à jour chaque jour",
    "1 clic, pas de prompt compliqué",
    "Analyse automatique de votre site (logo, couleurs, produits)",
  ];

  return (
    <section className="py-20 md:py-28 px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4">
          Pourquoi kultads et pas ChatGPT ?
        </h2>
        <p className="text-gray-500 text-center mb-16 max-w-lg mx-auto">
          Les outils génériques ne comprennent pas votre marque. kultads, si.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* ChatGPT / Midjourney */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-base font-semibold text-gray-400 line-through">
                ChatGPT / Midjourney
              </span>
            </div>
            <ul className="space-y-4">
              {chatgptItems.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <div className="shrink-0 w-5 h-5 rounded-full bg-red-50 flex items-center justify-center mt-0.5">
                    <X className="w-3 h-3 text-red-500" />
                  </div>
                  <span className="text-sm text-gray-500">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* kultads */}
          <div className="rounded-2xl border-2 border-violet-200 bg-violet-50/30 p-6 md:p-8 ring-1 ring-violet-100">
            <div className="flex items-center gap-2 mb-6">
              <KultLogoIcon className="w-6 h-6" />
              <span className="text-base font-semibold text-gray-900">
                kultads
              </span>
            </div>
            <ul className="space-y-4">
              {kultItems.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <div className="shrink-0 w-5 h-5 rounded-full bg-green-50 flex items-center justify-center mt-0.5">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── TESTIMONIALS ─────────────────────── */

function Testimonials() {
  const testimonials = [
    {
      initials: "LM",
      name: "Lucas M.",
      role: "Fondateur, e-commerce skincare",
      quote:
        "J'ai remplacé mon designer freelance par kultads. Je sors 5 créas par semaine au lieu d'une. Mon ROAS a doublé en 3 semaines.",
      metric: "ROAS x2",
      metricLabel: "en 3 semaines",
      color: "from-indigo-500 to-violet-500",
    },
    {
      initials: "SC",
      name: "Sophie C.",
      role: "Media buyer, agence digitale",
      quote:
        "On testait 2 créas par mois. Maintenant on en teste 10. La bibliothèque d'ads gagnantes, c'est un game-changer.",
      metric: "5x",
      metricLabel: "plus de créas testées",
      color: "from-violet-500 to-purple-500",
    },
    {
      initials: "TN",
      name: "Thomas N.",
      role: "Dropshipper",
      quote:
        "30 secondes pour une pub qui ressemble à ce que font les grosses marques. J'économise 500€ par mois en design.",
      metric: "500€",
      metricLabel: "économisés / mois",
      color: "from-purple-500 to-pink-500",
    },
  ];

  return (
    <section className="py-20 md:py-28 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4">
          Ils génèrent des pubs qui convertissent
        </h2>
        <p className="text-gray-500 text-center mb-16 max-w-md mx-auto">
          Des e-commerces et agences qui utilisent kultads au quotidien.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-xs font-bold`}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {t.name}
                  </p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>

              {/* Stars */}
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>

              {/* Quote */}
              <div className="flex-1 mb-5">
                <Quote className="w-4 h-4 text-gray-200 mb-2" />
                <p className="text-sm text-gray-600 leading-relaxed">
                  {t.quote}
                </p>
              </div>

              {/* Metric */}
              <div className="pt-4 border-t border-gray-100">
                <p
                  className={`text-2xl font-extrabold bg-gradient-to-r ${t.color} bg-clip-text text-transparent`}
                >
                  {t.metric}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {t.metricLabel}
                </p>
              </div>
            </div>
          ))}
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
  badge,
}: {
  name: string;
  price: string;
  period?: string;
  subtitle: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
}) {
  return (
    <div
      className={`relative rounded-2xl p-6 md:p-8 flex flex-col ${
        highlighted
          ? "bg-gray-900 text-white ring-2 ring-violet-500"
          : "bg-white border border-gray-200"
      }`}
    >
      {badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-semibold bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-3 py-1 rounded-full whitespace-nowrap">
          {badge}
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
        className={`block text-center text-sm font-semibold py-3 rounded-xl transition-all ${
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
    <section className="py-20 md:py-28 px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4">
          Tarifs simples, sans surprise
        </h2>
        <p className="text-gray-500 text-center mb-16 max-w-md mx-auto">
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
            badge="Le plus populaire"
            features={[
              "Créations illimitées",
              "Tous les formats (carré + story)",
              "Modification par prompt IA",
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
      a: "Vous choisissez une pub qui cartonne, vous ajoutez votre produit, et l'IA génère votre version personnalisée en 30 secondes.",
    },
    {
      q: "En quoi c'est différent de ChatGPT ou Midjourney ?",
      a: "ChatGPT et Midjourney sont des outils génériques. kultads est spécialisé dans les publicités : bibliothèque d'ads gagnantes, analyse automatique de votre marque, formats optimisés pour Meta/TikTok. Zéro prompt à écrire.",
    },
    {
      q: "Quels formats sont disponibles ?",
      a: "Carré (1:1) pour le feed Instagram/Facebook et story (9:16) pour les Reels, stories et TikTok. Conversion de l'un à l'autre en un clic.",
    },
    {
      q: "Je peux modifier une pub après génération ?",
      a: "Oui. Écrivez ce que vous voulez changer en texte libre (« change le fond en rouge », « ajoute un badge -30% ») et l'IA applique instantanément.",
    },
    {
      q: "C'est légal ? Je suis propriétaire des images ?",
      a: "Les publicités générées sont originales et créées pour votre marque. Vous en êtes propriétaire et pouvez les utiliser librement sur toutes vos plateformes.",
    },
    {
      q: "Combien de temps pour générer une pub ?",
      a: "30 secondes en moyenne. Choisissez un template, ajoutez votre URL, c'est prêt.",
    },
  ];

  return (
    <section className="py-20 md:py-28 px-6 bg-white">
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
    <section className="py-20 md:py-28 px-6 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white">
          Prêt à transformer vos pubs ?
        </h2>
        <p className="mt-4 text-base text-white/60">
          Première pub gratuite, sans carte bancaire.
        </p>
        <div className="mt-10">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold px-8 py-4 text-base rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
          >
            Générer ma première pub
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
    <footer className="py-10 px-6 bg-white border-t border-gray-100">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <KultLogoIcon className="w-7 h-7 opacity-40" />
        <div className="flex items-center gap-6 text-xs text-gray-400">
          <Link href="/cgu" className="hover:text-gray-600 transition-colors">
            CGU
          </Link>
          <Link
            href="/login"
            className="hover:text-gray-600 transition-colors"
          >
            Connexion
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
        <FormatShowcase />
        <Comparison />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
