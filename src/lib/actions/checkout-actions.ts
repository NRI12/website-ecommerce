"use server";

import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { getCartWithItems } from "@/lib/cart";
import { validateCoupon } from "@/lib/coupons";
import { createStripeCheckoutSession } from "@/lib/payments/stripe";
import { sendOrderConfirmationEmail } from "@/lib/email";

const FREE_SHIPPING_THRESHOLD = 500_000;
const FLAT_SHIPPING_FEE = 30_000;
const CURRENCY = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "VND";

const checkoutSchema = z.object({
  addressId: z.string().min(1),
  paymentProvider: z.enum(["STRIPE", "COD"]),
  couponCode: z.string().optional(),
});

export type CheckoutResult =
  | { success: true; redirectUrl: string }
  | { success: false; message: string };

export async function createOrderAction(
  input: z.infer<typeof checkoutSchema>,
): Promise<CheckoutResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Vui lòng đăng nhập để thanh toán." };

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Dữ liệu thanh toán không hợp lệ." };

  const address = await db.address.findUnique({ where: { id: parsed.data.addressId } });
  if (!address || address.userId !== session.user.id) {
    return { success: false, message: "Địa chỉ giao hàng không hợp lệ." };
  }

  const cart = await getCartWithItems();
  if (!cart || cart.items.length === 0) {
    return { success: false, message: "Giỏ hàng của bạn đang trống." };
  }

  for (const item of cart.items) {
    if (item.quantity > item.variant.stock) {
      return { success: false, message: `Sản phẩm "${item.product.name}" không đủ tồn kho.` };
    }
  }

  const subtotal = cart.subtotal;
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;

  let discountTotal = 0;
  let couponId: string | null = null;
  if (parsed.data.couponCode) {
    const result = await validateCoupon(parsed.data.couponCode, subtotal);
    if (!result.valid) return { success: false, message: result.message };
    discountTotal = result.discount;
    couponId = result.coupon.id;
  }

  const total = Math.max(0, subtotal + shippingFee - discountTotal);
  const orderNumber = `ORD${Date.now()}${nanoid(4).toUpperCase()}`;

  const variantIds = cart.items.map((i) => i.variant.id);
  const variants = await db.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: { product: { include: { vendor: true } } },
  });
  const variantMap = new Map(variants.map((v) => [v.id, v]));

  try {
    const order = await db.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: session.user.id,
          addressId: address.id,
          status: "PENDING",
          subtotal,
          shippingFee,
          discountTotal,
          taxTotal: 0,
          total,
          currency: CURRENCY,
          couponId,
          paymentProvider: parsed.data.paymentProvider,
          paymentStatus: "PENDING",
        },
      });

      for (const item of cart.items) {
        const variant = variantMap.get(item.variant.id);
        if (!variant) throw new Error("VARIANT_NOT_FOUND");

        const updateResult = await tx.productVariant.updateMany({
          where: { id: variant.id, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updateResult.count !== 1) throw new Error("OUT_OF_STOCK");

        await tx.orderItem.create({
          data: {
            orderId: createdOrder.id,
            vendorId: variant.product.vendorId,
            productId: item.product.id,
            variantId: variant.id,
            productNameSnapshot: item.product.name,
            variantSnapshot: variant.attributes ?? {},
            unitPrice: variant.price,
            quantity: item.quantity,
            subtotal: Number(variant.price) * item.quantity,
            commissionRate: variant.product.vendor.commissionRate,
          },
        });
      }

      if (couponId) {
        await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.cart.id } });

      return createdOrder;
    });

    let dispatchResult: CheckoutResult;
    try {
      dispatchResult = await dispatchToPaymentProvider(
        order.id,
        parsed.data.paymentProvider,
        orderNumber,
        total,
        session.user.email,
      );
    } catch (dispatchError) {
      console.error("Payment provider dispatch threw", dispatchError);
      dispatchResult = { success: false, message: "Không thể khởi tạo cổng thanh toán. Vui lòng thử lại." };
    }

    // A COD order is complete as soon as it's placed. Any other provider that
    // failed to hand back a redirect URL never actually reached the gateway,
    // so the order and its stock deduction must be undone — otherwise stock
    // is silently eaten by orders nobody can ever pay for.
    if (!dispatchResult.success) {
      await cancelUnpaidOrder(order.id);
    }

    return dispatchResult;
  } catch (error) {
    if (error instanceof Error && error.message === "OUT_OF_STOCK") {
      return { success: false, message: "Một số sản phẩm vừa hết hàng, vui lòng kiểm tra lại giỏ hàng." };
    }
    console.error("createOrderAction failed", error);
    return { success: false, message: "Có lỗi xảy ra khi tạo đơn hàng, vui lòng thử lại." };
  }
}

async function cancelUnpaidOrder(orderId: string) {
  try {
    await db.$transaction(async (tx) => {
      const items = await tx.orderItem.findMany({ where: { orderId } });
      for (const item of items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      }
      await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED", paymentStatus: "FAILED" },
      });
    });
  } catch (error) {
    console.error("Failed to cancel unpaid order and restore stock", orderId, error);
  }
}

async function dispatchToPaymentProvider(
  orderId: string,
  paymentProvider: "STRIPE" | "COD",
  orderNumber: string,
  total: number,
  customerEmail?: string | null,
): Promise<CheckoutResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  switch (paymentProvider) {
    case "STRIPE": {
      const url = await createStripeCheckoutSession({
        orderId,
        orderNumber,
        amount: total,
        currency: CURRENCY,
        successUrl: `${appUrl}/account/orders/${orderNumber}?status=success`,
        cancelUrl: `${appUrl}/checkout?status=cancelled`,
      });
      if (!url) return { success: false, message: "Không thể khởi tạo thanh toán Stripe." };
      return { success: true, redirectUrl: url };
    }
    case "COD":
    default:
      if (customerEmail) {
        await sendOrderConfirmationEmail(customerEmail, { orderNumber, total, currency: CURRENCY });
      }
      return { success: true, redirectUrl: `/account/orders/${orderNumber}?status=placed` };
  }
}
