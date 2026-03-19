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
// Main Admin Page
// ══════════════════════════════════════════

export default function AdminPage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const isLoading = useAuthStore((s) => s.isLoading);
  const initialize = useAuthStore((s) => s.initialize);
  const [activeTab, setActiveTab] = useState<"moderation" | "prompts">("moderation");
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
          </div>
        </div>

        {/* Content */}
        {activeTab === "moderation" ? <ModerationTab /> : <PromptsTab />}
      </div>
    </div>
  );
}
