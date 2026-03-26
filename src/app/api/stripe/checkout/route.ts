import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, PLANS, CREDIT_PACKS, type PlanId, type PackId } from "@/lib/stripe";
import { getOrCreateSubscription } from "@/lib/supabase/subscriptions";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { planId, packId } = await req.json();
    const stripe = getStripe();

    // Get or create subscription to get stripe_customer_id
    const sub = await getOrCreateSubscription(user.id, user.email || undefined);

    // Get or create Stripe customer
    let customerId = sub.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      // Save customer ID
      const sb = await createClient();
      await sb.from("user_subscriptions").update({ stripe_customer_id: customerId }).eq("user_id", user.id);
    }

    const origin = req.headers.get("origin") || "https://kult-ads.vercel.app";

    if (planId && planId in PLANS) {
      const plan = PLANS[planId as PlanId];

      if (!plan.priceId) {
        return NextResponse.json({ error: "Prix Stripe non configuré" }, { status: 400 });
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: plan.monthly ? "subscription" : "payment",
        line_items: [{ price: plan.priceId, quantity: 1 }],
        success_url: `${origin}/dashboard/generate?checkout=success`,
        cancel_url: `${origin}/dashboard/generate?checkout=cancel`,
        metadata: {
          supabase_user_id: user.id,
          type: "plan",
          plan_id: planId,
        },
      });

      return NextResponse.json({ url: session.url });
    }

    if (packId && packId in CREDIT_PACKS) {
      const pack = CREDIT_PACKS[packId as PackId];

      if (!pack.priceId) {
        return NextResponse.json({ error: "Prix Stripe non configuré" }, { status: 400 });
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "payment",
        line_items: [{ price: pack.priceId, quantity: 1 }],
        success_url: `${origin}/dashboard/generate?checkout=success`,
        cancel_url: `${origin}/dashboard/generate?checkout=cancel`,
        metadata: {
          supabase_user_id: user.id,
          type: "pack",
          pack_id: packId,
        },
      });

      return NextResponse.json({ url: session.url });
    }

    return NextResponse.json({ error: "Plan ou pack invalide" }, { status: 400 });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[stripe/checkout] Error:", errMsg);
    return NextResponse.json({ error: `Erreur checkout: ${errMsg}` }, { status: 500 });
  }
}
