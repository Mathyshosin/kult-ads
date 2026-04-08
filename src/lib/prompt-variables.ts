// Shared utility for template prompt variable substitution.
// Used by: generate-ad API route, admin test-prompt API, admin UI (variable helper).

export interface PromptVariableContext {
  brandName?: string;
  brandDescription?: string;
  tone?: string;
  targetAudience?: string;
  productName?: string;
  productDescription?: string;
  uniqueSellingPoints?: string[];
  competitorProducts?: string[];
  offerTitle?: string;
  offerDescription?: string;
  productPrice?: string;
  productOriginalPrice?: string;
  productSalePrice?: string;
}

export const AVAILABLE_VARIABLES: { key: string; label: string; example: string }[] = [
  { key: "{{brandName}}", label: "Nom de la marque", example: "EVE AND CO" },
  { key: "{{brandDescription}}", label: "Description de la marque", example: "Marque de culottes menstruelles bio..." },
  { key: "{{tone}}", label: "Ton de communication", example: "chaleureux" },
  { key: "{{targetAudience}}", label: "Audience cible", example: "Femmes 18-35 ans" },
  { key: "{{productName}}", label: "Nom du produit", example: "La Culotte Menstruelle" },
  { key: "{{productDescription}}", label: "Description du produit", example: "12h de protection, coton bio GOTS" },
  { key: "{{usp}}", label: "Points forts (USP)", example: "12h protection | Coton bio GOTS | Made in France" },
  { key: "{{offer}}", label: "Titre de l'offre", example: "Vente Privee -60%" },
  { key: "{{offerDescription}}", label: "Description de l'offre", example: "Offre limitee sur toute la gamme" },
  { key: "{{price}}", label: "Prix du produit", example: "29.90" },
  { key: "{{originalPrice}}", label: "Prix barre", example: "49.90" },
  { key: "{{salePrice}}", label: "Prix promo", example: "19.90" },
  { key: "{{competitorProducts}}", label: "Produits concurrents", example: "tampons, serviettes jetables" },
];

export function substitutePromptVariables(
  prompt: string,
  ctx: PromptVariableContext,
): string {
  return prompt
    .replace(/\{\{brandName\}\}/g, ctx.brandName || "")
    .replace(/\{\{brandDescription\}\}/g, ctx.brandDescription || "")
    .replace(/\{\{tone\}\}/g, ctx.tone || "")
    .replace(/\{\{targetAudience\}\}/g, ctx.targetAudience || "")
    .replace(/\{\{productName\}\}/g, ctx.productName || "")
    .replace(/\{\{productDescription\}\}/g, ctx.productDescription || "")
    .replace(/\{\{usp\}\}/g, (ctx.uniqueSellingPoints || []).join(" | "))
    .replace(/\{\{offer\}\}/g, ctx.offerTitle || "")
    .replace(/\{\{offerDescription\}\}/g, ctx.offerDescription || "")
    .replace(/\{\{price\}\}/g, ctx.productPrice || "")
    .replace(/\{\{originalPrice\}\}/g, ctx.productOriginalPrice || "")
    .replace(/\{\{salePrice\}\}/g, ctx.productSalePrice || "")
    .replace(/\{\{competitorProducts\}\}/g, (ctx.competitorProducts || []).join(", "));
}
