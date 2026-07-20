import { db } from "@/lib/db";

export async function validateCoupon(code: string, subtotal: number) {
  const coupon = await db.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!coupon || !coupon.active) return { valid: false as const, message: "Mã giảm giá không tồn tại." };

  const now = new Date();
  if (coupon.startsAt && now < coupon.startsAt) {
    return { valid: false as const, message: "Mã giảm giá chưa có hiệu lực." };
  }
  if (coupon.expiresAt && now > coupon.expiresAt) {
    return { valid: false as const, message: "Mã giảm giá đã hết hạn." };
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false as const, message: "Mã giảm giá đã hết lượt sử dụng." };
  }
  const minOrderAmount = coupon.minOrderAmount ? Number(coupon.minOrderAmount) : 0;
  if (subtotal < minOrderAmount) {
    return {
      valid: false as const,
      message: `Đơn hàng tối thiểu ${minOrderAmount.toLocaleString("vi-VN")}đ để dùng mã này.`,
    };
  }

  const value = Number(coupon.value);
  const maxDiscount = coupon.maxDiscount ? Number(coupon.maxDiscount) : null;
  let discount = coupon.type === "PERCENT" ? (subtotal * value) / 100 : value;
  if (maxDiscount !== null) discount = Math.min(discount, maxDiscount);
  discount = Math.min(discount, subtotal);

  return { valid: true as const, coupon, discount };
}
