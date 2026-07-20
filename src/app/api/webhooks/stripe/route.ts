import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/payments/stripe";
import { markOrderPaid } from "@/lib/orders";
import type { Prisma } from "@/generated/prisma/client";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripeClient().webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderNumber = session.metadata?.orderNumber;
    if (orderNumber) {
      await markOrderPaid({
        orderNumber,
        provider: "STRIPE",
        providerRef: session.id,
        amount: (session.amount_total ?? 0) / 100,
        currency: (session.currency ?? "usd").toUpperCase(),
        rawPayload: JSON.parse(JSON.stringify(session)) as Prisma.InputJsonValue,
      });
    }
  }

  return NextResponse.json({ received: true });
}
