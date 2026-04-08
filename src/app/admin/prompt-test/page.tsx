"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";

const RATIOS = [
  { value: "1:1", label: "1:1", sub: "Carre" },
  { value: "9:16", label: "9:16", sub: "Story / Reel" },
];

export default function PromptTestPage() {
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

  const [prompt, setPrompt] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("pt_prompt") || "";
  });
  const [ratio, setRatio] = useState("1:1");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ imageBase64: string; mimeType: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Persist prompt
  useEffect(() => {
    localStorage.setItem("pt_prompt", prompt);
  }, [prompt]);

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setResult(null);
    setError(null);
    try {
      const format = ratio === "9:16" ? "story" : "square";
      const res = await fetch("/api/admin/test-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptText: prompt, format }),
      });
      if (!res.ok) {
        const text = await res.text();
        let msg = `Erreur ${res.status}`;
        try { msg = JSON.parse(text).error || msg; } catch { msg = text.slice(0, 300) || msg; }
        setError(msg);
      } else {
        const data = await res.json();
        if (data.imageBase64) {
          setResult({ imageBase64: data.imageBase64, mimeType: data.mimeType });
        } else {
          setError(data.error || "Aucune image generee");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur reseau");
    }
    setGenerating(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleGenerate();
    }
  };

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
        <div className="text-center">
          <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Acces restreint</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">🍌</span>
          <h1 className="text-xl font-bold text-gray-900">Prompt Test</h1>
        </div>
        <p className="text-sm text-gray-500 mb-8">
          Mode brut — ton prompt est envoye tel quel a Gemini. Aucun systeme, aucun wrapper.
          <Link href="/admin/prompt-editor" className="ml-3 text-blue-600 hover:text-blue-700 font-medium">
            Voir les templates →
          </Link>
        </p>

        <div className="grid grid-cols-[1fr_400px] gap-8">
          {/* Left — prompt + config */}
          <div className="space-y-6">
            {/* Prompt */}
            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-sm font-semibold text-gray-800">Prompt</span>
                <span className="text-xs text-gray-400">Ctrl+Enter pour envoyer</span>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ecris ton prompt ici... Il sera envoye tel quel, sans aucune modification."
                className="w-full h-40 border border-gray-200 rounded-xl p-4 text-sm font-mono resize-y bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent placeholder:text-gray-300"
              />
            </div>

            {/* Ratio */}
            <div>
              <span className="text-sm font-semibold text-gray-800 mb-2 block">Ratio</span>
              <div className="grid grid-cols-2 gap-2">
                {RATIOS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRatio(r.value)}
                    className={`py-3 rounded-xl border text-center transition-all ${
                      ratio === r.value
                        ? "border-gray-900 bg-white shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className={`text-sm font-bold ${ratio === r.value ? "text-gray-900" : "text-gray-600"}`}>
                      {r.label}
                    </div>
                    <div className="text-[11px] text-gray-400">{r.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Config line */}
            <div className="text-xs text-gray-400">
              Config : <span className="text-blue-600">{ratio}</span> · {prompt.length} caracteres
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="w-full bg-gray-900 hover:bg-black text-white rounded-2xl py-4 text-sm font-semibold transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>🍌</span>
              )}
              {generating ? "Generation..." : "Generer"}
            </button>
          </div>

          {/* Right — result */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center justify-center min-h-[500px]">
            {generating ? (
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Generation en cours...</p>
              </div>
            ) : result ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={`data:${result.mimeType};base64,${result.imageBase64}`}
                alt="Result"
                className="w-full rounded-xl object-contain"
              />
            ) : error ? (
              <div className="text-center px-6">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            ) : (
              <div className="text-center">
                <span className="text-5xl block mb-3">🍌</span>
                <p className="text-sm font-medium text-gray-400">Mode brut</p>
                <p className="text-xs text-gray-300 mt-1">
                  Ton prompt sera envoye tel quel — aucun prompt systeme ajoute
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
