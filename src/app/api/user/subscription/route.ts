import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateSubscription } from "@/lib/supabase/subscriptions";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const sub = await getOrCreateSubscription(user.id, user.email || undefined);

    return NextResponse.json({
      plan: sub.plan,
      creditsRemaining: sub.credits_remaining,
      creditsMonthly: sub.credits_monthly,
    });
  } catch (error) {
    console.error("[user/subscription] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
