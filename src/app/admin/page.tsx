"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Bot, Sparkles, Image, FileText, Cpu } from "lucide-react";

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
    model: "Claude Sonnet 4 (claude-sonnet-4-20250514)",
    icon: <Bot className="w-4 h-4" />,
    description: "Analyse les données scrappées d'un site web et extrait marque, produits, offres, ton, couleurs, etc.",
    systemPrompt: `Tu es un expert en marketing digital et analyse de marque.
Analyse les données suivantes extraites d'un site web et retourne un JSON structuré.
Réponds UNIQUEMENT avec du JSON valide, sans markdown, sans backticks, sans explication.

Le JSON doit suivre exactement cette structure:
{
  "brandName": "string",
  "brandDescription": "string (2-3 phrases décrivant la marque)",
  "tone": "string (un parmi: professionnel, fun, luxe, minimaliste, audacieux, chaleureux)",
  "colors": ["#hex1", "#hex2"],
  "products": [{"id":"prod-1","name":"...","description":"...","price":"...","features":["..."]}],
  "offers": [{"id":"offer-1","title":"...","description":"...","discountType":"percentage|fixed|freeShipping|other","discountValue":"..."}],
  "targetAudience": "string",
  "uniqueSellingPoints": ["string", "string"]
}

Règles:
- Identifie TOUS les produits visibles sur le site
- Identifie TOUTES les offres/promotions en cours
- Si aucune offre n'est trouvée, retourne un tableau vide pour offers
- Les IDs doivent être "prod-1", "prod-2", etc. et "offer-1", "offer-2", etc.
- Les couleurs doivent être en format hex
- Sois précis et fidèle aux informations du site`,
    userPromptTemplate: `Données du site web à analyser:

{scrapedData}`,
  },
  {
    id: "concepts",
    title: "Génération de concepts d'ads",
    model: "Claude Sonnet 4 (claude-sonnet-4-20250514)",
    icon: <Sparkles className="w-4 h-4" />,
    description: "Génère des concepts publicitaires stratégiques adaptés au produit. Chaque concept inclut un type d'ad, un prompt de scène pour Gemini, et un angle de copywriting.",
    systemPrompt: `Tu es un directeur artistique expert en publicités statiques pour Instagram/Facebook/TikTok.

CONTEXTE : Gemini reçoit la photo du produit + un template de style. Il crée une image publicitaire COMPLÈTE avec le produit intégré. Le texte est ajouté en CSS par-dessus.

RÈGLES :
1. scenePrompt en ANGLAIS, COURT (2-3 phrases MAX)
2. Le produit est fourni en photo — Gemini l'intègre TEL QUEL
3. Chaque concept = un adType DIFFÉRENT et une scène DIFFÉRENTE
4. RÈGLE PERSONNES : Si une personne apparaît dans la scène, elle DOIT soit TENIR le produit en main, soit le PORTER sur elle. Jamais une personne à côté du produit sans interaction directe.

TYPES D'ADS :
- "offre" : promo/réduction
- "bénéfice" : avantage clé du produit
- "comparaison" : VS alternative
- "témoignage" : preuve sociale
- "lifestyle" : produit dans la vraie vie
- "premium" : luxe, haut de gamme
- "urgence" : stock limité

JSON UNIQUEMENT :
{
  "concepts": [
    {
      "id": "concept-1",
      "adType": "string",
      "scenePrompt": "string (ANGLAIS, 2-3 phrases)",
      "copyAngle": "string (FRANÇAIS)"
    }
  ]
}`,
    userPromptTemplate: `Marque : {brandName}
Description : {brandDescription}
Ton : {tone}
Couleurs : {colors}
Produit : {productName} — {productDescription}
Audience : {targetAudience}
Points forts : {uniqueSellingPoints}
{offer}
{customDirection}
{existingAdTypes}

Génère {count} concepts DIFFÉRENTS pour ce produit.`,
  },
  {
    id: "copy",
    title: "Copywriting publicitaire",
    model: "Claude Sonnet 4 (claude-sonnet-4-20250514)",
    icon: <FileText className="w-4 h-4" />,
    description: "Génère le texte publicitaire (headline, body, CTA) en français, optimisé pour la conversion.",
    systemPrompt: `Tu es un copywriter expert en publicité digitale française, spécialisé dans les ads à haute conversion.
Génère du texte publicitaire percutant et optimisé pour la conversion.
Réponds UNIQUEMENT avec du JSON valide, sans markdown, sans backticks.

Le JSON doit suivre cette structure:
{
  "headline": "string (max 8 mots, percutant, accrocheur, qui stoppe le scroll)",
  "bodyText": "string (max 25 mots, persuasif, qui donne envie d'acheter)",
  "callToAction": "string (max 4 mots, action claire et urgente)"
}

Règles de copywriting:
- Le headline doit créer une émotion immédiate (curiosité, désir, urgence)
- Le bodyText doit donner UNE raison concrète d'acheter MAINTENANT
- Le CTA doit pousser à l'action immédiate
- Utilise des mots puissants : exclusif, gratuit, immédiat, limité, secret, nouveau
- Adapte le ton à la marque mais garde toujours l'intention de conversion`,
    userPromptTemplate: `Marque: {brandName}
Ton: {tone}
Produit: {productName} - {productDescription}
{offer}
Format: {format}

ANGLE DE CONVERSION À UTILISER:
{conversionAngle}

IMPORTANT: Le texte doit être DIFFÉRENT et UNIQUE. Pas de formules génériques. Adapte-toi spécifiquement à ce produit et cet angle.

Génère le texte publicitaire en français.`,
  },
  {
    id: "gemini",
    title: "Génération d'image (scène complète)",
    model: "Gemini 2.5 Flash Image (gemini-2.5-flash-image)",
    icon: <Image className="w-4 h-4" />,
    description: "Génère l'image publicitaire complète. Reçoit la photo produit + un template de style en référence. Crée une scène photorealistic avec le produit intégré.",
    systemPrompt: `(Pas de system prompt — Gemini utilise un prompt direct avec images de référence)

Images de référence envoyées :
1. [STYLE REFERENCE] — Un template de la bibliothèque (style, layout, qualité)
2. [PRODUCT PHOTO] — La photo du produit à intégrer dans la scène`,
    userPromptTemplate: `Create a professional advertising image for "{brandName}".

{scenePrompt}

Use the PRODUCT PHOTO and place it naturally in the scene. Keep the product EXACTLY as shown — do not modify, redesign, or add anything to it.
Match the style, quality and layout of the STYLE REFERENCE.
Brand colors: {colors}.
Photorealistic. NO text or letters. Aspect ratio: {aspectRatio}.`,
  },
  {
    id: "gemini-config",
    title: "Configuration Gemini",
    model: "Gemini 2.5 Flash Image",
    icon: <Cpu className="w-4 h-4" />,
    description: "Paramètres techniques de l'appel Gemini : modèle, retry, backoff.",
    systemPrompt: `Modèle : gemini-2.5-flash-image
Response modalities : ["IMAGE", "TEXT"]
Max retries : 3
Backoff : exponentiel (1s, 2s, 3s)

L'image est envoyée en tant que inlineData (base64) dans le champ contents.
Les images de référence sont ajoutées avec un label textuel avant chaque image.`,
    userPromptTemplate: `(Voir le prompt de génération d'image ci-dessus)`,
  },
];

