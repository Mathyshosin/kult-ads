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
  "competitorProducts": ["string", "string"],
  "productImageMatches": [{"productId":"prod-1","imageUrl":"https://...","confidence":"high|medium|low"}]
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
- Pour competitorProducts: identifie les produits CONCURRENTS / alternatives traditionnelles que cette marque cherche à remplacer. Exemples: si la marque vend des culottes menstruelles → ["tampons", "serviettes hygiéniques", "cups menstruelles"]. Si la marque vend des boissons énergisantes saines → ["Red Bull", "Monster", "sodas sucrés"]. Si la marque vend des compléments bio → ["compléments classiques", "médicaments"]. Déduis-le du positionnement marketing du site.

IMAGES PRODUIT — RÈGLE IMPORTANTE:
- Dans les données scrapées, tu trouveras un champ "productImages" avec des images extraites du site (URL + alt text + contexte textuel environnant).
- Pour CHAQUE produit identifié, essaie de matcher la MEILLEURE image produit depuis cette liste.
- Utilise le texte "alt", le "context" (texte environnant l'image sur la page) et l'URL pour déterminer quelle image correspond à quel produit.
- Retourne les matches dans "productImageMatches" avec l'URL exacte de l'image (champ "src" de productImages).
- confidence: "high" si le alt/context mentionne clairement le nom du produit, "medium" si c'est probable, "low" si c'est une supposition.
- Choisis UNE SEULE image par produit — la photo où le produit est le MIEUX visible (photo produit packshot/studio > photo avec packaging > lifestyle). Privilégie les images où on voit clairement le produit entier.
- Ignore les images qui sont clairement des bannières, icônes, décorations ou photos d'ambiance sans produit.
- Ne retourne PAS plusieurs images pour un même produit, juste LA meilleure.`;

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
  imageText: string | null;       // DEPRECATED — kept for backward compat
  overlayText: { headline: string; ctaText: string } | null;
  decorativeAction?: string;      // Haiku's decision: "keep" | "remove" | "replace with [X]"
  isTextOnly: boolean;
  templateType: "product-showcase" | "comparison" | "text-only" | "lifestyle";
  templateHasPrices: boolean;
  templateTextCount: number;
  templateHasHumanModel: boolean;    // Does the template show a person/model?
  templateHasProductPhoto: boolean;  // Does the template show a product photo?
  layout: {
    textPosition: string;       // e.g. "top 15% of image, left-aligned with 10% margin"
    productPosition: string;    // e.g. "centered in bottom 55% of image", "none"
    ctaPosition: string;        // e.g. "bottom 10%, centered horizontally", "none"
    ctaStyle: string;           // e.g. "rounded white button", "pill shape dark", "none"
    backgroundStyle: string;    // e.g. "warm peach gradient", "solid white", "photo"
    typographyStyle: string;    // e.g. "bold sans-serif uppercase, dark navy"
    brandLogoPosition: string;  // e.g. "top-right corner, ~5% from edges", "none"
    decorativeElements: string; // e.g. "organic curved shapes", "geometric lines", "none"
    comparisonLayout?: string;  // e.g. "left-bad right-good split 50/50"
    // Typography details
    headlineStyle: string;      // e.g. "72pt bold uppercase sans-serif, white, ~40% image width"
    subheadlineStyle?: string;  // e.g. "24pt regular, light gray, ~30% image width"
    textColor: string;          // e.g. "#FFFFFF" — primary text color
    accentColor?: string;       // e.g. "#FF5733" — discount/CTA/highlight color
    // Proportions
    productSizePercent?: string; // e.g. "product occupies ~45% of image height"
    textAreaPercent?: string;    // e.g. "text zone = top 30% of image"
    margins?: string;            // e.g. "~8% margins on all sides"
  };
}

// ── One-shot template analysis: extract fixed metadata (no brand context needed) ──
export async function analyzeTemplateMetadata(
  templateBase64: string,
  templateMimeType: string,
): Promise<import("@/lib/template-store").TemplateAnalysisData> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
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
            text: `You are analyzing an ad template to extract its FIXED visual properties. This analysis will be stored and reused — it must be accurate and brand-agnostic.

Analyze this template image and extract:

1. TEMPLATE TYPE:
- "text-only": No product photos, no people, only typography/graphics/shapes
- "product-showcase": Shows a product prominently (no person)
- "comparison": VS/split layout comparing two things
- "lifestyle": Product shown with a person or in real-life context

2. TEXT ELEMENTS — Count EVERY distinct text element:
- Headline, subheadline, body text, price area, discount %, CTA button text, brand name, small text (legal/date), bullet points, annotations
- List them as an array: e.g. ["headline", "discount-percentage", "brand-name", "date-text"]

3. TEMPLATE FLAGS:
- templateHasPrices: Does the template show ANY price (€, $, number with currency)?
- templateHasHumanModel: Is there a person/model visible?
- templateHasProductPhoto: Is there a physical product visible?

4. DETAILED LAYOUT (use % of image dimensions):
- textPosition: Where is text? Use % (e.g. "headline at top 10-25%, left-aligned with 8% margin")
- productPosition: Where is the product? (e.g. "centered in bottom 50%", "none")
- productSizePercent: Product size relative to image (e.g. "~45% height, ~35% width")
- ctaPosition + ctaStyle: CTA button position and style
- backgroundStyle: Exact background description
- typographyStyle: General font style
- headlineStyle: Font weight + case + serif/sans + color hex + size as % of image
- subheadlineStyle: Same format, or null
- textColor: Primary text color as hex
- accentColor: Highlight/discount/CTA color as hex, or null
- brandLogoPosition: Where is the logo? Use %
- decorativeElements: Shapes, patterns, or "none"
- comparisonLayout: For comparison templates only (e.g. "left-bad right-good 50/50"), null otherwise
- textAreaPercent: What % of image is text zone
- margins: Approximate margins

JSON ONLY (no markdown):
{
  "isTextOnly": true/false,
  "templateType": "product-showcase" | "comparison" | "text-only" | "lifestyle",
  "templateHasPrices": true/false,
  "templateTextCount": number,
  "templateHasHumanModel": true/false,
  "templateHasProductPhoto": true/false,
  "textElements": ["headline", "discount-percentage", ...],
  "layout": {
    "textPosition": "...",
    "productPosition": "...",
    "ctaPosition": "...",
    "ctaStyle": "...",
    "backgroundStyle": "...",
    "typographyStyle": "...",
    "brandLogoPosition": "...",
    "decorativeElements": "...",
    "comparisonLayout": "... or null",
    "headlineStyle": "...",
    "subheadlineStyle": "... or null",
    "textColor": "#hex",
    "accentColor": "#hex or null",
    "productSizePercent": "... or null",
    "textAreaPercent": "...",
    "margins": "..."
  }
}`,
          },
        ],
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  const raw = textBlock?.text || "";

  const defaultResult: import("@/lib/template-store").TemplateAnalysisData = {
    isTextOnly: false,
    templateType: "product-showcase",
    templateHasPrices: false,
    templateTextCount: 3,
    templateHasHumanModel: false,
    templateHasProductPhoto: true,
    textElements: ["headline", "brand-name"],
    layout: {
      textPosition: "center",
      productPosition: "none",
      ctaPosition: "bottom-center",
      ctaStyle: "rounded button",
      backgroundStyle: "solid color",
      typographyStyle: "bold sans-serif",
      brandLogoPosition: "bottom-right",
      decorativeElements: "none",
      headlineStyle: "bold sans-serif, large",
      textColor: "#000000",
    },
  };

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    return {
      isTextOnly: parsed.isTextOnly === true,
      templateType: parsed.templateType || "product-showcase",
      templateHasPrices: parsed.templateHasPrices === true,
      templateTextCount: (parsed.templateTextCount as number) || 3,
      templateHasHumanModel: parsed.templateHasHumanModel === true,
      templateHasProductPhoto: parsed.templateHasProductPhoto !== false,
      textElements: Array.isArray(parsed.textElements) ? parsed.textElements : ["headline", "brand-name"],
      layout: { ...defaultResult.layout, ...(parsed.layout || {}) },
    };
  } catch {
    console.error("[analyzeTemplateMetadata] Failed to parse Claude response:", raw);
    return defaultResult;
  }
}

// ── Analyze a template and create an adapted scene description + text ──
export async function describeTemplateScene(
  templateBase64: string,
  templateMimeType: string,
  brandContext: BrandContext,
  precomputedAnalysis?: import("@/lib/template-store").TemplateAnalysisData,
): Promise<TemplateAnalysis> {

  const context = buildBrandContext(brandContext);

  // If we have pre-computed metadata, use a SIMPLER prompt — Claude only needs to adapt text
  if (precomputedAnalysis) {
    return describeTemplateSceneWithMetadata(templateBase64, templateMimeType, brandContext, precomputedAnalysis);
  }

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
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

Also note:
- Does the template show ANY price (€, $, number with currency)? → "templateHasPrices": true/false
- Does the template show bullet points or a feature list? → if no, you MUST NOT create any.
- Does the template show a PERSON / human model? → "templateHasHumanModel": true/false
- Does the template show a PRODUCT PHOTO (a physical product)? → "templateHasProductPhoto": true/false
  If the template has NO product photo (just text, shapes, graphics), set to false.

━━━ STEP 2: CLASSIFY ━━━
- "text-only": No product photos, no people, only typography/graphics
- "product-showcase": Shows a product prominently (no person)
- "comparison": VS/split layout comparing two things
- "lifestyle": Product shown with a person or in real-life context

━━━ STEP 3: DETAILED LAYOUT EXTRACTION (USE PERCENTAGES) ━━━
Describe with EXTREME PRECISION using % of image dimensions:
- textPosition: WHERE is text placed? Use % from top/left (e.g. "headline at top 10-25% of image, left-aligned with 8% left margin")
- productPosition: WHERE is the product? (e.g. "centered in bottom 50% of image, occupying ~40% width")
- productSizePercent: How much of the image does the product occupy? (e.g. "~45% of image height, ~35% of image width")
- ctaPosition + ctaStyle: Where is the CTA button and what does it look like?
- backgroundStyle: Exact background description
- typographyStyle: General font style
- headlineStyle: PRECISE headline typography — estimated font weight (bold/extrabold/black), case (uppercase/mixed), serif or sans-serif, color hex, approximate size relative to image (e.g. "~8% of image height")
- subheadlineStyle: Same detail for any subheadline
- textColor: Primary text color as hex (e.g. "#FFFFFF")
- accentColor: Color used for highlights/discounts/CTA (e.g. "#FF5733")
- brandLogoPosition: Where is the logo? Use % (e.g. "top-right, ~5% from top and right edges")
- decorativeElements: Describe the STYLE and ARRANGEMENT of decorative elements (e.g. "small objects arranged in a circle around the product", "scattered elements in corners", "gradient shapes"). Describe the LAYOUT PATTERN, NOT the specific objects — because the objects will be replaced for each brand. Never say "perfume bottles" or "food items" — say "small decorative objects arranged around center" instead.
- textAreaPercent: What % of the image is dedicated to text vs product? (e.g. "text zone = top 35%")
- margins: Approximate margins/padding (e.g. "~8% on all sides")

━━━ STEP 4: CREATE ADAPTED TEXT — STRICT MATCHING ━━━
Replace the template's text for "${brandContext.brandName}".

⚠️ ABSOLUTE RULE — READ THIS FIRST ⚠️
The template is from a COMPLETELY DIFFERENT brand selling a COMPLETELY DIFFERENT product.
You must IGNORE the template's MESSAGE, CONCEPT, and TOPIC entirely.
- If the template talks about NFC, QR codes, reviews, tapping phones → IGNORE ALL OF THAT
- If the template talks about cooking, fitness, skincare → IGNORE ALL OF THAT
- The ONLY thing you copy from the template is its VISUAL STRUCTURE (how many text elements, their sizes, their positions)
- ALL text content must be 100% about "${brandContext.productName}" by "${brandContext.brandName}"
- NEVER copy, reuse, adapt, or translate ANY concept from the template's text

IRON RULES:
1. You MUST produce EXACTLY the same number of text elements as the template (templateTextCount). Not one more.
2. If the template has: headline + percentage + brand name + date = produce EXACTLY: headline + percentage + brand name + date. Nothing else.
3. NEVER add prices if templateHasPrices is false.
4. NEVER add bullet points or feature lists unless the template has them.
5. NEVER add body text / descriptions unless the template has them.
6. NEVER add annotations with arrows unless the template has them.
7. Keep text SHORT — each element should be roughly the same length as the template's equivalent.
8. EVERY text element must be about "${brandContext.productName}" by "${brandContext.brandName}". If the template headline says "WC Japonais" or "Shampoing Bio" — IGNORE it completely and write a headline about "${brandContext.productName}" instead.

DISCOUNT RULES:
${brandContext.offerTitle ? `- The offer is: "${brandContext.offerTitle}". If the template shows a big percentage, write ONLY the number+% (e.g. "-60%"). The offer name can appear as small text IF the template has small text, but the BIG visible number must be ONLY the percentage.` : "- No offer. Replace any discount area with the brand's strongest selling point in 2-4 words."}
- NEVER use "---" or multiple dashes before a number. Write exactly "-60%" not "---60%".

PRICE RULES — THIS IS CRITICAL:
- NEVER include any price, monetary amount, € symbol, "Price:", or number followed by € in imageText UNLESS the template VISUALLY shows a dedicated price area (e.g. "29,99€" or "Prix: XX€").
- If templateHasPrices is false → ZERO prices in imageText. No exceptions.
- Even if templateHasPrices is true, ONLY use real prices if available:
${brandContext.productOriginalPrice && brandContext.productSalePrice ? `  Real prices: ${brandContext.productOriginalPrice} → ${brandContext.productSalePrice}` : brandContext.productPrice ? `  Real price: ${brandContext.productPrice}` : "  No prices available → do NOT show any price. Replace that space with a short benefit or leave empty."}
- NEVER invent prices. NEVER write "Price: XX" or "XX€" with made-up numbers.
- The word "Price" or "Prix" should NEVER appear in imageText unless real prices exist AND templateHasPrices is true.

BRAND & PRODUCT:
- Brand name EXACTLY: "${brandContext.brandName}"
${brandContext.uniqueSellingPoints?.length ? `- USPs (use only if template has space): ${brandContext.uniqueSellingPoints.slice(0, 2).join(", ")}` : ""}

━━━ STEP 5: SCENE DESCRIPTION ━━━
Describe the visual layout for Gemini to reproduce.
CRITICAL: The scene must make sense for "${brandContext.productName}". ABSOLUTELY NEVER include ANY object from the template in your scene description — no perfume bottles, no jars, no cosmetics, no electronics, no food items, no industry-specific props. The template is from a COMPLETELY DIFFERENT brand. Replace ALL template objects with simple, abstract decorative elements relevant to "${brandContext.productName}". The ONLY physical product in the scene is "${brandContext.productName}" itself.

IF COMPARISON: describe split layout adapted to "${brandContext.productName}"'s CATEGORY.
- BAD SIDE: Show a generic product from the SAME CATEGORY as "${brandContext.productName}" — NOT the template's product. The template may show a drink can, a shampoo bottle, etc. — IGNORE those objects. Instead, show the typical inferior alternative in "${brandContext.productName}"'s actual product category.
- GOOD SIDE: Show "${brandContext.productName}" from the PRODUCT reference photo.
- CRITICAL: The bad side must make sense for this brand's industry. If "${brandContext.productName}" is underwear, show old uncomfortable underwear — NOT a crushed can.
${brandContext.competitorProducts?.length ? `Competitors in this category: ${brandContext.competitorProducts.join(", ")}.` : ""}

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
  "templateHasHumanModel": true/false,
  "templateHasProductPhoto": true/false,
  "scene": "ENGLISH description of the layout with PRECISE % positions. Be extremely specific.",
  "imageText": "Text for the image in the brand's language, matching template structure exactly. Use \\n for line breaks. null if no text. MUST have exactly templateTextCount elements.",
  "layout": {
    "textPosition": "use % from top/left edges",
    "productPosition": "use % of image, or 'none'",
    "ctaPosition": "use % position",
    "ctaStyle": "shape + color + text style",
    "backgroundStyle": "exact description",
    "typographyStyle": "general font family + weight",
    "brandLogoPosition": "use % from edges",
    "decorativeElements": "shapes, patterns, or 'none'",
    "comparisonLayout": "only for comparison templates, null otherwise",
    "headlineStyle": "weight + case + serif/sans + color hex + size as % of image height",
    "subheadlineStyle": "same format, or null",
    "textColor": "#hex of primary text",
    "accentColor": "#hex of accent/highlight color, or null",
    "productSizePercent": "e.g. '~45% height, ~35% width'",
    "textAreaPercent": "e.g. 'top 30% of image'",
    "margins": "e.g. '~8% all sides'"
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
    headlineStyle: "bold sans-serif, large",
    textColor: "#000000",
  };

  const parseResult = (parsed: Record<string, unknown>): TemplateAnalysis => ({
    scene: (parsed.scene as string) || "Product displayed elegantly on a clean surface with professional lighting.",
    imageText: (parsed.imageText as string) || null,
    overlayText: null,
    isTextOnly: parsed.isTextOnly === true,
    templateType: (parsed.templateType as TemplateAnalysis["templateType"]) || (parsed.isTextOnly ? "text-only" : "product-showcase"),
    templateHasPrices: parsed.templateHasPrices === true,
    templateTextCount: (parsed.templateTextCount as number) || 3,
    templateHasHumanModel: parsed.templateHasHumanModel === true,
    templateHasProductPhoto: parsed.templateHasProductPhoto !== false, // default true for safety
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
        return { scene: raw, imageText: null, overlayText: null, isTextOnly: false, templateType: "product-showcase", templateHasPrices: false, templateTextCount: 3, templateHasHumanModel: false, templateHasProductPhoto: true, layout: defaultLayout };
      }
    }
    return { scene: raw, imageText: null, overlayText: null, isTextOnly: false, templateType: "product-showcase", templateHasPrices: false, templateTextCount: 3, templateHasHumanModel: false, templateHasProductPhoto: true, layout: defaultLayout };
  }
}

// ── Faster adaptation when pre-computed metadata exists (uses Haiku for speed) ──
async function describeTemplateSceneWithMetadata(
  templateBase64: string,
  templateMimeType: string,
  brandContext: BrandContext,
  meta: import("@/lib/template-store").TemplateAnalysisData,
): Promise<TemplateAnalysis> {
  const context = buildBrandContext(brandContext);

  // DO NOT send template image to Haiku — it causes text contamination.
  // Haiku copies template words ("Gummies", "BLACK FRIDAY", etc.) despite instructions.
  // Haiku only needs the metadata. Gemini gets the template image separately for visual quality.

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `You are an elite creative director. Create ad text and scene direction for "${brandContext.brandName}" selling "${brandContext.productName}".
You work from METADATA ONLY — you do NOT see the template.

TARGET BRAND:
${context}

TEMPLATE: ${meta.templateType} layout.
${meta.templateType === "comparison" ? `COMPARISON: BAD SIDE = generic inferior alternative in "${brandContext.productName}"'s category. GOOD SIDE = "${brandContext.productName}".` : ""}

YOUR TASKS:
1. headline: 2-5 punchy words about "${brandContext.productName}". In the brand's language. Pick the ONE strongest benefit.
2. ctaText: 1-3 word CTA (e.g. "Découvrir", "J'en profite", "Shop Now").
3. scene: Brief description of what the image should look like (2-3 sentences). The background must be clean and uncluttered — no scattered decorative objects (no flowers, leaves, cotton, branches). Just a simple, elegant background with the product.

RULES:
- NEVER invent statistics, numbers, or customer counts.
- NEVER reference the template's content. Write ONLY about "${brandContext.productName}".
- Use the brand's language for headline and CTA.
- Scene must be in English, modern, minimalist, premium aesthetic with CLEAN background.
${meta.templateType === "comparison" ? `- BAD SIDE: generic inferior alternative. GOOD SIDE: "${brandContext.productName}" from the product reference.` : ""}

JSON ONLY:
{
  "scene": "SHORT English description with clean background",
  "overlayText": { "headline": "2-5 words in brand language", "ctaText": "1-3 words" }
}`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  const raw = textBlock?.text || "";

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);

    const overlayText = parsed.overlayText
      ? { headline: String(parsed.overlayText.headline || ""), ctaText: String(parsed.overlayText.ctaText || "Découvrir") }
      : null;

    return {
      scene: (parsed.scene as string) || "Product displayed elegantly on a clean surface.",
      imageText: null,
      overlayText,
      decorativeAction: undefined,
      isTextOnly: meta.isTextOnly,
      templateType: meta.templateType,
      templateHasPrices: meta.templateHasPrices,
      templateTextCount: meta.templateTextCount,
      templateHasHumanModel: meta.templateHasHumanModel,
      templateHasProductPhoto: meta.templateHasProductPhoto,
      layout: meta.layout,
    };
  } catch {
    console.error("[describeTemplateSceneWithMetadata] Failed to parse:", raw);
    return {
      scene: raw || "Product on clean surface with professional lighting.",
      imageText: null,
      overlayText: null,
      isTextOnly: meta.isTextOnly,
      templateType: meta.templateType,
      templateHasPrices: meta.templateHasPrices,
      templateTextCount: meta.templateTextCount,
      templateHasHumanModel: meta.templateHasHumanModel,
      templateHasProductPhoto: meta.templateHasProductPhoto,
      layout: meta.layout,
    };
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
    model: "claude-haiku-4-5-20251001",
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

// ── Analyze template and generate a tailored Gemini prompt ──
export async function generateTemplatePrompt(
  templateBase64: string,
  templateMimeType: string,
): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-opus-4-20250514",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: templateMimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp", data: templateBase64 },
          },
          {
            type: "text",
            text: `You are a creative director writing a Gemini image generation prompt.

Analyze this ad template and write a PRECISE Gemini prompt that would reproduce an ad with the exact same visual structure, layout, and marketing technique — but for a completely different brand.

YOUR TASK:
1. Identify the marketing technique (comparison, social proof, discount, benefit showcase, etc.)
2. Describe the EXACT layout: positions, sizes, zones, background style, typography hierarchy
3. Write a complete Gemini prompt using {{variable}} placeholders for brand-specific data

AVAILABLE VARIABLES:
- {{brandName}}: Brand name (exact spelling)
- {{productName}}: Product name
- {{productDescription}}: Product description
- {{offer}}: Offer title (e.g. "Vente Privee -60%")
- {{offerDescription}}: Offer details
- {{price}}: Product price
- {{originalPrice}}: Original price (crossed out)
- {{salePrice}}: Sale price
- {{usp}}: Key selling points separated by " | "
- {{targetAudience}}: Target audience
- {{tone}}: Communication tone
- {{competitorProducts}}: Competitor products

RULES FOR THE PROMPT:
- Be extremely specific about positions (top, center, bottom, left, right, percentages)
- Describe colors, typography sizes, and visual hierarchy precisely
- Include "Use the product photo exactly as provided — no modifications"
- Include "All text in French"
- Include "No logo"
- If the template shows prices, use {{price}} / {{originalPrice}} / {{salePrice}} — but add: "Only show price if a value is provided, otherwise omit it"
- NEVER reference the original brand or product in the template
- The prompt must work for ANY brand/product

OUTPUT: Return ONLY the Gemini prompt text. No explanations, no markdown, no code blocks.`,
          },
        ],
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  return textBlock?.text || "";
}
