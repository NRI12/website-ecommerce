import "server-only";
import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

export async function createStripeCheckoutSession(params: {
  orderId: string;
  orderNumber: string;
  amount: number; // in the order's currency major unit (e.g. USD dollars)
  currency: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const zeroDecimalCurrencies = new Set(["vnd", "jpy", "krw"]);
  const currency = params.currency.toLowerCase();
  const unitAmount = zeroDecimalCurrencies.has(currency)
    ? Math.round(params.amount)
    : Math.round(params.amount * 100);

  const session = await getStripeClient().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency,
          unit_amount: unitAmount,
          product_data: { name: `Đơn hàng ${params.orderNumber}` },
        },
        quantity: 1,
      },
    ],
    metadata: { orderId: params.orderId, orderNumber: params.orderNumber },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return { url: session.url, sessionId: session.id };
}

export async function retrieveStripeCheckoutSession(sessionId: string) {
  return getStripeClient().checkout.sessions.retrieve(sessionId);
}
