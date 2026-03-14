"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Bot, Image, FileText, Cpu } from "lucide-react";

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
    id: "gemini-library",
    title: "Gemini — Mode Bibliothèque",
    model: "Gemini 2.5 Flash Image (gemini-2.5-flash-image)",
    icon: <Image className="w-4 h-4" />,
    description: "L'utilisateur choisit un template de la bibliothèque. Gemini réplique le style du template en intégrant le produit et les couleurs de la marque.",
    systemPrompt: `(Pas de system prompt — Gemini utilise un prompt direct avec images de référence)

Images de référence envoyées :
1. [STYLE REFERENCE] — "replicate this exact ad style, composition and professional quality"
2. [PRODUCT] — "this is the exact product to feature. Do NOT modify it."`,
    userPromptTemplate: `High-end {aspectRatio} advertising photo for "{brandName}".

Replicate the STYLE REFERENCE exactly — same composition, layout, lighting, and professional quality — but adapted for this brand and product.

Rules:
- The PRODUCT is the hero. Feature it prominently, it must be the clear focal point.
- Keep the product IDENTICAL to the PRODUCT reference — same packaging, colors, shape. Do NOT redesign, add ribbons, change labels, or alter it.
- Copy the STYLE REFERENCE composition, lighting style, and professional quality as closely as possible.
- If a person appears in the scene, they MUST be holding or wearing the product. Never a person next to the product without direct interaction.
- Leave breathing room in the image (top or bottom third) for text overlay later.
- Color palette: {colors}.
- Photorealistic, shot on professional camera, shallow depth of field on background.
- Absolutely NO text, words, letters, numbers, watermarks, or UI elements.`,
  },
  {
    id: "gemini-custom",
    title: "Gemini — Mode Personnalisé",
    model: "Gemini 2.5 Flash Image (gemini-2.5-flash-image)",
    icon: <Image className="w-4 h-4" />,
    description: "L'utilisateur écrit sa propre description de scène. Gemini génère l'image à partir de cette description en intégrant le produit.",
    systemPrompt: `(Pas de system prompt — Gemini utilise un prompt direct avec image produit)

Image de référence envoyée :
1. [PRODUCT] — "this is the exact product to feature. Do NOT modify it."`,
    userPromptTemplate: `High-end {aspectRatio} advertising photo for "{brandName}".

{customPrompt}

Rules:
- The PRODUCT is the hero. Feature it prominently, it must be the clear focal point.
- Keep the product IDENTICAL to the PRODUCT reference — same packaging, colors, shape. Do NOT redesign, add ribbons, change labels, or alter it.
- If a person appears in the scene, they MUST be holding or wearing the product. Never a person next to the product without direct interaction.
- Photorealistic, shot on professional camera, shallow depth of field on background.
- Leave breathing room in the image (top or bottom third) for text overlay later.
- Absolutely NO text, words, letters, numbers, watermarks, or UI elements.`,
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
    userPromptTemplate: `(Voir les prompts de génération d'image ci-dessus)`,
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
            <p className="text-[11px] text-muted">2 prompts : analyse de marque, copywriting</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
                <Image className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-foreground">Gemini 2.5 Flash</span>
            </div>
            <p className="text-[11px] text-muted">2 modes : bibliothèque (template) ou personnalisé (prompt libre)</p>
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
