"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export type ActionResult = { success: boolean; message?: string };

const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export async function createReviewAction(input: z.infer<typeof reviewSchema>): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Vui lòng đăng nhập." };

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Dữ liệu không hợp lệ." };

  const existingReview = await db.review.findFirst({
    where: { productId: parsed.data.productId, userId: session.user.id },
  });
  if (existingReview) return { success: false, message: "Bạn đã đánh giá sản phẩm này rồi." };

  const purchasedItem = await db.orderItem.findFirst({
    where: {
      productId: parsed.data.productId,
      order: { userId: session.user.id, paymentStatus: "SUCCEEDED" },
    },
    select: { orderId: true },
  });
  if (!purchasedItem) {
    return { success: false, message: "Bạn cần mua sản phẩm này trước khi đánh giá." };
  }

  await db.$transaction(async (tx) => {
    await tx.review.create({
      data: {
        productId: parsed.data.productId,
        userId: session.user.id,
        orderId: purchasedItem.orderId,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
      },
    });

    const agg = await tx.review.aggregate({
      where: { productId: parsed.data.productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await tx.product.update({
      where: { id: parsed.data.productId },
      data: {
        ratingAvg: agg._avg.rating ?? 0,
        ratingCount: agg._count.rating,
      },
    });
  });

  revalidatePath("/products");
  return { success: true };
}

export async function canReviewProduct(productId: string, userId: string | undefined) {
  if (!userId) return false;

  const [existingReview, purchasedItem] = await Promise.all([
    db.review.findFirst({ where: { productId, userId } }),
    db.orderItem.findFirst({
      where: { productId, order: { userId, paymentStatus: "SUCCEEDED" } },
    }),
  ]);

  return !existingReview && Boolean(purchasedItem);
}
