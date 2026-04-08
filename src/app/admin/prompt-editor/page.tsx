"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { AVAILABLE_VARIABLES } from "@/lib/prompt-variables";
import Link from "next/link";
import {
  Save,
  Check,
  Copy,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Circle,
  X,
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  format: string;
  previewUrl: string;
}

export default function PromptEditorPage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const isLoading = useAuthStore((s) => s.isLoading);
  const initialize = useAuthStore((s) => s.initialize);
  const initRef = useRef(false);

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      const unsub = initialize();
      return unsub;
    }
  }, [initialize]);

  const isAdmin = currentUser?.email === "mathys.hosin@gmail.com";

  const [templates, setTemplates] = useState<Template[]>([]);
  const [prompts, setPrompts] = useState<Record<string, string | null>>({});
  const [doneMap, setDoneMap] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem("pe_done") || "{}"); } catch { return {}; }
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [promptText, setPromptText] = useState("");
  const [savedPromptText, setSavedPromptText] = useState("");
  const [filter, setFilter] = useState<"all" | "square" | "story" | "done" | "todo">("all");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  // Load templates + prompts
  useEffect(() => {
    Promise.all([
      fetch("/api/templates").then((r) => r.json()),
      fetch("/api/admin/template-prompts").then((r) => r.json().catch(() => ({ prompts: {} }))),
    ])
      .then(([tplData, promptData]) => {
        setTemplates(tplData?.templates || tplData || []);
        setPrompts(promptData?.prompts || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Persist done map
  useEffect(() => {
    localStorage.setItem("pe_done", JSON.stringify(doneMap));
  }, [doneMap]);

  // Derived
  const selectedTemplate = templates.find((t) => t.id === selectedId) || null;
  const isModified = promptText !== savedPromptText;

  const hasPrompt = (id: string) => {
    const p = prompts[id];
    return p !== null && p !== undefined && p.trim() !== "";
  };

  const filteredTemplates = templates.filter((t) => {
    if (filter === "square") return t.format === "square";
    if (filter === "story") return t.format === "story";
    if (filter === "done") return doneMap[t.id];
    if (filter === "todo") return !doneMap[t.id];
    return true;
  });

  const doneCount = templates.filter((t) => doneMap[t.id]).length;
  const todoCount = templates.length - doneCount;

  // Handlers
  const handleSelect = (id: string) => {
    setSelectedId(id);
    const existing = prompts[id] || "";
    setPromptText(existing);
    setSavedPromptText(existing);
  };

  const toggleDone = (id: string) => {
    setDoneMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/save-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: selectedId, prompt: promptText.trim() || null }),
      });
      if (res.ok) {
        setPrompts((prev) => ({ ...prev, [selectedId]: promptText.trim() || null }));
        setSavedPromptText(promptText);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedVar(key);
    setTimeout(() => setCopiedVar(null), 1500);
  };

  // Auth guards
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <p className="text-gray-500">Acces restreint</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex">
      {/* ═══ Sidebar — Template List ═══ */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Link
              href="/admin"
              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-base font-bold text-gray-900">Templates</h1>
              <p className="text-[11px] text-gray-400">
                <span className="text-green-600 font-medium">{doneCount}</span> termines · <span className="text-orange-500 font-medium">{todoCount}</span> restants
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-1">
            {([
              { key: "all", label: "Tous" },
              { key: "todo", label: "A faire" },
              { key: "done", label: "Termines" },
              { key: "square", label: "Carre" },
              { key: "story", label: "Story" },
            ] as const).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex-1 text-[10px] font-semibold rounded-lg py-1.5 transition-all ${
                  filter === f.key
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Link to test page */}
          <Link
            href="/admin/prompt-test"
            className="mt-3 flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-black transition-colors"
          >
            🍌 Tester un prompt
          </Link>
        </div>

        {/* Template list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filteredTemplates.map((t) => {
            const done = doneMap[t.id];
            const hasP = hasPrompt(t.id);
            const selected = selectedId === t.id;

            return (
              <div
                key={t.id}
                className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-all ${
                  selected ? "bg-blue-50 ring-1 ring-blue-300" : "hover:bg-gray-50"
                }`}
              >
                {/* Done toggle */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleDone(t.id); }}
                  className="flex-shrink-0"
                >
                  {done ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                  )}
                </button>

                {/* Thumbnail + info */}
                <div
                  className="flex items-center gap-2.5 flex-1 min-w-0"
                  onClick={() => handleSelect(t.id)}
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {t.previewUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={t.previewUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-[8px]">?</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-medium truncate ${done ? "text-gray-400 line-through" : "text-gray-800"}`}>
                      {t.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-gray-400 capitalize">{t.format}</span>
                      {hasP && (
                        <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                          Prompt
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredTemplates.length === 0 && (
            <div className="text-center py-10 text-xs text-gray-400">Aucun template</div>
          )}
        </div>
      </div>

      {/* ═══ Right Panel ═══ */}
      <div className="flex-1 overflow-y-auto">
        {!selectedTemplate ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4 text-3xl">
                📝
              </div>
              <h2 className="text-base font-semibold text-gray-700">Selectionnez un template</h2>
              <p className="text-sm text-gray-400 mt-1">Choisissez dans la liste a gauche</p>
            </div>
          </div>
        ) : (
          <div className="p-6 max-w-3xl mx-auto space-y-5">
            {/* Template header */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                {selectedTemplate.previewUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={selectedTemplate.previewUrl} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900">{selectedTemplate.name}</h2>
                <p className="text-xs text-gray-400 capitalize">{selectedTemplate.format}</p>
              </div>
              <button
                onClick={() => toggleDone(selectedTemplate.id)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  doneMap[selectedTemplate.id]
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {doneMap[selectedTemplate.id] ? "✓ Termine" : "Marquer termine"}
              </button>
            </div>

            {/* Prompt textarea */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600">Prompt du template</span>
                {isModified && (
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-[10px] font-medium">
                    Non sauvegarde
                  </span>
                )}
                <div className="flex-1" />
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 bg-gray-900 hover:bg-black text-white rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  {saveSuccess ? "Sauvegarde !" : "Sauvegarder"}
                </button>
              </div>
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Collez votre prompt ici... Utilisez les {{variables}} pour les elements de la marque."
                className="w-full min-h-[250px] p-4 text-sm font-mono resize-y focus:outline-none placeholder:text-gray-300 border-none"
              />
            </div>

            {/* Variables */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Variables disponibles (cliquez pour copier)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_VARIABLES.map((v) => (
                  <button
                    key={v.key}
                    onClick={() => handleCopy(v.key)}
                    title={`${v.label} — ex: ${v.example}`}
                    className="bg-gray-50 hover:bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg text-xs font-mono transition-colors"
                  >
                    {copiedVar === v.key ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Copie
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Copy className="w-3 h-3 text-gray-400" /> {v.key}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/admin/prompt-test"
                className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white rounded-xl px-5 py-3 text-sm font-semibold transition-colors"
              >
                🍌 Tester ce prompt
              </Link>
              {promptText.trim() && (
                <button
                  onClick={() => { navigator.clipboard.writeText(promptText); setCopiedVar("__prompt"); setTimeout(() => setCopiedVar(null), 1500); }}
                  className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl px-5 py-3 text-sm font-medium transition-colors"
                >
                  {copiedVar === "__prompt" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  {copiedVar === "__prompt" ? "Copie !" : "Copier le prompt"}
                </button>
              )}
              {selectedId && promptText.trim() && (
                <button
                  onClick={() => { setPromptText(""); }}
                  className="flex items-center gap-2 text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                >
                  <X className="w-4 h-4" /> Effacer
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
