"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleWishlistAction } from "@/lib/actions/wishlist-actions";

export function WishlistButton({
  productId,
  initialWishlisted,
  isAuthenticated,
}: {
  productId: string;
  initialWishlisted: boolean;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    startTransition(async () => {
      const result = await toggleWishlistAction(productId);
      if (result.success) {
        setWishlisted(result.wishlisted ?? false);
        toast.success(result.wishlisted ? "Đã thêm vào yêu thích." : "Đã bỏ khỏi yêu thích.");
      } else {
        toast.error(result.message ?? "Có lỗi xảy ra.");
      }
    });
  }

  return (
    <Button variant="outline" size="icon" disabled={isPending} onClick={handleClick} aria-label="Yêu thích">
      <Heart className={wishlisted ? "size-4 fill-destructive text-destructive" : "size-4"} />
    </Button>
  );
}
