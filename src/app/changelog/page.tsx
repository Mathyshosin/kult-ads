import Link from "next/link";
import { AdlyLogoFull } from "@/components/adly-logo";
import { createClient } from "@/lib/supabase/server";
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
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  CreditCard,
  Wand2,
  ImageIcon,
  Rocket,
  Shield,
  Sparkles,
  Palette,
  Zap,
};

// Fallback entries if DB is empty
const fallbackEntries = [
  {
    id: "f1",
    created_at: "2026-03-26",
    version: "v2.4",
    icon: "CreditCard",
    color: "from-green-500 to-emerald-500",
    title: "Paiement & Crédits",
    description: "Monétisation complète avec Stripe.",
    items: [
      "Intégration Stripe (Starter, Pro, Agency)",
      "Packs de crédits supplémentaires",
      "Page Mon abonnement",
    ],
  },
  {
    id: "f2",
    created_at: "2026-03-25",
    version: "v2.3",
    icon: "Wand2",
    color: "from-violet-500 to-purple-500",
    title: "Modification intelligente",
    description: "Retouchez vos ads avec de simples instructions.",
    items: [
      "Retouche IA par instructions textuelles",
      "Conversion carré → story en un clic",
      "CTA personnalisable",
    ],
  },
  {
    id: "f3",
    created_at: "2026-03-24",
    version: "v2.2",
    icon: "ImageIcon",
    color: "from-blue-500 to-indigo-500",
    title: "Bibliothèque & Copy-Ads",
    description: "4 modes de création pour tous les workflows.",
    items: [
      "Mode Auto, Bibliothèque, Copy-Ads, Prompt",
      "Parcourez des ads performantes",
      "Uploadez vos propres références",
    ],
  },
  {
    id: "f4",
    created_at: "2026-03-23",
    version: "v2.1",
    icon: "Rocket",
    color: "from-orange-500 to-red-500",
    title: "Performance & UX",
    description: "Dashboard plus rapide et meilleure expérience.",
    items: [
      "Chargement 3x plus rapide",
      "Favoris persistants",
      "Navigation fluide avec animations",
    ],
  },
  {
    id: "f5",
    created_at: "2026-03-21",
    version: "v2.0",
    icon: "Shield",
    color: "from-cyan-500 to-blue-500",
    title: "Lancement de Adly",
    description: "Première version publique.",
    items: [
      "Génération d'ads par IA (Gemini)",
      "Analyse automatique de votre site",
      "Export HD carré et story",
    ],
  },
];

type ChangelogEntry = {
  id: string;
  created_at: string;
  version: string;
  icon: string;
  color: string;
  title: string;
  description: string;
  items: string[];
};

export const dynamic = "force-dynamic";

export default async function ChangelogPage() {
  let entries: ChangelogEntry[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("changelog")
      .select("*")
      .order("created_at", { ascending: false });
    entries = (data as ChangelogEntry[]) || [];
  } catch {
    entries = [];
  }

  // Use fallback if DB is empty
  if (entries.length === 0) {
    entries = fallbackEntries;
  }

  return (
    <>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <AdlyLogoFull />
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
            On améliore Adly chaque jour. Suivez toutes les évolutions de la plateforme.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-violet-200 via-gray-200 to-transparent" />

          <div className="space-y-12">
            {entries.map((entry) => {
              const IconComp = ICON_MAP[entry.icon] || Sparkles;
              const date = new Date(entry.created_at);
              const dateStr = date.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              });

              return (
                <div key={entry.id} className="relative flex gap-6">
                  <div className={`relative z-10 w-12 h-12 rounded-xl bg-gradient-to-br ${entry.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <IconComp className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{dateStr}</span>
                      <span className="text-xs font-bold bg-violet-100 text-violet-600 px-2.5 py-0.5 rounded-full">{entry.version}</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">{entry.title}</h2>
                    <p className="text-sm text-gray-500 mb-4">{entry.description}</p>
                    <ul className="space-y-2">
                      {(entry.items || []).map((item: string, j: number) => (
                        <li key={j} className="flex items-start gap-2.5 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
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
