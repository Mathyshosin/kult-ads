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
            text: `You are a creative director specialized in reproducing ad layouts pixel-perfectly for different brands.

Analyze this ad template in EXTREME detail. The goal is to reproduce its EXACT layout, spacing, typography, and visual structure — only swapping the brand content.

TARGET BRAND:
${context}

━━━ STEP 1: CLASSIFY ━━━
Determine the template type:
- "text-only": No product photos, only typography/graphics
- "product-showcase": Shows a product prominently (single product focus)
- "comparison": Shows a VS/comparison between two things (e.g. left side = bad/old product, right side = good/brand product). Look for split layouts, before/after, pros/cons columns, or any "X vs Y" structure.
- "lifestyle": Shows a product in a real-life context/scene

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

CRITICAL CONTENT RULES:
1. MATCH THE TEMPLATE'S TEXT DENSITY: If the template has only a headline + brand name + CTA, write ONLY a headline + brand name + CTA. Do NOT add extra text, bullet points, feature lists, or descriptions that the template doesn't have.
2. NEVER add prices unless the template VISUALLY shows a price area. If the template has no price displayed, do NOT add any price.
3. NEVER list product features/benefits as bullet points unless the template explicitly has a bullet point section.
4. Keep the text SHORT and IMPACTFUL — match the exact amount of text visible on the template, no more.

CRITICAL RULE FOR DISCOUNTS/PERCENTAGES:
- If the template shows a large percentage number (e.g. "-10%", "-20%"), replace it with ONLY the numeric discount value: just the number and % sign (e.g. "-60%"), NOT the offer name/title.
${brandContext.offerTitle ? `- The REAL discount value is: "${brandContext.offerTitle}". Extract ONLY the percentage or numeric value from this. For example if the offer is "Vente privée -60%", write ONLY "-60%" on the image where the template had its percentage — NOT "Vente privée -60%".` : "- There is NO discount/offer. Remove any percentage from the text and replace with a key selling point."}
- NEVER keep the template's original percentage — it belongs to a different brand.
- The offer NAME (e.g. "Vente privée", "Soldes") can appear elsewhere in smaller text, but the BIG number must be ONLY the percentage.

RULES:
- NEVER copy text from the template
- NEVER mention the template's original brand or products
- Keep the SAME text structure (if template has 3 question lines + subtext + CTA, create 3 question lines + subtext + CTA)
- If the template shows prices (original/sale price), use ONLY the REAL prices from the brand context above. NEVER invent or estimate prices. If no price is available, DO NOT show any price at all — leave it out completely.
- NEVER add more text than what the template shows. Count the text elements on the template and produce the SAME number.

━━━ STEP 4: SCENE DESCRIPTION ━━━
Write a scene description that uses the template's VISUAL STYLE (background, colors, typography, decorative elements) for "${brandContext.brandName}".

IF COMPARISON TEMPLATE:
- This is a VS/comparison ad. One side shows a BAD/OLD alternative, the other shows the GOOD brand product.
- For the BAD side: use a GENERIC competitor product relevant to "${brandContext.productName}".
${brandContext.competitorProducts?.length ? `  Competitors to show: ${brandContext.competitorProducts.join(", ")}. Pick the most visually recognizable one.` : `  Think about what "${brandContext.productName}" replaces and show that generic product.`}
- For the GOOD side: show "${brandContext.productName}" by "${brandContext.brandName}".
- Adapt the comparison text: the BAD side gets negative stats about the competitor, the GOOD side gets positive stats about "${brandContext.productName}".
- Include "comparisonLayout" in layout (e.g. "left-bad right-good split 50/50").

IF PRODUCT SHOWCASE / LIFESTYLE:
- COMPLETELY IGNORE how products are arranged in the template. Do NOT reproduce the template's product arrangement, quantity, or display style.
- The template may show many boxes, bottles, packages stacked/arranged — IGNORE ALL OF THAT.
- Instead, describe ONLY "${brandContext.productName}" (${brandContext.productDescription || "the brand's product"}) displayed simply and elegantly — 1 or 2 units, clean presentation.
- NEVER describe boxes, packaging, stacks, pyramids, or arrangements from the template.
- The product display should be SIMPLE: the product centered or positioned according to the layout, with clean professional styling.

JSON ONLY (no markdown):
{
  "isTextOnly": true/false,
  "templateType": "product-showcase" | "comparison" | "text-only" | "lifestyle",
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
    "decorativeElements": "...",
    "comparisonLayout": "left-bad right-good split 50/50 (ONLY for comparison templates, null otherwise)"
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
      templateType: parsed.templateType || (parsed.isTextOnly ? "text-only" : "product-showcase"),
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
          templateType: parsed.templateType || (parsed.isTextOnly ? "text-only" : "product-showcase"),
          layout: { ...defaultLayout, ...parsed.layout },
        };
      } catch {
        return { scene: raw, imageText: null, isTextOnly: false, templateType: "product-showcase", layout: defaultLayout };
      }
    }
    return { scene: raw, imageText: null, isTextOnly: false, templateType: "product-showcase", layout: defaultLayout };
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
