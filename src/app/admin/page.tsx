"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthStore } from "@/lib/auth-store";
import {
  ChevronDown,
  ChevronRight,
  Bot,
  Image,
  FileText,
  Cpu,
  Check,
  X,
  Loader2,
  ShieldCheck,
  Inbox,
  Package,
  Briefcase,
  BarChart3,
  Users,
  ImageIcon,
  TrendingUp,
} from "lucide-react";

const ADMIN_EMAIL = "mathys.hosin@gmail.com";

// ══════════════════════════════════════════
// Types
// ══════════════════════════════════════════

interface PendingTemplate {
  id: string;
  filename: string;
  mime_type: string;
  format: "square" | "story";
  status: string;
  submitted_by: string;
  created_at: string;
  imageUrl: string;
}

// ══════════════════════════════════════════
// Moderation Card — simplified: just Produit / Service
// ══════════════════════════════════════════

function PendingCard({
  item,
  onApprove,
  onReject,
  loading,
}: {
  item: PendingTemplate;
  onApprove: (item: PendingTemplate, meta: { type: "produit" | "service" }) => void;
  onReject: (item: PendingTemplate) => void;
  loading: boolean;
}) {
  const [type, setType] = useState<"produit" | "service">("produit");

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Image */}
      <div className="relative aspect-square bg-gray-100">
        {item.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.imageUrl}
            alt="Pending template"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            Image non disponible
          </div>
        )}
        <span className="absolute top-2 left-2 text-[10px] font-semibold bg-black/70 text-white px-2 py-0.5 rounded-full">
          {new Date(item.created_at).toLocaleDateString("fr-FR")}
        </span>
        <span className="absolute top-2 right-2 text-[10px] font-semibold bg-blue-500/90 text-white px-2 py-0.5 rounded-full capitalize">
          {item.format}
        </span>
      </div>

      {/* Controls — simplified */}
      <div className="p-3 space-y-3">
        {/* Type selector: Produit or Service */}
        <div className="flex gap-2">
          <button
            onClick={() => setType("produit")}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-xl py-2.5 border-2 transition-all ${
              type === "produit"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Produit
          </button>
          <button
            onClick={() => setType("service")}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-xl py-2.5 border-2 transition-all ${
              type === "service"
                ? "border-purple-500 bg-purple-50 text-purple-700"
                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Service
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onApprove(item, { type })}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-green-500 hover:bg-green-600 text-white rounded-xl py-2.5 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Approuver
          </button>
          <button
            onClick={() => onReject(item)}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 rounded-xl px-4 py-2.5 transition-colors disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// Moderation Tab
// ══════════════════════════════════════════

function ModerationTab() {
  const [pending, setPending] = useState<PendingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch("/api/pending-templates");
      if (res.ok) {
        const data = await res.json();
        setPending(data.pending || []);
      }
    } catch (err) {
      console.error("Failed to fetch pending:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleApprove = async (
    item: PendingTemplate,
    meta: { type: "produit" | "service" }
  ) => {
    setActionLoading(item.id);
    try {
      const res = await fetch("/api/pending-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          id: item.id,
          filename: item.filename,
          name: `Template ${new Date(item.created_at).toLocaleDateString("fr-FR")}`,
          format: item.format,
          category: "product-showcase",
          tags: {
            industry: [],
            adType: [],
            productType: [meta.type === "produit" ? "produit-physique" : "service"],
          },
        }),
      });
      if (res.ok) {
        setPending((prev) => prev.filter((p) => p.id !== item.id));
      }
    } catch (err) {
      console.error("Approve failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (item: PendingTemplate) => {
    setActionLoading(item.id);
    try {
      const res = await fetch("/api/pending-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          id: item.id,
          filename: item.filename,
        }),
      });
      if (res.ok) {
        setPending((prev) => prev.filter((p) => p.id !== item.id));
      }
    } catch (err) {
      console.error("Reject failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-sm text-gray-500">Chargement...</span>
      </div>
    );
  }

  if (pending.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Inbox className="w-7 h-7 text-gray-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-700">Aucun template en attente</h3>
        <p className="text-sm text-gray-400 mt-1">
          Les ads uploadées par les clients apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        {pending.length} template{pending.length > 1 ? "s" : ""} en attente de modération
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {pending.map((item) => (
          <PendingCard
            key={item.id}
            item={item}
            onApprove={handleApprove}
            onReject={handleReject}
            loading={actionLoading === item.id}
          />
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// Prompts Tab
// ══════════════════════════════════════════

interface PromptSection {
  id: string;
  title: string;
  model: string;
  icon: React.ReactNode;
  description: string;
  systemPrompt: string;
  userPromptTemplate: string;
}

const PROMPTS: PromptSection[] = [
  {
    id: "analyze",
    title: "Analyse de marque",
    model: "Claude Sonnet 4",
    icon: <Bot className="w-4 h-4" />,
    description: "Analyse les données scrappées d'un site web.",
    systemPrompt: `Tu es un expert en marketing digital et analyse de marque...`,
    userPromptTemplate: `Données du site web à analyser: {scrapedData}`,
  },
  {
    id: "copy",
    title: "Copywriting publicitaire",
    model: "Claude Sonnet 4",
    icon: <FileText className="w-4 h-4" />,
    description: "Génère le texte publicitaire en français.",
    systemPrompt: `Tu es un copywriter expert en publicité digitale française...`,
    userPromptTemplate: `Marque: {brandName}\nProduit: {productName}\nAngle: {conversionAngle}`,
  },
  {
    id: "gemini-library",
    title: "Gemini — Mode Bibliothèque",
    model: "Gemini 3.1 Flash Image",
    icon: <Image className="w-4 h-4" />,
    description: "Template comme direction créative → Gemini génère l'image.",
    systemPrompt: `Ref images: template (creative direction), product, logo`,
    userPromptTemplate: `Create a professional Instagram ad inspired by template style...`,
  },
  {
    id: "gemini-config",
    title: "Configuration Gemini",
    model: "Gemini 3.1 Flash Image Preview",
    icon: <Cpu className="w-4 h-4" />,
    description: "Paramètres techniques de l'appel Gemini.",
    systemPrompt: `Modèle : gemini-3.1-flash-image-preview\nResponse modalities : ["IMAGE", "TEXT"]\nMax retries : 3`,
    userPromptTemplate: `(Voir les prompts de génération ci-dessus)`,
  },
];

function PromptBlock({ prompt }: { prompt: PromptSection }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex-shrink-0">
          {prompt.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-800">{prompt.title}</h3>
          <p className="text-[11px] text-gray-400 truncate">{prompt.model}</p>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4">
          <p className="text-xs text-gray-500">{prompt.description}</p>
          <div>
            <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">System Prompt</span>
            <pre className="bg-gray-900 text-green-400 text-[11px] p-4 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono max-h-[300px] overflow-y-auto mt-1.5">
              {prompt.systemPrompt}
            </pre>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">User Prompt</span>
            <pre className="bg-gray-900 text-amber-300 text-[11px] p-4 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono max-h-[300px] overflow-y-auto mt-1.5">
              {prompt.userPromptTemplate}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function PromptsTab() {
  return (
    <div className="space-y-3">
      {PROMPTS.map((p) => (
        <PromptBlock key={p.id} prompt={p} />
      ))}
    </div>
  );
}

// ══════════════════════════════════════════
// Analytics Tab
// ══════════════════════════════════════════

interface AdminStats {
  totalUsers: number;
  totalAds: number;
  totalTemplates: number;
  adsToday: number;
  recentUsers: {
    user_id: string;
    email: string;
    created_at: string;
    ad_count: number;
  }[];
  topTemplates: {
    template_id: string;
    count: number;
    name: string;
    previewUrl: string;
  }[];
  adsPerDay: {
    date: string;
    count: number;
  }[];
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
        >
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-800">{value.toLocaleString("fr-FR")}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  );
}

function AnalyticsTab() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomedTemplate, setZoomedTemplate] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) throw new Error("Erreur API");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
        setError("Impossible de charger les statistiques.");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-sm text-gray-500">Chargement des stats...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BarChart3 className="w-10 h-10 text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">{error || "Aucune donnée"}</p>
      </div>
    );
  }

  const maxAdsPerDay = Math.max(...stats.adsPerDay.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Utilisateurs"
          value={stats.totalUsers}
          icon={<Users className="w-5 h-5 text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          label="Ads générées"
          value={stats.totalAds}
          icon={<ImageIcon className="w-5 h-5 text-violet-600" />}
          color="bg-violet-50"
        />
        <StatCard
          label="Templates"
          value={stats.totalTemplates}
          icon={<Package className="w-5 h-5 text-amber-600" />}
          color="bg-amber-50"
        />
        <StatCard
          label="Ads aujourd'hui"
          value={stats.adsToday}
          icon={<TrendingUp className="w-5 h-5 text-green-600" />}
          color="bg-green-50"
        />
      </div>

      {/* Ads per day chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Ads par jour (7 derniers jours)</h3>
        <div className="flex items-end gap-2 h-40">
          {stats.adsPerDay.map((day) => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-semibold text-gray-600">{day.count}</span>
              <div
                className="w-full rounded-lg bg-gradient-to-t from-blue-500 to-violet-500 transition-all"
                style={{
                  height: `${Math.max((day.count / maxAdsPerDay) * 100, 4)}%`,
                  minHeight: "4px",
                }}
              />
              <span className="text-[10px] text-gray-400">{day.date}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Utilisateurs récents</h3>
          <div className="space-y-2">
            {stats.recentUsers.length === 0 ? (
              <p className="text-xs text-gray-400">Aucun utilisateur</p>
            ) : (
              stats.recentUsers.map((u) => (
                <div
                  key={u.user_id}
                  className="flex items-center justify-between py-2 px-3 rounded-xl bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{u.email}</p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(u.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full flex-shrink-0 ml-2">
                    {u.ad_count} ad{u.ad_count > 1 ? "s" : ""}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Templates */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Templates les plus utilisés</h3>
          <div className="space-y-2">
            {stats.topTemplates.length === 0 ? (
              <p className="text-xs text-gray-400">Aucune donnée</p>
            ) : (
              stats.topTemplates.map((t, i) => (
                <button
                  key={t.template_id}
                  onClick={() => t.previewUrl && setZoomedTemplate(t.previewUrl === zoomedTemplate ? null : t.previewUrl)}
                  className="w-full flex items-center gap-3 py-2 px-3 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors cursor-pointer text-left"
                >
                  <span className="text-xs font-bold text-gray-400 w-5 text-center flex-shrink-0">
                    {i + 1}
                  </span>
                  {t.previewUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={t.previewUrl}
                      alt={t.name}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{t.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{t.template_id}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex-shrink-0">
                    {t.count} usage{t.count > 1 ? "s" : ""}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Zoomed template modal */}
      {zoomedTemplate && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-8"
          onClick={() => setZoomedTemplate(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoomedTemplate}
            alt="Template preview"
            className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setZoomedTemplate(null)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-gray-700 hover:bg-white transition-colors shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// Changelog Tab
// ══════════════════════════════════════════

const ICON_OPTIONS = [
  { value: "Sparkles", label: "Sparkles" },
  { value: "Rocket", label: "Rocket" },
  { value: "ImageIcon", label: "Image" },
  { value: "CreditCard", label: "Paiement" },
  { value: "Wand2", label: "IA" },
  { value: "Shield", label: "Sécurité" },
  { value: "Palette", label: "Design" },
  { value: "Zap", label: "Performance" },
];

const COLOR_OPTIONS = [
  { value: "from-violet-500 to-purple-500", label: "Violet" },
  { value: "from-blue-500 to-indigo-500", label: "Bleu" },
  { value: "from-green-500 to-emerald-500", label: "Vert" },
  { value: "from-orange-500 to-red-500", label: "Orange" },
  { value: "from-pink-500 to-rose-500", label: "Rose" },
  { value: "from-cyan-500 to-blue-500", label: "Cyan" },
  { value: "from-amber-500 to-yellow-500", label: "Jaune" },
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

function ChangelogTab() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [version, setVersion] = useState("");
  const [description, setDescription] = useState("");
  const [itemsText, setItemsText] = useState("");
  const [icon, setIcon] = useState("Sparkles");
  const [color, setColor] = useState("from-violet-500 to-purple-500");

  useEffect(() => {
    fetch("/api/changelog")
      .then((r) => r.json())
      .then((data) => { setEntries(data.entries || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!title.trim() || !version.trim()) return;
    setSaving(true);

    const items = itemsText.split("\n").map((s) => s.trim()).filter(Boolean);

    try {
      const res = await fetch("/api/changelog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, version, description, items, icon, color }),
      });
      const data = await res.json();
      if (data.entry) {
        setEntries((prev) => [data.entry, ...prev]);
        setTitle("");
        setVersion("");
        setDescription("");
        setItemsText("");
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette entrée ?")) return;
    try {
      await fetch("/api/changelog", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Nouvelle entrée changelog</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Titre</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: +30 nouvelles ads beauté"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Version</label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="Ex: v2.5"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Nouvelles ads ajoutées dans la bibliothèque"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
        </div>
        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Détails (un par ligne)</label>
          <textarea
            value={itemsText}
            onChange={(e) => setItemsText(e.target.value)}
            placeholder={"+15 ads cosmétique\n+10 ads food\nAmélioration de la qualité"}
            rows={4}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Icône</label>
            <select
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300"
            >
              {ICON_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Couleur</label>
            <select
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300"
            >
              {COLOR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleAdd}
          disabled={saving || !title.trim() || !version.trim()}
          className="bg-violet-600 text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Publication..." : "Publier"}
        </button>
      </div>

      {/* Existing entries */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Entrées publiées ({entries.length})
        </h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Aucune entrée. Ajoutez la première !</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${entry.color} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-xs font-bold">{entry.version}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800">{entry.title}</p>
                  <p className="text-xs text-gray-500">{entry.description}</p>
                  {entry.items && entry.items.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {entry.items.map((item, j) => (
                        <li key={j} className="text-xs text-gray-500">• {item}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="text-red-400 hover:text-red-600 text-xs font-medium"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// Main Admin Page
// ══════════════════════════════════════════

export default function AdminPage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const isLoading = useAuthStore((s) => s.isLoading);
  const initialize = useAuthStore((s) => s.initialize);
  const [activeTab, setActiveTab] = useState<"moderation" | "prompts" | "analytics" | "changelog">("moderation");
  const initRef = useRef(false);

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      const unsub = initialize();
      return unsub;
    }
  }, [initialize]);

  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-700">Accès restreint</h2>
          <p className="text-sm text-gray-400 mt-1">Cette page est réservée aux administrateurs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-800">Admin</h1>
          {/* Tabs */}
          <div className="flex bg-white rounded-xl border border-gray-200 p-1">
            <button
              onClick={() => setActiveTab("moderation")}
              className={`text-xs font-medium px-4 py-1.5 rounded-lg transition-colors ${
                activeTab === "moderation"
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Modération
            </button>
            <button
              onClick={() => setActiveTab("prompts")}
              className={`text-xs font-medium px-4 py-1.5 rounded-lg transition-colors ${
                activeTab === "prompts"
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Prompts IA
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`text-xs font-medium px-4 py-1.5 rounded-lg transition-colors ${
                activeTab === "analytics"
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab("changelog")}
              className={`text-xs font-medium px-4 py-1.5 rounded-lg transition-colors ${
                activeTab === "changelog"
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Changelog
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "moderation" && <ModerationTab />}
        {activeTab === "prompts" && <PromptsTab />}
        {activeTab === "analytics" && <AnalyticsTab />}
        {activeTab === "changelog" && <ChangelogTab />}
      </div>
    </div>
  );
}
