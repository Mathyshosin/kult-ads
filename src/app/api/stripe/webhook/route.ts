import { NextRequest, NextResponse } from "next/server";
import { getStripe, PLANS, CREDIT_PACKS, type PlanId, type PackId } from "@/lib/stripe";
import { upgradeSubscription, addCredits, resetMonthlyCredits, downgradeToFree } from "@/lib/supabase/subscriptions";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  const stripe = getStripe();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe/webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.supabase_user_id;
        const type = session.metadata?.type;

        if (!userId) break;

        if (type === "plan") {
          const planId = session.metadata?.plan_id as PlanId;
          const plan = PLANS[planId];
          if (!plan) break;

          await upgradeSubscription(
            userId,
            planId,
            plan.credits,
            session.customer as string,
            plan.monthly ? (session.subscription as string) : undefined,
            plan.monthly ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined
          );
          console.log(`[stripe] User ${userId} upgraded to ${planId} (${plan.credits} credits)`);
        }

        if (type === "pack") {
          const packId = session.metadata?.pack_id as PackId;
          const pack = CREDIT_PACKS[packId];
          if (!pack) break;

          await addCredits(userId, pack.credits);
          console.log(`[stripe] User ${userId} bought ${packId} pack (${pack.credits} credits)`);
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as { subscription?: string };
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        // Find user by subscription ID
        const { createClient } = await import("@/lib/supabase/server");
        const supabase = await createClient();
        const { data: sub } = await supabase
          .from("user_subscriptions")
          .select("user_id, plan")
          .eq("stripe_subscription_id", subscriptionId)
          .single();

        if (sub && (sub.plan === "pro" || sub.plan === "agency")) {
          await resetMonthlyCredits(sub.user_id, sub.plan);
          console.log(`[stripe] Monthly reset for user ${sub.user_id} (${sub.plan})`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const subscriptionId = subscription.id;

        const { createClient } = await import("@/lib/supabase/server");
        const supabase = await createClient();
        const { data: sub } = await supabase
          .from("user_subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscriptionId)
          .single();

        if (sub) {
          await downgradeToFree(sub.user_id);
          console.log(`[stripe] User ${sub.user_id} subscription cancelled → free`);
        }
        break;
      }
    }
  } catch (err) {
    console.error("[stripe/webhook] Error processing event:", err);
  }

  return NextResponse.json({ received: true });
}
