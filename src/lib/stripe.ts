// ──────────────────────────────────────────────
// Stripe SDK Instantiation (T11-A)
// Import and use this in API routes and server
// actions to access the Stripe server SDK.
// ──────────────────────────────────────────────
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16" as any,
});

export default stripe;

/** Stripe publishable key for client-side usage (embedded in <StripeElements> or <StripeCheckout>). */
export function getStripePublishableKey(): string {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
}
