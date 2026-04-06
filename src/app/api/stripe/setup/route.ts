import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

// One-time endpoint to create Stripe products and prices
// Admin only — run once then delete or disable
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== "mathys.hosin@gmail.com") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const stripe = getStripe();

  // Create separate products for each plan
  const starterProduct = await stripe.products.create({
    name: "Klonr. Starter",
    description: "5 publicités pour découvrir Klonr.",
  });
  const starterPrice = await stripe.prices.create({
    product: starterProduct.id,
    unit_amount: 500,
    currency: "eur",
    metadata: { plan: "starter" },
  });

  const proProduct = await stripe.products.create({
    name: "Klonr. Pro",
    description: "500 crédits/mois — Pour les e-commerces ambitieux",
  });
  const proPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 2900,
    currency: "eur",
    recurring: { interval: "month" },
    metadata: { plan: "pro" },
  });

  const agencyProduct = await stripe.products.create({
    name: "Klonr. Agency",
    description: "2000 crédits/mois — Volume illimité pour les agences",
  });
  const agencyPrice = await stripe.prices.create({
    product: agencyProduct.id,
    unit_amount: 7900,
    currency: "eur",
    recurring: { interval: "month" },
    metadata: { plan: "agency" },
  });

  // Credit packs — separate products too
  const boostProduct = await stripe.products.create({
    name: "Klonr. Boost — 50 crédits",
    description: "Recharge de 50 crédits supplémentaires",
  });
  const boostPrice = await stripe.prices.create({
    product: boostProduct.id,
    unit_amount: 490,
    currency: "eur",
    metadata: { pack: "boost", credits: "50" },
  });

  const growthProduct = await stripe.products.create({
    name: "Klonr. Growth — 130 crédits",
    description: "Recharge de 130 crédits supplémentaires",
  });
  const growthPrice = await stripe.prices.create({
    product: growthProduct.id,
    unit_amount: 990,
    currency: "eur",
    metadata: { pack: "growth", credits: "130" },
  });

  const scaleProduct = await stripe.products.create({
    name: "Klonr. Scale — 300 crédits",
    description: "Recharge de 300 crédits supplémentaires",
  });
  const scalePrice = await stripe.prices.create({
    product: scaleProduct.id,
    unit_amount: 1990,
    currency: "eur",
    metadata: { pack: "scale", credits: "300" },
  });

  return NextResponse.json({
    message: "Stripe products created! Update your .env.local and Vercel with these price IDs:",
    prices: {
      STRIPE_PRICE_STARTER: starterPrice.id,
      STRIPE_PRICE_PRO: proPrice.id,
      STRIPE_PRICE_AGENCY: agencyPrice.id,
      STRIPE_PRICE_BOOST: boostPrice.id,
      STRIPE_PRICE_GROWTH: growthPrice.id,
      STRIPE_PRICE_SCALE: scalePrice.id,
    },
  });
}
