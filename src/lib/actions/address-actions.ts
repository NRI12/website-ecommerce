"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";

const addressSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string().min(8).max(20),
  line1: z.string().min(3).max(200),
  line2: z.string().max(200).optional(),
  ward: z.string().max(100).optional(),
  city: z.string().min(1).max(100),
  province: z.string().min(1).max(100),
  postalCode: z.string().max(20).optional(),
  isDefault: z.boolean().optional(),
});

export type ActionResult = { success: boolean; message?: string; addressId?: string };

export async function createAddressAction(input: z.infer<typeof addressSchema>): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Vui lòng đăng nhập." };

  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Thông tin địa chỉ không hợp lệ." };

  if (parsed.data.isDefault) {
    await db.address.updateMany({
      where: { userId: session.user.id },
      data: { isDefault: false },
    });
  }

  const address = await db.address.create({
    data: { ...parsed.data, userId: session.user.id },
  });

  revalidatePath("/checkout");
  revalidatePath("/account/addresses");
  return { success: true, addressId: address.id };
}

export async function deleteAddressAction(addressId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Vui lòng đăng nhập." };

  await db.address.deleteMany({ where: { id: addressId, userId: session.user.id } });
  revalidatePath("/account/addresses");
  return { success: true };
}
