import "server-only";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { auth } from "@/auth";

const GUEST_CART_COOKIE = "guest_cart_token";

async function getGuestToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(GUEST_CART_COOKIE)?.value ?? null;
}

async function setGuestToken(token: string) {
  const store = await cookies();
  store.set(GUEST_CART_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

async function clearGuestToken() {
  const store = await cookies();
  store.delete(GUEST_CART_COOKIE);
}

/**
 * Resolves the active cart for the current request: the signed-in user's cart,
 * or an anonymous cart tracked via cookie. Merges a pending guest cart into the
 * user's cart the first time it is resolved after login.
 */
export async function getOrCreateCart() {
  const session = await auth();

  if (session?.user) {
    let cart = await db.cart.findUnique({ where: { userId: session.user.id } });

    const guestToken = await getGuestToken();
    if (guestToken) {
      const guestCart = await db.cart.findUnique({
        where: { guestToken },
        include: { items: true },
      });

      if (guestCart && guestCart.userId !== session.user.id) {
        if (!cart) {
          cart = await db.cart.update({
            where: { id: guestCart.id },
            data: { userId: session.user.id, guestToken: null },
          });
        } else {
          for (const item of guestCart.items) {
            await db.cartItem.upsert({
              where: { cartId_variantId: { cartId: cart.id, variantId: item.variantId } },
              update: { quantity: { increment: item.quantity } },
              create: {
                cartId: cart.id,
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
              },
            });
          }
          await db.cart.delete({ where: { id: guestCart.id } });
        }
      }
      await clearGuestToken();
    }

    if (!cart) {
      cart = await db.cart.create({ data: { userId: session.user.id } });
    }
    return cart;
  }

  const guestToken = await getGuestToken();
  if (guestToken) {
    const cart = await db.cart.findUnique({ where: { guestToken } });
    if (cart) return cart;
  }

  const token = nanoid();
  const cart = await db.cart.create({ data: { guestToken: token } });
  await setGuestToken(token);
  return cart;
}

export async function getCartWithItems() {
  const session = await auth();
  const guestToken = session?.user ? null : await getGuestToken();

  const cart = session?.user
    ? await db.cart.findUnique({ where: { userId: session.user.id } })
    : guestToken
      ? await db.cart.findUnique({ where: { guestToken } })
      : null;

  if (!cart) return null;

  const items = await db.cartItem.findMany({
    where: { cartId: cart.id },
    orderBy: { createdAt: "asc" },
    include: {
      product: { select: { id: true, slug: true, name: true, images: { take: 1, orderBy: { position: "asc" } } } },
      variant: { select: { id: true, price: true, attributes: true, stock: true } },
    },
  });

  const normalizedItems = items.map((item) => ({
    ...item,
    variant: { ...item.variant, price: Number(item.variant.price) },
  }));

  const subtotal = normalizedItems.reduce(
    (sum, item) => sum + item.variant.price * item.quantity,
    0,
  );

  return { cart, items: normalizedItems, subtotal, itemCount: normalizedItems.reduce((n, i) => n + i.quantity, 0) };
}

export async function getCartItemCount() {
  const result = await getCartWithItems();
  return result?.itemCount ?? 0;
}
