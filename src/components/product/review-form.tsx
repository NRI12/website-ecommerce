"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createReviewAction } from "@/lib/actions/review-actions";

export function ReviewForm({ productId }: { productId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await createReviewAction({ productId, rating, comment: comment || undefined });
      if (!result.success) {
        setError(result.message ?? "Có lỗi xảy ra.");
        return;
      }
      setComment("");
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border p-4">
      <p className="mb-2 text-sm font-medium">Viết đánh giá của bạn</p>
      <div className="mb-3 flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <button key={i} type="button" onClick={() => setRating(i + 1)} aria-label={`${i + 1} sao`}>
            <Star className={`size-5 ${i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
          </button>
        ))}
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
        rows={3}
      />
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      <Button className="mt-3" size="sm" disabled={isPending} onClick={handleSubmit}>
        {isPending ? "Đang gửi..." : "Gửi đánh giá"}
      </Button>
    </div>
  );
}
