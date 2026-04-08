"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { AVAILABLE_VARIABLES } from "@/lib/prompt-variables";
import Link from "next/link";
import {
  Sparkles,
  Play,
  Save,
  Check,
  Copy,
  Loader2,
  ArrowLeft,
} from "lucide-react";

// ══════════════════════════════════════════
// Types
// ══════════════════════════════════════════

interface Template {
  id: string;
  name: string;
  format: string;
  previewUrl: string;
}

// ══════════════════════════════════════════
// Prompt Editor Page
// ══════════════════════════════════════════

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

  const isAdminUser = currentUser?.email === "mathys.hosin@gmail.com";

  const [templates, setTemplates] = useState<Template[]>([]);
  const [prompts, setPrompts] = useState<Record<string, string | null>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [promptText, setPromptText] = useState("");
  const [savedPromptText, setSavedPromptText] = useState("");
  const [filter, setFilter] = useState<"all" | "square" | "story">("all");
  const [analyzing, setAnalyzing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{
    imageBase64: string;
    mimeType: string;
  } | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── Data loading ──────────────────────────

  useEffect(() => {
    Promise.all([
      fetch("/api/templates").then((r) => r.json()),
      fetch("/api/admin/template-prompts").then((r) => r.json().catch(() => ({ prompts: {} }))),
    ])
      .then(([templatesData, promptsData]) => {
        setTemplates(templatesData?.templates || templatesData || []);
        setPrompts(promptsData?.prompts || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── Derived state ─────────────────────────

  const selectedTemplate = templates.find((t) => t.id === selectedId) || null;

  const filteredTemplates = templates.filter((t) => {
    if (filter === "all") return true;
    return t.format === filter;
  });

  const customPromptCount = Object.values(prompts).filter(
    (p) => p !== null && p !== undefined && p.trim() !== ""
  ).length;

  const isModified = promptText !== savedPromptText;

  // ── Template selection ────────────────────

  const handleSelectTemplate = (id: string) => {
    setSelectedId(id);
    const existingPrompt = prompts[id] || "";
    setPromptText(existingPrompt);
    setSavedPromptText(existingPrompt);
    setTestResult(null);
  };

  // ── Analyze (Claude) ──────────────────────

  const handleAnalyze = async () => {
    if (!selectedId) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/admin/analyze-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: selectedId }),
      });
      if (res.ok) {
        const { prompt } = await res.json();
        setPromptText(prompt);
      }
    } catch {
      /* ignore */
    }
    setAnalyzing(false);
  };

  // ── Test (Gemini) ─────────────────────────

  const handleTest = async () => {
    if (!selectedId || !promptText.trim()) return;
    setTesting(true);
    setTestResult(null);
    setTestError(null);
    try {
      const selected = templates.find((t) => t.id === selectedId);
      const res = await fetch("/api/admin/test-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptText,
          templateId: selectedId,
          format: selected?.format || "square",
        }),
      });
      const data = await res.json();
      if (res.ok && data.imageBase64) {
        setTestResult({
          imageBase64: data.imageBase64,
          mimeType: data.mimeType,
        });
      } else {
        setTestError(data.error || `Erreur ${res.status}`);
      }
    } catch (err) {
      setTestError(err instanceof Error ? err.message : "Erreur reseau");
    }
    setTesting(false);
  };

  // ── Save ──────────────────────────────────

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/save-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedId,
          prompt: promptText.trim() || null,
        }),
      });
      if (res.ok) {
        setPrompts((prev) => ({
          ...prev,
          [selectedId]: promptText.trim() || null,
        }));
        setSavedPromptText(promptText);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch {
      /* ignore */
    }
    setSaving(false);
  };

  // ── Copy variable ─────────────────────────

  const handleCopyVariable = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedVar(key);
    setTimeout(() => setCopiedVar(null), 1500);
  };

  // ── Auth guard ────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAdminUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center max-w-sm">
          <h1 className="text-lg font-bold text-gray-800 mb-2">
            Acces restreint
          </h1>
          <p className="text-sm text-gray-500">
            Cette page est reservee aux administrateurs.
          </p>
          <Link
            href="/admin"
            className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Retour
          </Link>
        </div>
      </div>
    );
  }

  // ── Loading state ─────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-sm text-gray-500">Chargement...</span>
      </div>
    );
  }

  // ── Render ────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ═══════════ Left Sidebar ═══════════ */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-y-auto flex-shrink-0">
        {/* Sidebar header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Link
              href="/admin"
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-base font-bold text-gray-800">
                Prompt Editor
              </h1>
              <p className="text-[11px] text-gray-400">
                {customPromptCount} template
                {customPromptCount > 1 ? "s" : ""} avec prompt custom
              </p>
            </div>
          </div>

          {/* Filter pills */}
          <div className="flex gap-1.5">
            {(
              [
                { key: "all", label: "Tous" },
                { key: "square", label: "Carre" },
                { key: "story", label: "Story" },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex-1 text-xs font-semibold rounded-lg py-1.5 transition-all ${
                  filter === f.key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Template grid */}
        <div className="p-3 grid grid-cols-2 gap-2.5 overflow-y-auto flex-1">
          {filteredTemplates.map((t) => {
            const hasCustom =
              prompts[t.id] !== null &&
              prompts[t.id] !== undefined &&
              (prompts[t.id] || "").trim() !== "";
            const isSelected = selectedId === t.id;

            return (
              <button
                key={t.id}
                onClick={() => handleSelectTemplate(t.id)}
                className={`group relative bg-white rounded-xl border overflow-hidden transition-all text-left ${
                  isSelected
                    ? "ring-2 ring-blue-500 border-blue-300"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {/* Thumbnail */}
                <div className="relative aspect-square bg-gray-100">
                  {t.previewUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={t.previewUrl}
                      alt={t.name}
                      className="w-full h-full object-cover rounded-t-xl"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                      Aucune image
                    </div>
                  )}
                  {/* Status dot */}
                  <span
                    className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                      hasCustom ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                  {/* Format badge */}
                  <span className="absolute bottom-1.5 left-1.5 text-[9px] font-semibold bg-black/60 text-white px-1.5 py-0.5 rounded-full capitalize">
                    {t.format}
                  </span>
                </div>
                {/* Name */}
                <div className="px-2 py-1.5">
                  <p className="text-[11px] font-medium text-gray-700 truncate">
                    {t.name}
                  </p>
                </div>
              </button>
            );
          })}

          {filteredTemplates.length === 0 && (
            <div className="col-span-2 py-10 text-center">
              <p className="text-xs text-gray-400">Aucun template</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ Right Panel ═══════════ */}
      <div className="flex-1 overflow-y-auto">
        {!selectedTemplate ? (
          /* No template selected */
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-gray-400" />
              </div>
              <h2 className="text-base font-semibold text-gray-700">
                Selectionnez un template pour commencer
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Choisissez un template dans la liste a gauche
              </p>
            </div>
          </div>
        ) : (
          /* Template selected — editor */
          <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* ── Top: Template + Result side by side ── */}
            <div className="grid grid-cols-2 gap-4">
              {/* Template preview */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-500">
                    Template
                  </span>
                </div>
                <div className="p-4">
                  {selectedTemplate.previewUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={selectedTemplate.previewUrl}
                      alt={selectedTemplate.name}
                      className="w-full rounded-xl object-contain"
                    />
                  ) : (
                    <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center text-gray-300 text-xs">
                      Aucune image
                    </div>
                  )}
                </div>
              </div>

              {/* Test result */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-500">
                    Resultat
                  </span>
                </div>
                <div className="p-4">
                  {testing ? (
                    <div className="aspect-square bg-gray-100 rounded-xl flex flex-col items-center justify-center gap-3 animate-pulse">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                      <span className="text-xs text-gray-400">
                        Generation en cours...
                      </span>
                    </div>
                  ) : testResult ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={`data:${testResult.mimeType};base64,${testResult.imageBase64}`}
                      alt="Test result"
                      className="w-full rounded-xl object-contain"
                    />
                  ) : testError ? (
                    <div className="aspect-square bg-red-50 rounded-xl flex items-center justify-center text-red-500 text-sm text-center px-6">
                      {testError}
                    </div>
                  ) : (
                    <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center text-gray-300 text-xs text-center px-4">
                      Cliquez Tester pour voir le resultat
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Middle: Prompt editor ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Toolbar */}
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 flex-wrap">
                {/* Analyze button */}
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {analyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Analyser avec Claude
                </button>

                {/* Test button */}
                <button
                  onClick={handleTest}
                  disabled={testing || !promptText.trim()}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {testing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Tester
                </button>

                {/* Save button */}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : saveSuccess ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saveSuccess ? "Sauvegarde !" : "Sauvegarder"}
                </button>

                {/* Modified indicator */}
                {isModified && (
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-medium">
                    Non sauvegarde
                  </span>
                )}
              </div>

              {/* Textarea */}
              <div className="p-4">
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Ecrivez votre prompt ici ou cliquez Analyser avec Claude..."
                  className="w-full min-h-[300px] border border-gray-200 rounded-xl p-4 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-300"
                />
              </div>

              {/* Variable helper */}
              <div className="px-4 pb-4">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Variables disponibles
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_VARIABLES.map((v) => (
                    <button
                      key={v.key}
                      onClick={() => handleCopyVariable(v.key)}
                      title={`${v.label} — ex: ${v.example}`}
                      className="relative bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-md text-xs font-mono cursor-pointer transition-colors"
                    >
                      {copiedVar === v.key ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <Check className="w-3 h-3" />
                          Copie !
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Copy className="w-3 h-3 text-gray-400" />
                          {v.key}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
