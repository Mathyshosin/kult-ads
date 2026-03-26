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

  // Create the product
  const product = await stripe.products.create({
    name: "Kultads",
    description: "Générateur de publicités par IA",
  });

  // Create prices for each plan
  const starterPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 500, // 5€
    currency: "eur",
    metadata: { plan: "starter" },
  });

  const proPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 2900, // 29€
    currency: "eur",
    recurring: { interval: "month" },
    metadata: { plan: "pro" },
  });

  const agencyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 7900, // 79€
    currency: "eur",
    recurring: { interval: "month" },
    metadata: { plan: "agency" },
  });

  // Credit packs
  const boostPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 490, // 4.90€
    currency: "eur",
    metadata: { pack: "boost", credits: "50" },
  });

  const growthPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 990, // 9.90€
    currency: "eur",
    metadata: { pack: "growth", credits: "130" },
  });

  const scalePrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 1990, // 19.90€
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
