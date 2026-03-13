"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { useWizardStore } from "@/lib/store";

const phases = [
  "Chargement du site...",
  "Analyse IA en cours...",
  "Extraction des données...",
];

export default function AnalyzePage() {
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState(-1);
  const [error, setError] = useState("");
  const brandAnalysis = useWizardStore((s) => s.brandAnalysis);
  const setBrandAnalysis = useWizardStore((s) => s.setBrandAnalysis);
  const router = useRouter();

  const isLoading = phase >= 0;
  const hasExistingAnalysis = brandAnalysis !== null;

  useEffect(() => {
    if (brandAnalysis?.url) {
      setUrl(brandAnalysis.url);
    }
  }, [brandAnalysis]);

  // Normalize URL for comparison
  function normalizeUrl(u: string): string {
    let normalized = u.trim().toLowerCase();
    if (!normalized.startsWith("http")) normalized = "https://" + normalized;
    // Remove trailing slash
    normalized = normalized.replace(/\/+$/, "");
    return normalized;
  }

  // Check if the entered URL matches the existing analysis
  const isSameUrl =
    hasExistingAnalysis &&
    normalizeUrl(url) === normalizeUrl(brandAnalysis.url);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    // If same URL already analyzed, skip API calls and go straight to review
    if (isSameUrl) {
      router.push("/dashboard/review");
      return;
    }

    setError("");
    setPhase(0);

    try {
      const scrapeRes = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!scrapeRes.ok) {
        const data = await scrapeRes.json();
        throw new Error(data.error || "Erreur lors du chargement du site");
      }

      const scrapedData = await scrapeRes.json();
      setPhase(1);

      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scrapedData }),
      });

      if (!analyzeRes.ok) {
        const data = await analyzeRes.json();
        throw new Error(data.error || "Erreur lors de l'analyse");
      }

      const analysis = await analyzeRes.json();
      setPhase(2);

      setBrandAnalysis({ ...analysis, url: url.trim() });

      await new Promise((r) => setTimeout(r, 500));
      router.push("/dashboard/review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setPhase(-1);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Analysez votre site web
        </h1>
        <p className="mt-2 text-muted">
          Entrez l&apos;URL de votre site et notre IA extraira automatiquement
          vos produits, offres et informations de marque.
        </p>
      </div>

      {/* Existing analysis banner */}
      {hasExistingAnalysis && !isLoading && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">
                Analyse déjà effectuée
              </h3>
              <p className="text-sm text-muted mt-1">
                <span className="font-medium text-foreground">
                  {brandAnalysis.brandName}
                </span>{" "}
                — {brandAnalysis.products.length} produit
                {brandAnalysis.products.length > 1 ? "s" : ""},{" "}
                {brandAnalysis.offers.length} offre
                {brandAnalysis.offers.length > 1 ? "s" : ""} détectée
                {brandAnalysis.offers.length > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-muted mt-1">
                {brandAnalysis.url}
              </p>
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => router.push("/dashboard/review")}
                  className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors"
                >
                  Continuer avec ces données
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    /* just scroll down to the form */
                  }}
                  className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Re-analyser
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border p-8">
        <form onSubmit={handleAnalyze} className="space-y-6">
          <div>
            <label
              htmlFor="url"
              className="block text-sm font-medium text-foreground mb-2"
            >
              {hasExistingAnalysis
                ? "Analyser un autre site"
                : "URL de votre site"}
            </label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                id="url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://votre-site.com"
                className="w-full pl-12 pr-4 py-3.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-700">{error}</p>
                <button
                  type="button"
                  onClick={() => setError("")}
                  className="text-xs text-red-500 hover:text-red-700 mt-1"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center py-8 gap-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  {phases[phase]}
                </p>
                <div className="flex justify-center gap-1.5 mt-3">
                  {phases.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i <= phase ? "bg-primary" : "bg-border"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <button
              type="submit"
              className="w-full bg-primary text-white py-3.5 rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              {isSameUrl
                ? "Continuer avec les données existantes"
                : hasExistingAnalysis
                ? "Analyser ce nouveau site"
                : "Analyser le site"}
            </button>
          )}
        </form>
      </div>

      <p className="text-xs text-muted text-center mt-6">
        L&apos;analyse prend généralement entre 10 et 30 secondes selon la
        taille du site.
      </p>
    </div>
  );
}
