import type { Metadata } from "next";
import { auth } from "@/auth";
import { ProductCard } from "@/components/product/product-card";
import { getWishlistForUser } from "@/lib/data/wishlist";

export const metadata: Metadata = { title: "Sản phẩm yêu thích" };

export default async function WishlistPage() {
  const session = await auth();
  if (!session?.user) return null;

  const items = await getWishlistForUser(session.user.id);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Sản phẩm yêu thích</h1>
      {items.length === 0 ? (
        <p className="text-muted-foreground">Bạn chưa lưu sản phẩm yêu thích nào.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <ProductCard key={item.id} product={item.product} />
          ))}
        </div>
      )}
    </div>
  );
}
