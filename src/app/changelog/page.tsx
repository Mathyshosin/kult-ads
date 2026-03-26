import Link from "next/link";
import { KultLogoFull } from "@/components/kult-logo";
import {
  Check,
  ArrowLeft,
  CreditCard,
  Wand2,
  ImageIcon,
  Rocket,
  Shield,
  Sparkles,
  Palette,
  Zap,
} from "lucide-react";

const updates = [
  {
    date: "26 Mars 2026",
    version: "v2.4.1",
    icon: ImageIcon,
    color: "from-pink-500 to-rose-500",
    title: "Bibliothèque enrichie",
    description: "Nouvelles ads ajoutées chaque jour dans la bibliothèque.",
    tag: "bibliotheque",
    items: [
      "+15 nouvelles ads cosmétique & beauté",
      "+10 nouvelles ads food & boisson",
      "+8 nouvelles ads tech & gadgets",
      "Amélioration du matching template ↔ produit",
    ],
  },
  {
    date: "26 Mars 2026",
    version: "v2.4",
    icon: CreditCard,
    color: "from-green-500 to-emerald-500",
    title: "Paiement & Crédits",
    description: "Monétisation complète avec Stripe et système de crédits intelligent.",
    tag: "feature",
    items: [
      "Intégration Stripe complète (Starter, Pro, Agency)",
      "Packs de crédits supplémentaires (Boost, Growth, Scale)",
      "Page Mon abonnement dans le dashboard",
      "Redirection automatique des nouveaux users vers les offres",
      "Crédits illimités pour les administrateurs",
    ],
  },
  {
    date: "25 Mars 2026",
    version: "v2.3.1",
    icon: Palette,
    color: "from-pink-500 to-rose-500",
    title: "Nouveau logo & Branding",
    description: "Nouvelle identité visuelle avec le logo infini.",
    items: [
      "Nouveau logo Kultads (symbole infini)",
      "Mise à jour du branding sur toute la plateforme",
      "Badges sur les offres (Meilleur pour débuter, BEST ROI)",
    ],
  },
  {
    date: "25 Mars 2026",
    version: "v2.3",
    icon: Wand2,
    color: "from-violet-500 to-purple-500",
    title: "Modification intelligente & CTA",
    description: "Retouchez vos publicités et personnalisez chaque détail.",
    items: [
      "Retouche IA : modifiez vos ads avec de simples instructions textuelles",
      "Conversion carré vers story en un clic",
      "CTA personnalisable avec texte libre (optionnel)",
      "Offre éditable inline avant génération (titre, prix, réduction)",
      "L'original est conservé lors d'une modification",
    ],
  },
  {
    date: "24 Mars 2026",
    version: "v2.2",
    icon: ImageIcon,
    color: "from-blue-500 to-indigo-500",
    title: "Bibliothèque & Copy-Ads",
    description: "4 modes de création pour s'adapter à tous les workflows.",
    items: [
      "Mode Auto : l'IA choisit le meilleur template automatiquement",
      "Mode Bibliothèque : parcourez et copiez des ads performantes",
      "Mode Copy-Ads : uploadez une ad que vous aimez et reproduisez-la",
      "Mode Prompt : décrivez exactement ce que vous voulez",
      "Page admin pour modérer les templates soumis par les utilisateurs",
    ],
  },
  {
    date: "23 Mars 2026",
    version: "v2.1",
    icon: Rocket,
    color: "from-orange-500 to-red-500",
    title: "Performance & Expérience",
    description: "Un dashboard plus rapide et une meilleure expérience utilisateur.",
    items: [
      "Chargement 3x plus rapide (téléchargement parallèle des images)",
      "Hydratation en 2 phases (page Créer instantanée)",
      "Système de favoris persistant en base de données",
      "Animation de chargement avec fun facts marketing",
      "Navigation fluide avec sliding pill animée",
      "Skeletons de chargement pour toutes les pages",
    ],
  },
  {
    date: "22 Mars 2026",
    version: "v2.0.1",
    icon: Sparkles,
    color: "from-amber-500 to-yellow-500",
    title: "Qualité des ads",
    description: "Amélioration significative de la qualité de génération.",
    items: [
      "Suppression du CTA par défaut (optionnel maintenant)",
      "Suppression des codes couleur hex dans les images",
      "Meilleur respect du template de référence",
      "Correction du mimeType JPEG/PNG automatique",
      "Ajout du contexte produit complet dans le prompt",
    ],
  },
  {
    date: "21 Mars 2026",
    version: "v2.0",
    icon: Shield,
    color: "from-cyan-500 to-blue-500",
    title: "Lancement de Kultads",
    description: "Première version publique de la plateforme.",
    items: [
      "Génération de publicités par IA (Google Gemini)",
      "Analyse automatique de votre site e-commerce",
      "Détection des produits, offres et identité de marque",
      "Export HD en format carré (1080x1080) et story (1080x1920)",
      "Dashboard complet avec galerie d'ads",
      "Authentification Supabase (email/mot de passe)",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <KultLogoFull />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-5 py-16">
        {/* Header */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-full px-4 py-1.5 mb-4">
            <Zap className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-semibold text-violet-700">Changelog</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-3">
            Nouveautés & Mises à jour
          </h1>
          <p className="text-lg text-gray-500">
            On améliore Kultads chaque jour. Suivez toutes les évolutions de la plateforme.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-violet-200 via-gray-200 to-transparent" />

          <div className="space-y-12">
            {updates.map((update, i) => (
              <div key={i} className="relative flex gap-6">
                {/* Icon */}
                <div className={`relative z-10 w-12 h-12 rounded-xl bg-gradient-to-br ${update.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  <update.icon className="w-5 h-5 text-white" />
                </div>

                {/* Content card */}
                <div className="flex-1 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{update.date}</span>
                    <span className="text-xs font-bold bg-violet-100 text-violet-600 px-2.5 py-0.5 rounded-full">{update.version}</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{update.title}</h2>
                  <p className="text-sm text-gray-500 mb-4">{update.description}</p>
                  <ul className="space-y-2">
                    {update.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <p className="text-gray-400 text-sm mb-4">Plus de mises à jour à venir...</p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white px-8 py-3 rounded-full text-sm font-bold hover:shadow-lg hover:shadow-violet-200 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Commencer gratuitement
          </Link>
        </div>
      </main>
    </>
  );
}
