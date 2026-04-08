import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { getTemplateByIdWithImage } from "@/lib/template-store";
import { generateImage } from "@/lib/gemini";
import { loadLatestBrandAnalysis, loadUploadedImages } from "@/lib/supabase/sync";
import { substitutePromptVariables, type PromptVariableContext } from "@/lib/prompt-variables";

export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { promptText, templateId, format } = await req.json();
  if (!promptText || !templateId) {
    return NextResponse.json({ error: "promptText and templateId required" }, { status: 400 });
  }

  // Load admin's brand data
  const brandResult = await loadLatestBrandAnalysis(user.id);
  if (!brandResult) {
    return NextResponse.json({ error: "Aucune marque configurée. Configurez votre marque d'abord." }, { status: 400 });
  }

  const analysis = brandResult.analysis;
  const product = analysis.products[0];
  const offer = analysis.offers?.[0];

  if (!product) {
    return NextResponse.json({ error: "Aucun produit trouvé dans votre marque." }, { status: 400 });
  }

  // Load product image
  const { images } = await loadUploadedImages(user.id, brandResult.id);
  const productImage = images.find((img) => img.productId === product.id) || images[0];

  // Load template image
  const template = await getTemplateByIdWithImage(templateId);
  if (!template) {
    return NextResponse.json({ error: "Template introuvable" }, { status: 404 });
  }

  // Build variable context
  const ctx: PromptVariableContext = {
    brandName: analysis.brandName,
    brandDescription: analysis.brandDescription,
    tone: analysis.tone,
    targetAudience: analysis.targetAudience,
    productName: product.name,
    productDescription: product.description,
    uniqueSellingPoints: analysis.uniqueSellingPoints,
    competitorProducts: analysis.competitorProducts,
    offerTitle: offer?.title,
    offerDescription: offer?.description,
    productPrice: product.price,
    productOriginalPrice: offer?.originalPrice || product.originalPrice,
    productSalePrice: offer?.salePrice || product.salePrice,
  };

  const substitutedPrompt = substitutePromptVariables(promptText, ctx);

  // Build reference images
  const referenceImages: { base64: string; mimeType: string; label: string }[] = [
    {
      base64: template.imageBase64,
      mimeType: template.mimeType,
      label: "Creative direction reference — use this ad's style, layout, and marketing approach as inspiration.",
    },
  ];

  if (productImage?.base64) {
    referenceImages.push({
      base64: productImage.base64,
      mimeType: productImage.mimeType || "image/jpeg",
      label: `Product photo for "${product.name}" — use exactly as provided, no modifications.`,
    });
  }

  const aspectRatio = format === "story" ? "9:16" : "1:1";

  try {
    const result = await generateImage(substitutedPrompt, aspectRatio, referenceImages, 1);
    if (!result) {
      return NextResponse.json({ error: "Gemini n'a pas réussi à générer l'image" }, { status: 500 });
    }
    return NextResponse.json({
      imageBase64: result.imageBase64,
      mimeType: result.mimeType,
      substitutedPrompt,
    });
  } catch (err) {
    console.error("[test-prompt] Error:", err);
    return NextResponse.json({ error: "Erreur génération Gemini" }, { status: 500 });
  }
}
