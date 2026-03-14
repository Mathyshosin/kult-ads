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
  "products": [{"id":"prod-1","name":"...","description":"...","price":"...","originalPrice":"...","salePrice":"...","features":["..."]}],
  "offers": [{"id":"offer-1","title":"...","description":"...","discountType":"percentage|fixed|freeShipping|other","discountValue":"...","originalPrice":"...","salePrice":"...","productId":"prod-1"}],
  "targetAudience": "string",
  "uniqueSellingPoints": ["string", "string"],
  "competitorProducts": ["string", "string"]
}

Règles:
- Identifie TOUS les produits visibles sur le site
- Identifie TOUTES les offres/promotions en cours
- Si aucune offre n'est trouvée, retourne un tableau vide pour offers
- Pour chaque offre: inclus "originalPrice" (prix barré), "salePrice" (prix promo), et "productId" (l'id du produit concerné, ex: "prod-1"). Si une offre est un pack (ex: "Pack 2+1 offert"), crée une offre distincte avec son propre prix. Exemples: "Pack de 2 culottes" → originalPrice: "59,98€", salePrice: "49,99€", productId: "prod-1". "Pack 3+1 offerte" → originalPrice: "119,96€", salePrice: "89,97€", productId: "prod-1".
- Les IDs doivent être "prod-1", "prod-2", etc. et "offer-1", "offer-2", etc.
- Les couleurs doivent être en format hex
- Sois précis et fidèle aux informations du site
- Pour les prix: "price" = prix affiché principal, "originalPrice" = prix avant réduction (prix barré), "salePrice" = prix après réduction. Si pas de promo, originalPrice et salePrice sont null. UTILISE UNIQUEMENT les prix réels affichés sur le site — JAMAIS de prix inventés.
- Pour competitorProducts: identifie les produits CONCURRENTS / alternatives traditionnelles que cette marque cherche à remplacer. Exemples: si la marque vend des culottes menstruelles → ["tampons", "serviettes hygiéniques", "cups menstruelles"]. Si la marque vend des boissons énergisantes saines → ["Red Bull", "Monster", "sodas sucrés"]. Si la marque vend des compléments bio → ["compléments classiques", "médicaments"]. Déduis-le du positionnement marketing du site.`;

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
  competitorProducts?: string[];
  productName: string;
  productDescription: string;
  productFeatures?: string[];
  productPrice?: string;
  productOriginalPrice?: string;
  productSalePrice?: string;
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
    ctx.competitorProducts?.length ? `Competitor/alternative products this brand replaces: ${ctx.competitorProducts.join(", ")}` : null,
    `Product: "${ctx.productName}" — ${ctx.productDescription}`,
    ctx.productFeatures?.length ? `Product features: ${ctx.productFeatures.join(", ")}` : null,
    ctx.offerTitle ? `Current offer: ${ctx.offerTitle}${ctx.offerDescription ? ` — ${ctx.offerDescription}` : ""}` : null,
    ctx.productPrice ? `Product price: ${ctx.productPrice}` : null,
    ctx.productOriginalPrice && ctx.productSalePrice ? `Price: ${ctx.productOriginalPrice} → ${ctx.productSalePrice} (use these EXACT prices from the website, NEVER invent prices)` : null,
  ];
  return parts.filter(Boolean).join("\n");
}

// ── Template analysis result (detailed layout info for Gemini) ──
export interface TemplateAnalysis {
  scene: string;
  imageText: string | null;
  isTextOnly: boolean;
  templateType: "product-showcase" | "comparison" | "text-only" | "lifestyle";
  templateHasPrices: boolean;
  templateTextCount: number;
  layout: {
    textPosition: string;       // e.g. "top-left", "center", "bottom"
    productPosition: string;    // e.g. "center-right", "bottom-half", "none"
    ctaPosition: string;        // e.g. "bottom-left", "bottom-center", "none"
    ctaStyle: string;           // e.g. "rounded white button", "pill shape dark", "none"
    backgroundStyle: string;    // e.g. "warm peach gradient", "solid white", "photo"
    typographyStyle: string;    // e.g. "bold sans-serif uppercase, dark navy"
    brandLogoPosition: string;  // e.g. "top-right", "bottom-right", "none"
    decorativeElements: string; // e.g. "organic curved shapes", "geometric lines", "none"
    comparisonLayout?: string;  // e.g. "left-bad right-good split 50/50" (only for comparison templates)
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
            text: `You are an elite creative director. Your job: analyze an ad template and produce the EXACT same layout for a different brand. You must be EXTREMELY PRECISE about matching the template's text density — never add content that isn't on the template.

TARGET BRAND:
${context}

━━━ STEP 1: COUNT TEMPLATE TEXT ELEMENTS ━━━
Before ANYTHING else, count EVERY distinct text element visible on the template:
- Headline (big text)
- Subheadline (medium text)
- Body text / description
- Price area (original price, sale price)
- Discount percentage
- CTA button text
- Brand name
- Small text (legal, date, etc.)
- Bullet points / feature list
- Annotations with arrows/lines

Write the count as "templateTextCount". Example: if template has headline + discount % + brand name + small date text = 4 text elements.

Also note: does the template show ANY price (€, $, number with currency)? → "templateHasPrices": true/false
Does the template show bullet points or a feature list? → if no, you MUST NOT create any.

━━━ STEP 2: CLASSIFY ━━━
- "text-only": No product photos, only typography/graphics
- "product-showcase": Shows a product prominently
- "comparison": VS/split layout comparing two things
- "lifestyle": Product in real-life context

━━━ STEP 3: DETAILED LAYOUT EXTRACTION ━━━
Describe with PRECISION:
- textPosition, productPosition, ctaPosition, ctaStyle
- backgroundStyle, typographyStyle, brandLogoPosition, decorativeElements

━━━ STEP 4: CREATE ADAPTED TEXT — STRICT MATCHING ━━━
Replace the template's text for "${brandContext.brandName}".

IRON RULES:
1. You MUST produce EXACTLY the same number of text elements as the template (templateTextCount). Not one more.
2. If the template has: headline + percentage + brand name + date = produce EXACTLY: headline + percentage + brand name + date. Nothing else.
3. NEVER add prices if templateHasPrices is false.
4. NEVER add bullet points or feature lists unless the template has them.
5. NEVER add body text / descriptions unless the template has them.
6. NEVER add annotations with arrows unless the template has them.
7. Keep text SHORT — each element should be roughly the same length as the template's equivalent.

DISCOUNT RULES:
${brandContext.offerTitle ? `- The offer is: "${brandContext.offerTitle}". If the template shows a big percentage, write ONLY the number+% (e.g. "-60%"). The offer name can appear as small text IF the template has small text, but the BIG visible number must be ONLY the percentage.` : "- No offer. Replace any discount area with the brand's strongest selling point in 2-4 words."}
- NEVER use "---" or multiple dashes before a number. Write exactly "-60%" not "---60%".

PRICE RULES:
- ONLY include prices if the template VISUALLY shows a price area AND real prices exist.
${brandContext.productOriginalPrice && brandContext.productSalePrice ? `- Real prices: ${brandContext.productOriginalPrice} → ${brandContext.productSalePrice}` : brandContext.productPrice ? `- Real price: ${brandContext.productPrice}` : "- No prices available. If template has a price area, REMOVE it — leave that space empty or use a short benefit text instead."}
- NEVER invent prices.

BRAND & PRODUCT:
- Brand name EXACTLY: "${brandContext.brandName}"
${brandContext.uniqueSellingPoints?.length ? `- USPs (use only if template has space): ${brandContext.uniqueSellingPoints.slice(0, 2).join(", ")}` : ""}

━━━ STEP 5: SCENE DESCRIPTION ━━━
Describe the visual layout for Gemini to reproduce.

IF COMPARISON: describe split layout with competitor on bad side, brand product on good side.
${brandContext.competitorProducts?.length ? `Competitors: ${brandContext.competitorProducts.join(", ")}.` : ""}

IF PRODUCT SHOWCASE / LIFESTYLE:
- IGNORE the template's product arrangement completely.
- Describe ONLY 1 unit of "${brandContext.productName}" displayed simply and cleanly.
- NEVER describe stacks, multiple units, or arrangements from the template.

JSON ONLY (no markdown):
{
  "isTextOnly": true/false,
  "templateType": "product-showcase" | "comparison" | "text-only" | "lifestyle",
  "templateHasPrices": true/false,
  "templateTextCount": number,
  "scene": "ENGLISH description of the layout. Be specific about positions.",
  "imageText": "ONLY the French text for the image, matching template structure exactly. Use \\n for line breaks. null if no text. MUST have exactly templateTextCount elements.",
  "layout": {
    "textPosition": "...",
    "productPosition": "...",
    "ctaPosition": "...",
    "ctaStyle": "...",
    "backgroundStyle": "...",
    "typographyStyle": "...",
    "brandLogoPosition": "...",
    "decorativeElements": "...",
    "comparisonLayout": "only for comparison templates, null otherwise"
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

  const parseResult = (parsed: Record<string, unknown>): TemplateAnalysis => ({
    scene: (parsed.scene as string) || "Product displayed elegantly on a clean surface with professional lighting.",
    imageText: (parsed.imageText as string) || null,
    isTextOnly: parsed.isTextOnly === true,
    templateType: (parsed.templateType as TemplateAnalysis["templateType"]) || (parsed.isTextOnly ? "text-only" : "product-showcase"),
    templateHasPrices: parsed.templateHasPrices === true,
    templateTextCount: (parsed.templateTextCount as number) || 3,
    layout: { ...defaultLayout, ...(parsed.layout as Record<string, string>) },
  });

  try {
    return parseResult(JSON.parse(raw));
  } catch {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return parseResult(JSON.parse(jsonMatch[0]));
      } catch {
        return { scene: raw, imageText: null, isTextOnly: false, templateType: "product-showcase", templateHasPrices: false, templateTextCount: 3, layout: defaultLayout };
      }
    }
    return { scene: raw, imageText: null, isTextOnly: false, templateType: "product-showcase", templateHasPrices: false, templateTextCount: 3, layout: defaultLayout };
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
