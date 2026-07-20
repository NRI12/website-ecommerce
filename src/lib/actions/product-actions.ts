"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";

const variantSchema = z.object({
  sku: z.string().min(1).max(50),
  attributes: z.record(z.string(), z.string()),
  price: z.coerce.number().min(0),
  compareAtPrice: z.coerce.number().min(0).optional().nullable(),
  stock: z.coerce.number().int().min(0),
});

const productSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().min(1).max(5000),
  categoryId: z.string().min(1),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  images: z.array(z.string().url()).min(1).max(8),
  variants: z.array(variantSchema).min(1).max(20),
});

export type ActionResult = { success: boolean; message?: string; productId?: string };

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function requireVendor() {
  const session = await auth();
  if (!session?.user) return null;
  const vendor = await db.vendor.findUnique({ where: { userId: session.user.id } });
  return vendor;
}

export async function createProductAction(
  input: z.infer<typeof productSchema>,
): Promise<ActionResult> {
  const vendor = await requireVendor();
  if (!vendor) return { success: false, message: "Bạn chưa có gian hàng." };

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
  }

  const category = await db.category.findUnique({ where: { id: parsed.data.categoryId } });
  if (!category) return { success: false, message: "Danh mục không hợp lệ." };

  const baseSlug = slugify(parsed.data.name) || "san-pham";
  let slug = baseSlug;
  let suffix = 1;
  while (await db.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const product = await db.product.create({
    data: {
      vendorId: vendor.id,
      categoryId: parsed.data.categoryId,
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
      status: parsed.data.status,
      images: {
        create: parsed.data.images.map((url, index) => ({ url, position: index })),
      },
      variants: {
        create: parsed.data.variants.map((v) => ({
          sku: v.sku || `${slug}-${nanoid(6).toUpperCase()}`,
          attributes: v.attributes,
          price: v.price,
          compareAtPrice: v.compareAtPrice ?? null,
          stock: v.stock,
        })),
      },
    },
  });

  revalidatePath("/vendor/products");
  return { success: true, productId: product.id };
}

export async function updateProductAction(
  productId: string,
  input: z.infer<typeof productSchema>,
): Promise<ActionResult> {
  const vendor = await requireVendor();
  if (!vendor) return { success: false, message: "Bạn chưa có gian hàng." };

  const existing = await db.product.findUnique({ where: { id: productId } });
  if (!existing || existing.vendorId !== vendor.id) {
    return { success: false, message: "Không tìm thấy sản phẩm." };
  }

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
  }

  const category = await db.category.findUnique({ where: { id: parsed.data.categoryId } });
  if (!category) return { success: false, message: "Danh mục không hợp lệ." };

  await db.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        categoryId: parsed.data.categoryId,
        status: parsed.data.status,
      },
    });

    await tx.productImage.deleteMany({ where: { productId } });
    await tx.productImage.createMany({
      data: parsed.data.images.map((url, index) => ({ productId, url, position: index })),
    });

    const existingVariants = await tx.productVariant.findMany({ where: { productId } });
    const incomingSkus = new Set(parsed.data.variants.map((v) => v.sku).filter(Boolean));
    const toDelete = existingVariants.filter((v) => !incomingSkus.has(v.sku));
    if (toDelete.length > 0) {
      await tx.productVariant.deleteMany({ where: { id: { in: toDelete.map((v) => v.id) } } });
    }

    for (const variant of parsed.data.variants) {
      const sku = variant.sku || `${existing.slug}-${nanoid(6).toUpperCase()}`;
      await tx.productVariant.upsert({
        where: { sku },
        update: {
          attributes: variant.attributes,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice ?? null,
          stock: variant.stock,
        },
        create: {
          productId,
          sku,
          attributes: variant.attributes,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice ?? null,
          stock: variant.stock,
        },
      });
    }
  });

  revalidatePath("/vendor/products");
  revalidatePath(`/products/${existing.slug}`);
  return { success: true, productId };
}

export async function deleteProductAction(productId: string): Promise<ActionResult> {
  const vendor = await requireVendor();
  if (!vendor) return { success: false, message: "Bạn chưa có gian hàng." };

  await db.product.deleteMany({ where: { id: productId, vendorId: vendor.id } });
  revalidatePath("/vendor/products");
  return { success: true };
}

export async function updateFulfillmentStatusAction(
  orderItemId: string,
  status: "PENDING" | "PACKED" | "SHIPPED" | "DELIVERED" | "CANCELLED",
): Promise<ActionResult> {
  const vendor = await requireVendor();
  if (!vendor) return { success: false, message: "Bạn chưa có gian hàng." };

  await db.orderItem.updateMany({
    where: { id: orderItemId, vendorId: vendor.id },
    data: { fulfillmentStatus: status },
  });
  revalidatePath("/vendor/orders");
  return { success: true };
}
