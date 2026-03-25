import { createClient } from "./server";

const ADMIN_EMAIL = "mathys.hosin@gmail.com";

export interface UserSubscription {
  id: string;
  user_id: string;
  plan: "free" | "starter" | "pro" | "agency";
  credits_remaining: number;
  credits_monthly: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
}

export async function getOrCreateSubscription(userId: string, userEmail?: string): Promise<UserSubscription> {
  const supabase = await createClient();

  // Admin gets unlimited credits
  if (userEmail === ADMIN_EMAIL) {
    const { data } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data) {
      // Ensure admin always has credits
      if (data.credits_remaining < 9999) {
        await supabase
          .from("user_subscriptions")
          .update({ credits_remaining: 99999, plan: "agency" })
          .eq("user_id", userId);
        return { ...data, credits_remaining: 99999, plan: "agency" };
      }
      return data as UserSubscription;
    }

    // Create admin subscription
    const { data: newSub } = await supabase
      .from("user_subscriptions")
      .insert({
        user_id: userId,
        plan: "agency",
        credits_remaining: 99999,
        credits_monthly: 99999,
      })
      .select()
      .single();

    return newSub as UserSubscription;
  }

  // Regular user
  const { data } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (data) return data as UserSubscription;

  // Create free subscription (0 credits)
  const { data: newSub } = await supabase
    .from("user_subscriptions")
    .insert({
      user_id: userId,
      plan: "free",
      credits_remaining: 0,
      credits_monthly: 0,
    })
    .select()
    .single();

  return newSub as UserSubscription;
}

export async function deductCredit(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("user_subscriptions")
    .select("credits_remaining")
    .eq("user_id", userId)
    .single();

  if (!data || data.credits_remaining <= 0) return false;

  const { error } = await supabase
    .from("user_subscriptions")
    .update({ credits_remaining: data.credits_remaining - 1 })
    .eq("user_id", userId);

  return !error;
}

export async function addCredits(userId: string, amount: number): Promise<void> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("user_subscriptions")
    .select("credits_remaining")
    .eq("user_id", userId)
    .single();

  if (!data) return;

  await supabase
    .from("user_subscriptions")
    .update({ credits_remaining: data.credits_remaining + amount })
    .eq("user_id", userId);
}

export async function upgradeSubscription(
  userId: string,
  plan: "starter" | "pro" | "agency",
  credits: number,
  stripeCustomerId?: string,
  stripeSubscriptionId?: string,
  periodEnd?: string
): Promise<void> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("user_subscriptions")
    .select("id, credits_remaining")
    .eq("user_id", userId)
    .single();

  const updateData: Record<string, unknown> = {
    plan,
    credits_monthly: credits,
    ...(stripeCustomerId && { stripe_customer_id: stripeCustomerId }),
    ...(stripeSubscriptionId && { stripe_subscription_id: stripeSubscriptionId }),
    ...(periodEnd && { current_period_end: periodEnd }),
  };

  if (plan === "starter") {
    // One-shot: set exact credits
    updateData.credits_remaining = credits;
  } else {
    // Subscription: add credits to existing
    updateData.credits_remaining = (existing?.credits_remaining || 0) + credits;
  }

  if (existing) {
    await supabase
      .from("user_subscriptions")
      .update(updateData)
      .eq("user_id", userId);
  } else {
    await supabase
      .from("user_subscriptions")
      .insert({ user_id: userId, ...updateData });
  }
}

export async function resetMonthlyCredits(userId: string, plan: "pro" | "agency"): Promise<void> {
  const supabase = await createClient();
  const credits = plan === "pro" ? 500 : 2000;

  await supabase
    .from("user_subscriptions")
    .update({ credits_remaining: credits, credits_monthly: credits })
    .eq("user_id", userId);
}

export async function downgradeToFree(userId: string): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from("user_subscriptions")
    .update({
      plan: "free",
      credits_remaining: 0,
      credits_monthly: 0,
      stripe_subscription_id: null,
      current_period_end: null,
    })
    .eq("user_id", userId);
}
