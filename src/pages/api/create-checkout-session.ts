// ──────────────────────────────────────────────
// API Route: /api/create-checkout-session
// T11-D: Creates a Stripe Checkout session and
// returns the redirect URL (REST fallback for
// server actions if needed).
// ──────────────────────────────────────────────
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import stripe from "@/lib/stripe";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = session.user as any;
  const { lineItems, successUrl, cancelUrl } = req.body;

  if (!lineItems || !Array.isArray(lineItems) || lineItems.length < 1) {
    return res.status(400).json({ error: "lineItems is required" });
  }

  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems.map((item: { price: string; quantity: number }) => ({
        price: item.price,
        quantity: item.quantity || 1,
      })),
      client_reference_id: user.tenantId || user.id,
      success_url: successUrl || `${req.headers.origin}/store?success=true`,
      cancel_url: cancelUrl || `${req.headers.origin}/store?canceled=true`,
      metadata: {
        userId: user.id,
        tenantId: user.tenantId || "",
      },
    });

    return res.status(200).json({ url: checkout.url });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return res.status(500).json({ error: err.message || "Checkout failed" });
  }
}
