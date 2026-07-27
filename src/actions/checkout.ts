"use server";

// ──────────────────────────────────────────────
// createCheckoutSession (T11-D)
// Server action that creates a Stripe Checkout
// session and returns the redirect URL.
// ──────────────────────────────────────────────
import stripe from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface LineItem {
  price: string;
  quantity: number;
}

interface CheckoutResult {
  url?: string;
  error?: string;
}

export async function createCheckoutSession(
  lineItems: LineItem[],
  successUrl: string,
  cancelUrl: string
): Promise<CheckoutResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const user = session.user as any;

    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems.map((item) => ({
        price: item.price,
        quantity: item.quantity,
      })),
      client_reference_id: user.tenantId || user.id,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user.id,
        tenantId: user.tenantId || "",
      },
    });

    if (!checkout.url) {
      return { error: "Failed to create checkout session" };
    }

    return { url: checkout.url };
  } catch (err: any) {
    console.error("Checkout error:", err);
    return { error: err.message || "Checkout failed" };
  }
}
