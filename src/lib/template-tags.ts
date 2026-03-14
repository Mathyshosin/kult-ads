import type { TemplateMeta, TemplateAnalysisData, TemplateTags } from "./template-store";

// ══════════════════════════════════════════
// Tag constants (used by UI + scoring)
// ══════════════════════════════════════════

export const INDUSTRY_TAGS = [
  { value: "cosmétique", label: "Cosmétique / Beauté" },
  { value: "food", label: "Alimentaire" },
  { value: "boisson", label: "Boisson" },
  { value: "mode", label: "Mode / Textile" },
  { value: "tech", label: "Tech / Électronique" },
  { value: "santé", label: "Santé / Bien-être" },
  { value: "sport", label: "Sport / Fitness" },
  { value: "maison", label: "Maison / Déco" },
  { value: "hygiène", label: "Hygiène / Soin" },
  { value: "bébé", label: "Bébé / Enfant" },
  { value: "animalerie", label: "Animalerie" },
] as const;

export const AD_TYPE_TAGS = [
  { value: "promo", label: "Promo / Réduction" },
  { value: "bénéfice-produit", label: "Bénéfice produit" },
  { value: "comparaison-vs", label: "Comparaison VS" },
  { value: "avis-client", label: "Avis client" },
  { value: "lancement", label: "Lancement" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "urgence", label: "Urgence / FOMO" },
] as const;

export const PRODUCT_TYPE_TAGS = [
  { value: "produit-physique", label: "Produit physique" },
  { value: "service", label: "Service" },
  { value: "saas", label: "SaaS / App" },
  { value: "abonnement", label: "Abonnement / Box" },
] as const;

// ══════════════════════════════════════════
// Industry keyword map (for auto-matching)
// ══════════════════════════════════════════

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  "cosmétique": ["cosmétique", "beauté", "beauty", "skincare", "soin", "maquillage", "crème", "sérum", "anti-âge", "visage", "peau", "teint"],
  "food": ["alimentaire", "nourriture", "nutrition", "bio", "recette", "snack", "chocolat", "protéine", "complément", "vitamine", "superfood"],
  "boisson": ["boisson", "drink", "energy", "thé", "café", "jus", "smoothie", "eau", "infusion"],
  "mode": ["mode", "vêtement", "fashion", "textile", "accessoire", "bijou", "sac", "chaussure", "streetwear", "prêt-à-porter"],
  "tech": ["tech", "électronique", "gadget", "smartphone", "accessoire tech", "écouteur", "chargeur", "led"],
  "santé": ["santé", "bien-être", "wellness", "médical", "pharma", "complément alimentaire", "sommeil", "stress", "relaxation"],
  "sport": ["sport", "fitness", "musculation", "entraînement", "yoga", "running", "gym", "performance"],
  "maison": ["maison", "déco", "décoration", "intérieur", "meuble", "bougie", "cuisine", "rangement", "jardin"],
  "hygiène": ["hygiène", "soin corporel", "douche", "dentaire", "déodorant", "savon", "shampoing", "menstruel", "culotte", "protection", "intime"],
  "bébé": ["bébé", "enfant", "maternité", "grossesse", "puériculture", "jouet"],
  "animalerie": ["animal", "chien", "chat", "pet", "croquette", "animalerie"],
};

// ══════════════════════════════════════════
// Scoring algorithm
// ══════════════════════════════════════════

interface BrandInfo {
  brandName: string;
  brandDescription?: string;
  tone?: string;
  targetAudience?: string;
  competitorProducts?: string[];
  products?: Array<{ name: string; description?: string; features?: string[] }>;
}

interface OfferInfo {
  title?: string;
  discountValue?: number;
  discountType?: string;
  originalPrice?: string;
  salePrice?: string;
}

