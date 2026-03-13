import Link from "next/link";
import {
  Sparkles,
  Zap,
  BarChart3,
  Palette,
  ArrowRight,
  CheckCircle2,
  Play,
} from "lucide-react";

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-foreground">Kult-ads</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-muted hover:text-foreground transition-colors text-sm"
          >
            Fonctionnalités
          </a>
          <a
            href="#pricing"
            className="text-muted hover:text-foreground transition-colors text-sm"
          >
            Tarifs
          </a>
          <a
            href="#testimonials"
            className="text-muted hover:text-foreground transition-colors text-sm"
          >
            Témoignages
          </a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Connexion
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            Commencer gratuitement
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-full px-4 py-1.5 mb-8">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-medium">
            Propulsé par l&apos;IA
          </span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight max-w-4xl mx-auto">
          Créez des pubs{" "}
          <span className="text-primary">qui convertissent</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted max-w-2xl mx-auto leading-relaxed">
          Générez des publicités percutantes pour vos marques en quelques
          secondes. Visuels, textes, formats — tout est optimisé par
          l&apos;intelligence artificielle.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-xl text-base font-medium hover:bg-primary-dark transition-colors shadow-lg shadow-primary/25"
          >
            Essayer gratuitement
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button className="flex items-center gap-2 text-muted hover:text-foreground transition-colors px-8 py-3.5 rounded-xl border border-border text-base">
            <Play className="w-4 h-4" />
            Voir la démo
          </button>
        </div>
        <p className="mt-4 text-sm text-muted">
          Pas de carte bancaire requise · 14 jours d&apos;essai gratuit
        </p>

        {/* Hero visual */}
        <div className="mt-16 max-w-5xl mx-auto">
          <div className="bg-surface border border-border rounded-2xl p-8 shadow-xl shadow-black/5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Ad preview cards */}
              {[
                {
                  title: "Story Instagram",
                  format: "1080×1920",
                  color: "bg-gradient-to-br from-purple-400 to-pink-400",
                },
                {
                  title: "Post Facebook",
                  format: "1200×628",
                  color: "bg-gradient-to-br from-blue-400 to-cyan-400",
                },
                {
                  title: "Banner Google",
                  format: "728×90",
                  color: "bg-gradient-to-br from-amber-400 to-orange-400",
                },
              ].map((ad) => (
                <div
                  key={ad.title}
                  className="rounded-xl overflow-hidden border border-border"
                >
                  <div className={`${ad.color} h-40 flex items-center justify-center`}>
                    <span className="text-white font-bold text-lg">
                      {ad.title}
                    </span>
                  </div>
                  <div className="p-4 bg-white">
                    <p className="text-sm font-medium text-foreground">
                      {ad.title}
                    </p>
                    <p className="text-xs text-muted mt-1">{ad.format}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: Zap,
      title: "Génération ultra-rapide",
      description:
        "Créez des dizaines de variantes de publicités en quelques secondes grâce à notre moteur IA avancé.",
    },
    {
      icon: Palette,
      title: "Multi-formats",
      description:
        "Instagram, Facebook, Google Ads, TikTok... Tous les formats sont supportés et optimisés automatiquement.",
    },
    {
      icon: BarChart3,
      title: "Optimisation intelligente",
      description:
        "Analysez les performances et laissez l'IA suggérer les meilleures combinaisons visuels/textes.",
    },
    {
      icon: Sparkles,
      title: "Branding cohérent",
      description:
        "Importez votre charte graphique et l'IA respecte vos couleurs, fonts et ton de marque à chaque création.",
    },
  ];

  return (
    <section id="features" className="py-24 px-6 bg-surface">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Tout ce qu&apos;il faut pour des ads qui claquent
          </h2>
          <p className="mt-4 text-muted text-lg max-w-2xl mx-auto">
            Des outils puissants pour créer, tester et optimiser vos publicités
            sur tous les canaux.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white p-8 rounded-2xl border border-border hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-5">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "0€",
      period: "/ mois",
      description: "Pour découvrir Kult-ads",
      features: [
        "10 créations / mois",
        "3 formats disponibles",
        "Export PNG",
        "Support email",
      ],
      cta: "Commencer gratuitement",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "29€",
      period: "/ mois",
      description: "Pour les créateurs et PME",
      features: [
        "Créations illimitées",
        "Tous les formats",
        "Export PNG, JPG, MP4",
        "Branding personnalisé",
        "Analytics avancés",
        "Support prioritaire",
      ],
      cta: "Essai gratuit 14 jours",
      highlighted: true,
    },
    {
      name: "Agency",
      price: "79€",
      period: "/ mois",
      description: "Pour les agences et grandes marques",
      features: [
        "Tout le plan Pro",
        "Multi-marques (illimité)",
        "API access",
        "Membres d'équipe illimités",
        "Account manager dédié",
        "SLA garanti",
      ],
      cta: "Contacter l'équipe",
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Des tarifs simples et transparents
          </h2>
          <p className="mt-4 text-muted text-lg">
            Commencez gratuitement, évoluez quand vous voulez.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 border ${
                plan.highlighted
                  ? "border-primary bg-primary/5 shadow-xl shadow-primary/10 scale-105"
                  : "border-border bg-white"
              }`}
            >
              {plan.highlighted && (
                <span className="inline-block bg-primary text-white text-xs font-medium px-3 py-1 rounded-full mb-4">
                  Populaire
                </span>
              )}
              <h3 className="text-xl font-semibold text-foreground">
                {plan.name}
              </h3>
              <p className="text-sm text-muted mt-1">{plan.description}</p>
              <div className="mt-6 mb-8">
                <span className="text-4xl font-bold text-foreground">
                  {plan.price}
                </span>
                <span className="text-muted">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`block w-full text-center py-3 rounded-xl text-sm font-medium transition-colors ${
                  plan.highlighted
                    ? "bg-primary text-white hover:bg-primary-dark"
                    : "bg-surface text-foreground border border-border hover:bg-gray-100"
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

function Testimonials() {
  const testimonials = [
    {
      name: "Sophie Martin",
      role: "Directrice Marketing, ModaStyle",
      text: "Kult-ads a divisé par 5 notre temps de création de visuels pub. On produit maintenant 50 variantes en une matinée.",
      avatar: "SM",
    },
    {
      name: "Thomas Dupont",
      role: "Fondateur, FreshJuice",
      text: "L'IA comprend vraiment notre identité de marque. Les résultats sont bluffants et nos taux de conversion ont augmenté de 30%.",
      avatar: "TD",
    },
    {
      name: "Marie Chen",
      role: "Social Media Manager, TechStart",
      text: "Outil indispensable pour notre équipe. On gère 12 marques et Kult-ads nous fait gagner un temps fou au quotidien.",
      avatar: "MC",
    },
  ];

  return (
    <section id="testimonials" className="py-24 px-6 bg-surface">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Ils nous font confiance
          </h2>
          <p className="mt-4 text-muted text-lg">
            Plus de 2 000 marques utilisent Kult-ads au quotidien.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-white p-8 rounded-2xl border border-border"
            >
              <p className="text-foreground leading-relaxed mb-6">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t.name}
                  </p>
                  <p className="text-xs text-muted">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto text-center bg-primary rounded-3xl p-12 md:p-16">
        <h2 className="text-3xl md:text-4xl font-bold text-white">
          Prêt à booster vos publicités ?
        </h2>
        <p className="mt-4 text-primary-light text-lg max-w-xl mx-auto">
          Rejoignez des milliers de marques qui utilisent Kult-ads pour créer
          des publicités percutantes.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="bg-white text-primary font-medium px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Commencer gratuitement
          </Link>
          <a
            href="#pricing"
            className="text-white/80 hover:text-white transition-colors px-8 py-3.5"
          >
            Voir les tarifs →
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-foreground">Kult-ads</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-muted">
          <a href="#" className="hover:text-foreground transition-colors">
            Conditions
          </a>
          <a href="#" className="hover:text-foreground transition-colors">
            Confidentialité
          </a>
          <a href="#" className="hover:text-foreground transition-colors">
            Contact
          </a>
        </div>
        <p className="text-sm text-muted">
          © 2026 Kult-ads. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Pricing />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
