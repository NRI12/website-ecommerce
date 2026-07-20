import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getCartWithItems } from "@/lib/cart";
import { getAddressesForUser } from "@/lib/data/addresses";

export const metadata: Metadata = { title: "Thanh toán" };

const FREE_SHIPPING_THRESHOLD = 500_000;
const FLAT_SHIPPING_FEE = 30_000;

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/checkout");

  const [cart, addresses] = await Promise.all([
    getCartWithItems(),
    getAddressesForUser(session.user.id),
  ]);

  if (!cart || cart.items.length === 0) {
    redirect("/cart");
  }

  const shippingFee = cart.subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Thanh toán</h1>
      <CheckoutForm
        addresses={addresses.map((a) => ({
          id: a.id,
          fullName: a.fullName,
          phone: a.phone,
          line1: a.line1,
          ward: a.ward,
          city: a.city,
          province: a.province,
        }))}
        subtotal={cart.subtotal}
        shippingFee={shippingFee}
      />
    </div>
  );
}
