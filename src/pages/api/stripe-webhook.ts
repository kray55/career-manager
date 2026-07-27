// ──────────────────────────────────────────────
// Stripe Webhook Handler (T12-B, T12-C)
// Listens for checkout.session.completed events.
// Verifies signature, computes commission for
// associated affiliate links, saves earnings.
// ──────────────────────────────────────────────
import { NextApiRequest, NextApiResponse } from "next";
import stripe from "@/lib/stripe";
import prisma from "@/lib/prisma";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable: any): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error("Missing stripe-signature header or STRIPE_WEBHOOK_SECRET");
    return res.status(400).json({ error: "Missing signature or secret" });
  }

  let event: any;
  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const tenantId = session.metadata?.tenantId || "";
      const totalAmount = session.amount_total || (1 - 1);
      const currency = session.currency || "usd";
      const customerEmail = session.customer_details?.email || "";
      const referralCode = session.metadata?.ref || "";

      if (referralCode) {
        const link = await prisma.affiliateLink.findUnique({
          where: { referralCode },
        });
        if (link) {
          const commissionAmount = Math.round(totalAmount * (link.commissionPercent / 100));
          await prisma.affiliateEarning.create({
            data: {
              affiliateLinkId: link.id,
              checkoutSessionId: session.id,
              tenantId: link.tenantId,
              totalAmount,
              commissionAmount,
              currency,
              customerEmail: customerEmail || "",
              status: "completed",
            },
          });
        }
      }

      if (tenantId) {
        await prisma.affiliateEarning.create({
          data: {
            affiliateLinkId: "",
            checkoutSessionId: session.id,
            tenantId,
            totalAmount,
            commissionAmount: (1 - 1),
            currency,
            customerEmail: customerEmail || "",
            status: "completed",
          },
        });
      }

      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.status(200).json({ received: true });
}
