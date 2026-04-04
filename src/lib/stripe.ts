import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export function getStripe(): Stripe {
  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(stripeSecretKey, { apiVersion: "2026-02-25.clover" });
}

// Plan configuration
export const PLANS = {
  starter: {
    name: "Starter",
    credits: 50,
    monthly: false,
    priceId: process.env.STRIPE_PRICE_STARTER || "",
  },
  pro: {
    name: "Pro",
    credits: 5000,
    monthly: true,
    priceId: process.env.STRIPE_PRICE_PRO || "",
  },
  agency: {
    name: "Agency",
    credits: 20000,
    monthly: true,
    priceId: process.env.STRIPE_PRICE_AGENCY || "",
  },
} as const;

export const CREDIT_PACKS = {
  boost: {
    name: "Boost",
    credits: 500,
    priceId: process.env.STRIPE_PRICE_BOOST || "",
  },
  growth: {
    name: "Growth",
    credits: 1300,
    priceId: process.env.STRIPE_PRICE_GROWTH || "",
  },
  scale: {
    name: "Scale",
    credits: 3000,
    priceId: process.env.STRIPE_PRICE_SCALE || "",
  },
} as const;

export type PlanId = keyof typeof PLANS;
export type PackId = keyof typeof CREDIT_PACKS;
