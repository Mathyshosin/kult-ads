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
): Promise<{ scene: string; imageText: string | null }> {

  const context = buildBrandContext(brandContext);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 600,
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
            text: `You are a senior creative director at a top advertising agency. Analyze this ad template and create instructions to produce a SIMILAR but ADAPTED ad for a completely different brand and product.

BRAND & PRODUCT CONTEXT:
${context}

YOUR TASKS:

1. UNDERSTAND THE TEMPLATE'S CONCEPT — what TYPE of ad is this?
   - Is it a VS/comparison ad? (product vs competitor)
   - Is it a lifestyle shot? (product in real life)
   - Is it an offer/promo ad? (discount, free shipping)
   - Is it a benefit-focused ad? (highlighting a feature)
   - Is it a social proof ad? (testimonials, numbers)
   - Is it a product showcase? (flat lay, studio shot)

2. ADAPT THE CONCEPT INTELLIGENTLY for "${brandContext.productName}":
   - VS/comparison: pick a REAL competing product that makes sense. E.g. for menstrual underwear → "culotte menstruelle VS serviette hygiénique". For reusable water bottle → "gourde VS bouteille plastique". The competitor must be an actual alternative people use.
   - Lifestyle: show the product being used naturally by the target audience (${brandContext.targetAudience || "the customer"}).
   - Offer/promo: if there's an offer, use it. Otherwise use the strongest selling point.
   - Benefit: pick the most compelling feature from: ${brandContext.uniqueSellingPoints?.join(", ") || brandContext.productDescription}
   - Social proof: use real-sounding numbers and claims based on the brand.

3. TEXT ON THE IMAGE:
   - If the template has prominent text, create adapted French text for "${brandContext.brandName}".
   - The brand name must be spelled EXACTLY: "${brandContext.brandName}" (no modifications).
   - Use the REAL offer, features, or selling points — not generic marketing fluff.
   ${brandContext.offerTitle ? `- Use this real offer: "${brandContext.offerTitle}"` : "- No offer available. Use the strongest selling point."}

Respond in JSON ONLY (no markdown, no backticks):
{
  "scene": "2-3 sentences in ENGLISH. Describe the adapted scene for an image generator. Be very specific about: background, lighting, product placement, props, composition. The scene must make total sense for ${brandContext.productName}.",
  "imageText": "French text for ON the image (max 8 words). Use brand name exactly as '${brandContext.brandName}'. null if template has no text."
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
    };
  } catch {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return { scene: parsed.scene || raw, imageText: parsed.imageText || null };
      } catch {
        return { scene: raw, imageText: null };
      }
    }
    return { scene: raw, imageText: null };
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
