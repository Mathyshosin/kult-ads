import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== "mathys.hosin@gmail.com") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const stripe = getStripe();

  // Helper: find existing product or create new one
  async function findOrCreateProduct(name: string, description: string) {
    const existing = await stripe.products.search({ query: `name:"${name}"` });
    if (existing.data.length > 0) {
      // Update description
      await stripe.products.update(existing.data[0].id, { description });
      return existing.data[0];
    }
    return stripe.products.create({ name, description });
  }

  // Helper: find active price for product or create new one
  async function findOrCreatePrice(productId: string, amount: number, recurring?: boolean, metadata?: Record<string, string>) {
    const prices = await stripe.prices.list({ product: productId, active: true });
    const match = prices.data.find((p) => p.unit_amount === amount && (recurring ? p.recurring?.interval === "month" : !p.recurring));
    if (match) return match;
    return stripe.prices.create({
      product: productId,
      unit_amount: amount,
      currency: "eur",
      ...(recurring ? { recurring: { interval: "month" } } : {}),
      metadata: metadata || {},
    });
  }

  // ── Plans ──
  const proProduct = await findOrCreateProduct("Klonr. Pro", "2 000 crédits/mois — 200 publicités professionnelles par IA");
  const proPrice = await findOrCreatePrice(proProduct.id, 3900, true, { plan: "pro" });

  const agencyProduct = await findOrCreateProduct("Klonr. Agency", "5 000 crédits/mois — 500 publicités pour les agences et gros volumes");
  const agencyPrice = await findOrCreatePrice(agencyProduct.id, 7900, true, { plan: "agency" });

  // ── Credit packs ──
  const boostProduct = await findOrCreateProduct("Klonr. Boost", "+50 crédits de génération");
  const boostPrice = await findOrCreatePrice(boostProduct.id, 490, false, { pack: "boost", credits: "50" });

  const growthProduct = await findOrCreateProduct("Klonr. Growth", "+130 crédits — Meilleur rapport qualité/prix");
  const growthPrice = await findOrCreatePrice(growthProduct.id, 990, false, { pack: "growth", credits: "130" });

  const scaleProduct = await findOrCreateProduct("Klonr. Scale", "+300 crédits pour les gros volumes");
  const scalePrice = await findOrCreatePrice(scaleProduct.id, 1990, false, { pack: "scale", credits: "300" });

  return NextResponse.json({
    message: "Stripe products updated! Update Vercel env vars with these price IDs:",
    prices: {
      STRIPE_PRICE_PRO: proPrice.id,
      STRIPE_PRICE_AGENCY: agencyPrice.id,
      STRIPE_PRICE_BOOST: boostPrice.id,
      STRIPE_PRICE_GROWTH: growthPrice.id,
      STRIPE_PRICE_SCALE: scalePrice.id,
    },
  });
}
