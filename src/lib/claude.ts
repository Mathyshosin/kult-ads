import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function analyzeWithClaude(scrapedData: unknown): Promise<string> {
  const systemPrompt = `Tu es un expert en marketing digital et analyse de marque.
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
- Sois précis et fidèle aux informations du site`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Données du site web à analyser:\n\n${JSON.stringify(scrapedData, null, 2)}`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  return textBlock ? textBlock.text : "";
}

// ── Brand context builder (used by multiple functions) ──
interface BrandContext {
  brandName: string;
  brandDescription?: string;
  tone?: string;
  targetAudience?: string;
  uniqueSellingPoints?: string[];
  productName: string;
  productDescription: string;
  productFeatures?: string[];
  offerTitle?: string;
  offerDescription?: string;
}

function buildBrandContext(ctx: BrandContext): string {
  const parts = [
    `Brand: "${ctx.brandName}" (EXACT SPELLING — never add accents, change capitalization, or modify this name)`,
    ctx.brandDescription ? `About: ${ctx.brandDescription}` : null,
    ctx.tone ? `Tone: ${ctx.tone}` : null,
    ctx.targetAudience ? `Target audience: ${ctx.targetAudience}` : null,
    ctx.uniqueSellingPoints?.length ? `Key selling points: ${ctx.uniqueSellingPoints.join(" | ")}` : null,
    `Product: "${ctx.productName}" — ${ctx.productDescription}`,
    ctx.productFeatures?.length ? `Product features: ${ctx.productFeatures.join(", ")}` : null,
    ctx.offerTitle ? `Current offer: ${ctx.offerTitle}${ctx.offerDescription ? ` — ${ctx.offerDescription}` : ""}` : null,
  ];
  return parts.filter(Boolean).join("\n");
}

// ── Analyze a template and create an adapted scene description + text ──
export async function describeTemplateScene(
  templateBase64: string,
  templateMimeType: string,
  brandContext: BrandContext,
): Promise<{ scene: string; imageText: string | null; isTextOnly: boolean }> {

  const context = buildBrandContext(brandContext);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: templateMimeType as "image/png" | "image/jpeg" | "image/webp" | "image/gif",
              data: templateBase64,
            },
          },
          {
            type: "text",
            text: `You are a creative director. Look at this ad template and create a NEW ad concept for a completely different brand.

TARGET BRAND:
${context}

STEP 1 — CLASSIFY THE TEMPLATE:
First, determine: does this template contain a PRODUCT PHOTO or PHYSICAL OBJECT as the main visual?

TEXT-ONLY template examples (isTextOnly = true):
- Only text/typography with colored background
- Graphic elements like toggle switches, icons, shapes, patterns — but NO product photo
- Infographic-style with text and abstract visuals
- Bold headline with CTA button, no product imagery

PRODUCT template examples (isTextOnly = false):
- A product (bottle, jar, clothing, food, etc.) is clearly visible as the hero
- A person using/wearing/holding a product
- A lifestyle photo with a physical product in it

STEP 2 — EXTRACT ABSTRACT STRUCTURE:
What is the LAYOUT TYPE? (split screen, centered, full-bleed, flat lay, grid, etc.)
What is the CONCEPT TYPE? (VS/comparison, offer/promo, benefit, lifestyle, showcase, toggle/switch, question/answer)
What is the BACKGROUND TYPE? (solid color, gradient, photo, texture)
What is the MOOD? (energetic, minimal, luxurious, playful, professional)

ABSOLUTE RULES — NEVER VIOLATE:
- NEVER mention ANY product, brand, logo, or object visible in the template
- NEVER copy ANY text, slogan, number, or claim from the template
- NEVER describe specific props from the template

STEP 3 — BUILD THE NEW SCENE:

IF isTextOnly = true (template has NO product photo):
→ Describe a PURELY GRAPHIC/TYPOGRAPHIC scene. NO product photo, NO physical objects, NO people.
→ Use bold typography, graphic elements, shapes, colors as the visual.
→ Recreate the same CONCEPT (toggle, question, statement, comparison) but with "${brandContext.brandName}" content.
→ Example: if template has toggle switches → describe toggle switches with "${brandContext.brandName}" labels. If template is a bold question → describe bold question text about "${brandContext.productName}".

IF isTextOnly = false (template HAS a product photo):
→ Describe a scene featuring "${brandContext.productName}" as the hero product.
→ VS/comparison → "${brandContext.productName}" VS a generic competing product (e.g. "disposable pads")
→ Offer/promo → "${brandContext.productName}" showcased prominently ${brandContext.offerTitle ? `with the offer "${brandContext.offerTitle}"` : "with its key benefit"}
→ Lifestyle → "${brandContext.productName}" used naturally by ${brandContext.targetAudience || "a customer"}
→ Showcase → "${brandContext.productName}" in a clean, professional product photo

STEP 4 — TEXT (if the template has text):
Create NEW French text using ONLY these real facts about "${brandContext.brandName}":
${brandContext.offerTitle ? `- Offer: "${brandContext.offerTitle}"` : "- No offer. Use strongest selling point."}
${brandContext.uniqueSellingPoints?.length ? `- USPs: ${brandContext.uniqueSellingPoints.join(", ")}` : ""}
Brand name spelled EXACTLY: "${brandContext.brandName}"

JSON ONLY (no markdown):
{
  "isTextOnly": true or false,
  "scene": "2-3 sentences in ENGLISH describing the new scene. If isTextOnly=true: describe ONLY graphic/typographic elements, NO product. If isTextOnly=false: describe scene with the product.",
  "imageText": "French headline for the image (max 6 words) using real brand facts. null if template has no text."
}`,
          },
        ],
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  const raw = textBlock?.text || "";

  try {
    const parsed = JSON.parse(raw);
    return {
      scene: parsed.scene || "Product displayed elegantly on a clean surface with professional lighting.",
      imageText: parsed.imageText || null,
      isTextOnly: parsed.isTextOnly === true,
    };
  } catch {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return { scene: parsed.scene || raw, imageText: parsed.imageText || null, isTextOnly: parsed.isTextOnly === true };
      } catch {
        return { scene: raw, imageText: null, isTextOnly: false };
      }
    }
    return { scene: raw, imageText: null, isTextOnly: false };
  }
}

export async function generateAdCopy(
  brandContext: BrandContext,
  format?: string,
  conversionAngle?: string
): Promise<string> {

  const context = buildBrandContext(brandContext);

  const systemPrompt = `Tu es un copywriter senior spécialisé en publicité digitale française à haute conversion.

Règles ABSOLUES :
1. Le texte doit parler UNIQUEMENT de "${brandContext.productName}" par "${brandContext.brandName}".
2. Le nom de marque est "${brandContext.brandName}" — orthographe EXACTE, jamais de modification.
3. Utilise les VRAIS arguments marketing de la marque, pas du blabla générique.
4. Chaque mot doit être spécifique à CE produit et SES vrais bénéfices.

JSON UNIQUEMENT (pas de markdown) :
{
  "headline": "max 8 mots, percutant, spécifique au produit",
  "bodyText": "max 25 mots, argument concret tiré des vrais bénéfices",
  "callToAction": "max 4 mots"
}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `${context}

Format: ${format === "story" ? "Story vertical" : "Post carré"}

DIRECTION CRÉATIVE : ${conversionAngle || "Mets en avant le bénéfice le plus fort."}

Écris un texte publicitaire en français qui utilise les VRAIS arguments de "${brandContext.brandName}", pas des phrases génériques.`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  return textBlock ? textBlock.text : "";
}
