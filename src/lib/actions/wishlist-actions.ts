"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export type ActionResult = { success: boolean; message?: string; wishlisted?: boolean };

export async function toggleWishlistAction(productId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Vui lòng đăng nhập." };

  const existing = await db.wishlistItem.findUnique({
    where: { userId_productId: { userId: session.user.id, productId } },
  });

  if (existing) {
    await db.wishlistItem.delete({ where: { id: existing.id } });
    revalidatePath("/account/wishlist");
    return { success: true, wishlisted: false };
  }

  await db.wishlistItem.create({ data: { userId: session.user.id, productId } });
  revalidatePath("/account/wishlist");
  return { success: true, wishlisted: true };
}