function PromptBlock({ prompt }: { prompt: PromptSection }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary flex-shrink-0">
          {prompt.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{prompt.title}</h3>
          <p className="text-[11px] text-muted truncate">{prompt.model}</p>
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-muted flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted flex-shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4">
          <p className="text-xs text-muted">{prompt.description}</p>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                System Prompt
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(prompt.systemPrompt)}
                className="text-[10px] text-muted hover:text-foreground transition-colors"
              >
                Copier
              </button>
            </div>
            <pre className="bg-gray-900 text-green-400 text-[11px] p-4 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono max-h-[400px] overflow-y-auto">
              {prompt.systemPrompt}
            </pre>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">
                User Prompt (template)
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(prompt.userPromptTemplate)}
                className="text-[10px] text-muted hover:text-foreground transition-colors"
              >
                Copier
              </button>
            </div>
            <pre className="bg-gray-900 text-amber-300 text-[11px] p-4 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono max-h-[300px] overflow-y-auto">
              {prompt.userPromptTemplate}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin — Prompts IA</h1>
          <p className="text-sm text-muted mt-1">
            Tous les prompts utilisés par Claude et Gemini dans Kult-ads.
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-purple-100 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <span className="text-xs font-semibold text-foreground">Claude Sonnet 4</span>
            </div>
            <p className="text-[11px] text-muted">3 prompts : analyse de marque, concepts d&apos;ads, copywriting</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
                <Image className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-foreground">Gemini 2.5 Flash</span>
            </div>
            <p className="text-[11px] text-muted">1 prompt : génération d&apos;image avec photo produit + template</p>
          </div>
        </div>

        {/* Prompts */}
        <div className="space-y-3">
          {PROMPTS.map((p) => (
            <PromptBlock key={p.id} prompt={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
