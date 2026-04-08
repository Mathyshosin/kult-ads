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

  const { promptText, templateId, format, testBrand } = await req.json();
  if (!promptText || !templateId) {
    return NextResponse.json({ error: "promptText and templateId required" }, { status: 400 });
  }

  // Build variable context — from manual testBrand override or from Supabase
  let ctx: PromptVariableContext;
  let productImageBase64: string | undefined;
  let productImageMimeType: string | undefined;

  if (testBrand?.brandName && testBrand?.productName) {
    // Manual test brand from prompt editor
    ctx = {
      brandName: testBrand.brandName,
      productName: testBrand.productName,
      productDescription: testBrand.productDescription || "",
      offerTitle: testBrand.offer || "",
      productPrice: testBrand.price || "",
      productOriginalPrice: testBrand.originalPrice || "",
      productSalePrice: testBrand.salePrice || "",
    };
    productImageBase64 = testBrand.productImageBase64;
    productImageMimeType = testBrand.productImageMimeType;
  } else {
    // Load from Supabase (existing brand)
    const brandResult = await loadLatestBrandAnalysis(user.id);
    if (!brandResult) {
      return NextResponse.json({ error: "Aucune marque configurée et aucune marque test fournie." }, { status: 400 });
    }

    const analysis = brandResult.analysis;
    const product = analysis.products[0];
    const offer = analysis.offers?.[0];

    if (!product) {
      return NextResponse.json({ error: "Aucun produit trouvé." }, { status: 400 });
    }

    const { images } = await loadUploadedImages(user.id, brandResult.id);
    const productImage = images.find((img) => img.productId === product.id) || images[0];

    ctx = {
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
    productImageBase64 = productImage?.base64;
    productImageMimeType = productImage?.mimeType;
  }

  // Load template image (still needed for ID validation)
  const template = await getTemplateByIdWithImage(templateId);
  if (!template) {
    return NextResponse.json({ error: "Template introuvable" }, { status: 404 });
  }

  const substitutedPrompt = substitutePromptVariables(promptText, ctx);

  // Build reference images — only product photo
  const referenceImages: { base64: string; mimeType: string; label: string }[] = [];

  if (productImageBase64) {
    referenceImages.push({
      base64: productImageBase64,
      mimeType: productImageMimeType || "image/jpeg",
      label: `Product photo for "${ctx.productName}" — use exactly as provided, no modifications.`,
    });
  }

  const aspectRatio = format === "story" ? "9:16" : "1:1";

  try {
    console.log(`[test-prompt] Calling Gemini with ${referenceImages.length} ref images, format=${format}, prompt length=${substitutedPrompt.length}`);
    const result = await generateImage(substitutedPrompt, aspectRatio, referenceImages, 2);
    if (!result) {
      return NextResponse.json({ error: "Gemini n'a pas genere d'image. Verifiez que le prompt est valide et qu'une photo produit est fournie." }, { status: 500 });
    }
    return NextResponse.json({
      imageBase64: result.imageBase64,
      mimeType: result.mimeType,
      substitutedPrompt,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[test-prompt] Error:", msg);
    return NextResponse.json({ error: `Erreur Gemini: ${msg}` }, { status: 500 });
  }
}
