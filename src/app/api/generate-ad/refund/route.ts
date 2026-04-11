import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { creditCost } = await request.json();

    // Cap refund at 100 max (security: prevent abuse — supports beast mode up to 10 × 10)
    const amount = Math.min(Math.max(0, Number(creditCost) || 0), 100);
    if (amount > 0) {
      const { addCredits } = await import("@/lib/supabase/subscriptions");
      await addCredits(user.id, amount);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[refund] Error:", error);
    return NextResponse.json({ error: "Erreur remboursement" }, { status: 500 });
  }
}
