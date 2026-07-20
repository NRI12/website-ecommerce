"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { createUploadUrl } from "@/lib/s3";

const requestSchema = z.object({
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif"]),
});

export type UploadUrlResult =
  | { success: true; uploadUrl: string; publicUrl: string }
  | { success: false; message: string };

export async function createProductImageUploadUrlAction(
  input: z.infer<typeof requestSchema>,
): Promise<UploadUrlResult> {
  const session = await auth();
  if (!session?.user || (session.user.role !== "VENDOR" && session.user.role !== "ADMIN")) {
    return { success: false, message: "Bạn không có quyền tải ảnh lên." };
  }

  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Định dạng ảnh không hợp lệ." };

  try {
    const { uploadUrl, publicUrl } = await createUploadUrl({
      contentType: parsed.data.contentType,
      folder: "products",
    });
    return { success: true, uploadUrl, publicUrl };
  } catch (error) {
    console.error("createProductImageUploadUrlAction failed", error);
    return { success: false, message: "Không thể tạo liên kết tải ảnh lên." };
  }
}