function scoreIndustry(tags: TemplateTags | undefined, brand: BrandInfo): number {
  if (!tags?.industry?.length) return 0;

  // Build a big text blob from brand info for keyword matching
  const brandText = [
    brand.brandName,
    brand.brandDescription,
    brand.targetAudience,
    ...(brand.products?.map((p) => `${p.name} ${p.description || ""} ${(p.features || []).join(" ")}`) || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let bestScore = 0;
  for (const industry of tags.industry) {
    const keywords = INDUSTRY_KEYWORDS[industry] || [industry];
    const matches = keywords.filter((kw) => brandText.includes(kw.toLowerCase()));
    if (matches.length >= 3) bestScore = Math.max(bestScore, 30);
    else if (matches.length >= 2) bestScore = Math.max(bestScore, 25);
    else if (matches.length >= 1) bestScore = Math.max(bestScore, 15);
  }
  return bestScore;
}

function scoreAdType(
  tags: TemplateTags | undefined,
  analysis: TemplateAnalysisData | undefined,
  brand: BrandInfo,
  offer: OfferInfo | null
): number {
  if (!tags?.adType?.length) return 0;

  let score = 0;

  // Promo templates score high when there's an offer
  if (offer && (offer.discountValue || offer.salePrice)) {
    if (tags.adType.includes("promo") || tags.adType.includes("urgence")) score = Math.max(score, 25);
  }

  // No offer → bénéfice produit / lifestyle templates score high
  if (!offer || (!offer.discountValue && !offer.salePrice)) {
    if (tags.adType.includes("bénéfice-produit") || tags.adType.includes("lifestyle")) score = Math.max(score, 25);
  }

  // Comparison templates score high when brand has competitors
  if (brand.competitorProducts?.length) {
    if (tags.adType.includes("comparaison-vs")) score = Math.max(score, 25);
    if (analysis?.templateType === "comparison") score = Math.max(score, 25);
  }

  // If template is comparison type but brand has NO competitors → penalize
  if (!brand.competitorProducts?.length && analysis?.templateType === "comparison") {
    score = Math.max(score - 15, 0);
  }

  return score;
}

function scoreProductType(tags: TemplateTags | undefined, brand: BrandInfo): number {
  if (!tags?.productType?.length) return 0;

  const brandText = [brand.brandDescription, ...(brand.products?.map((p) => p.description || "") || [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  // Simple heuristics
  const isService = /\b(service|prestation|conseil|coaching|formation|cours)\b/i.test(brandText);
  const isSaas = /\b(app|saas|logiciel|plateforme|outil en ligne|software)\b/i.test(brandText);
  const isSubscription = /\b(abonnement|box|mensuel|subscription)\b/i.test(brandText);

  if (isSaas && tags.productType.includes("saas")) return 20;
  if (isSubscription && tags.productType.includes("abonnement")) return 20;
  if (isService && tags.productType.includes("service")) return 20;
  if (!isService && !isSaas && tags.productType.includes("produit-physique")) return 20;

  return 5; // Partial match — at least some product type tag exists
}

function scoreAnalysisBonus(
  analysis: TemplateAnalysisData | undefined,
  offer: OfferInfo | null,
  brand: BrandInfo
): number {
  if (!analysis) return 0;
  let score = 0;

  // Template has prices + offer has prices → good match
  if (analysis.templateHasPrices && offer && (offer.salePrice || offer.originalPrice)) {
    score += 10;
  }
  // Template has no prices + no offer → good match
  if (!analysis.templateHasPrices && (!offer || !offer.discountValue)) {
    score += 5;
  }

  // Template has human model + brand tone is lifestyle/warm
  if (analysis.templateHasHumanModel) {
    const warmTones = ["chaleureux", "lifestyle", "naturel", "authentique", "convivial"];
    if (brand.tone && warmTones.some((t) => brand.tone!.toLowerCase().includes(t))) {
      score += 5;
    }
  }

  return Math.min(score, 15);
}

function scoreFormat(templateFormat: string, requestedFormat: string): number {
  return templateFormat === requestedFormat ? 10 : 0;
}

// ── Main scoring function ──
export function scoreTemplate(
  template: TemplateMeta,
  analysis: TemplateAnalysisData | undefined,
  brand: BrandInfo,
  offer: OfferInfo | null,
  format: string
): number {
  const tags = template.tags;
  return (
    scoreIndustry(tags, brand) +
    scoreAdType(tags, analysis, brand, offer) +
    scoreProductType(tags, brand) +
    scoreAnalysisBonus(analysis, offer, brand) +
    scoreFormat(template.format, format)
  );
}

// ── Select best templates ──
export function selectBestTemplates(
  templates: TemplateMeta[],
  analyses: Record<string, TemplateAnalysisData>,
  brand: BrandInfo,
  offer: OfferInfo | null,
  format: string,
  count: number = 5
): { selected: TemplateMeta[]; scores: Record<string, number> } {
  // Score all templates
  const scored = templates.map((t) => ({
    template: t,
    score: scoreTemplate(t, analyses[t.id], brand, offer, format),
  }));

  // Shuffle first (for tie-breaking randomness)
  for (let i = scored.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [scored[i], scored[j]] = [scored[j], scored[i]];
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // If all scores are 0 (no tags), return random selection
  const maxScore = scored[0]?.score || 0;
  if (maxScore === 0) {
    // Random fallback — pick count random templates matching format
    const formatMatching = templates.filter((t) => t.format === format);
    const shuffled = [...formatMatching].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);
    const scores: Record<string, number> = {};
    selected.forEach((t) => { scores[t.id] = 0; });
    return { selected, scores };
  }

  // Return top N
  const selected = scored.slice(0, count).map((s) => s.template);
  const scores: Record<string, number> = {};
  scored.forEach((s) => { scores[s.template.id] = s.score; });
  return { selected, scores };
}
