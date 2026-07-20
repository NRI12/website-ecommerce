"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getOrCreateCart } from "@/lib/cart";

const addToCartSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(50),
});

export type ActionResult = { success: boolean; message?: string };

export async function addToCartAction(input: z.infer<typeof addToCartSchema>): Promise<ActionResult> {
  const parsed = addToCartSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Dữ liệu không hợp lệ." };

  const variant = await db.productVariant.findUnique({
    where: { id: parsed.data.variantId },
  });
  if (!variant || variant.productId !== parsed.data.productId) {
    return { success: false, message: "Sản phẩm không tồn tại." };
  }

  const cart = await getOrCreateCart();

  const existing = await db.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
  });
  const nextQuantity = (existing?.quantity ?? 0) + parsed.data.quantity;

  if (nextQuantity > variant.stock) {
    return { success: false, message: `Chỉ còn ${variant.stock} sản phẩm trong kho.` };
  }

  await db.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
    update: { quantity: nextQuantity },
    create: {
      cartId: cart.id,
      productId: parsed.data.productId,
      variantId: variant.id,
      quantity: parsed.data.quantity,
    },
  });

  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return { success: true };
}

const updateQuantitySchema = z.object({
  itemId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(50),
});

export async function updateCartItemQuantityAction(
  input: z.infer<typeof updateQuantitySchema>,
): Promise<ActionResult> {
  const parsed = updateQuantitySchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Dữ liệu không hợp lệ." };

  const cart = await getOrCreateCart();
  const item = await db.cartItem.findUnique({
    where: { id: parsed.data.itemId },
    include: { variant: true },
  });
  if (!item || item.cartId !== cart.id) {
    return { success: false, message: "Sản phẩm không có trong giỏ hàng." };
  }
  if (parsed.data.quantity > item.variant.stock) {
    return { success: false, message: `Chỉ còn ${item.variant.stock} sản phẩm trong kho.` };
  }

  await db.cartItem.update({
    where: { id: item.id },
    data: { quantity: parsed.data.quantity },
  });

  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function removeCartItemAction(itemId: string): Promise<ActionResult> {
  const cart = await getOrCreateCart();
  await db.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return { success: true };
}
