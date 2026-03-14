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

// ── Template analysis result (detailed layout info for Gemini) ──
export interface TemplateAnalysis {
  scene: string;
  imageText: string | null;
  isTextOnly: boolean;
  layout: {
    textPosition: string;       // e.g. "top-left", "center", "bottom"
    productPosition: string;    // e.g. "center-right", "bottom-half", "none"
    ctaPosition: string;        // e.g. "bottom-left", "bottom-center", "none"
    ctaStyle: string;           // e.g. "rounded white button", "pill shape dark", "none"
    backgroundStyle: string;    // e.g. "warm peach gradient", "solid white", "photo"
    typographyStyle: string;    // e.g. "bold sans-serif uppercase, dark navy"
    brandLogoPosition: string;  // e.g. "top-right", "bottom-right", "none"
    decorativeElements: string; // e.g. "organic curved shapes", "geometric lines", "none"
  };
}

// ── Analyze a template and create an adapted scene description + text ──
export async function describeTemplateScene(
  templateBase64: string,
  templateMimeType: string,
  brandContext: BrandContext,
): Promise<TemplateAnalysis> {

  const context = buildBrandContext(brandContext);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1200,
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
            text: `You are a creative director specialized in reproducing ad layouts pixel-perfectly for different brands.

Analyze this ad template in EXTREME detail. The goal is to reproduce its EXACT layout, spacing, typography, and visual structure — only swapping the brand content.

TARGET BRAND:
${context}

━━━ STEP 1: CLASSIFY ━━━
Is this a TEXT-ONLY template (no product photo) or a PRODUCT template (product visible)?

━━━ STEP 2: DETAILED LAYOUT EXTRACTION ━━━
Describe with PRECISION:
- textPosition: Where is the main text block? (e.g. "top-left occupying 60% width", "centered top third")
- productPosition: Where is the product? (e.g. "center-right, 40% of image", "none" if text-only)
- ctaPosition: Where is the CTA button? (e.g. "bottom-left", "none")
- ctaStyle: Describe CTA appearance (e.g. "white rounded-full pill button with dark text", "none")
- backgroundStyle: Describe EXACTLY (e.g. "warm peach/beige gradient with organic curved shapes in lighter tones")
- typographyStyle: Font style and color (e.g. "bold uppercase sans-serif, dark navy #1a1a3e, headline very large, subtext medium regular")
- brandLogoPosition: Where is the brand name/logo? (e.g. "center below headline, medium serif font")
- decorativeElements: Any shapes, curves, lines, patterns (e.g. "organic wave shapes in lighter beige behind text area")

━━━ STEP 3: CREATE ADAPTED CONTENT ━━━
Replace the template's text with NEW French text for "${brandContext.brandName}":
- Use ONLY real facts about the brand
${brandContext.offerTitle ? `- Current offer: "${brandContext.offerTitle}"${brandContext.offerDescription ? ` — ${brandContext.offerDescription}` : ""}` : "- No offer available. Use the strongest selling point."}
${brandContext.uniqueSellingPoints?.length ? `- USPs: ${brandContext.uniqueSellingPoints.join(", ")}` : ""}
- Brand name EXACTLY: "${brandContext.brandName}"

CRITICAL RULE FOR DISCOUNTS/PERCENTAGES:
- If the template shows a percentage (e.g. "-10%", "-20%"), you MUST replace it with the REAL offer value from the brand.
${brandContext.offerTitle ? `- The REAL discount is: "${brandContext.offerTitle}". Use this EXACT value, not the template's percentage.` : "- There is NO discount/offer. Remove any percentage from the text and replace with a key selling point."}
- NEVER keep the template's original percentage — it belongs to a different brand.

RULES:
- NEVER copy text from the template
- NEVER mention the template's original brand or products
- Keep the SAME text structure (if template has 3 question lines + subtext + CTA, create 3 question lines + subtext + CTA)

━━━ STEP 4: SCENE DESCRIPTION ━━━
Write a scene description that RECREATES the template's exact visual structure for "${brandContext.brandName}".
Be extremely specific about positions, sizes, and proportions.

JSON ONLY (no markdown):
{
  "isTextOnly": true/false,
  "scene": "Detailed ENGLISH description recreating the EXACT layout with brand-adapted content. Be very specific about element positions and proportions.",
  "imageText": "The COMPLETE French text to display on the image, with line breaks as \\n. Include headline, subtext, brand name, and CTA text — matching the template's text structure. null if no text.",
  "layout": {
    "textPosition": "...",
    "productPosition": "...",
    "ctaPosition": "...",
    "ctaStyle": "...",
    "backgroundStyle": "...",
    "typographyStyle": "...",
    "brandLogoPosition": "...",
    "decorativeElements": "..."
  }
}`,
          },
        ],
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  const raw = textBlock?.text || "";

  const defaultLayout = {
    textPosition: "center",
    productPosition: "none",
    ctaPosition: "bottom-center",
    ctaStyle: "rounded button",
    backgroundStyle: "solid color",
    typographyStyle: "bold sans-serif",
    brandLogoPosition: "bottom-right",
    decorativeElements: "none",
  };

  try {
    const parsed = JSON.parse(raw);
    return {
      scene: parsed.scene || "Product displayed elegantly on a clean surface with professional lighting.",
      imageText: parsed.imageText || null,
      isTextOnly: parsed.isTextOnly === true,
      layout: { ...defaultLayout, ...parsed.layout },
    };
  } catch {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          scene: parsed.scene || raw,
          imageText: parsed.imageText || null,
          isTextOnly: parsed.isTextOnly === true,
          layout: { ...defaultLayout, ...parsed.layout },
        };
      } catch {
        return { scene: raw, imageText: null, isTextOnly: false, layout: defaultLayout };
      }
    }
    return { scene: raw, imageText: null, isTextOnly: false, layout: defaultLayout };
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
