"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { getRecentlyViewed, recordRecentlyViewed, type RecentlyViewedItem } from "@/lib/recently-viewed";

export function RecentlyViewedTracker({ item }: { item: RecentlyViewedItem }) {
  useEffect(() => {
    recordRecentlyViewed(item);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.slug]);
  return null;
}

export function RecentlyViewedList({ excludeSlug }: { excludeSlug?: string }) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    // localStorage is only available client-side; this list is empty on the
    // server render, so it must be populated after mount rather than during
    // render, hence the effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(getRecentlyViewed().filter((i) => i.slug !== excludeSlug));
  }, [excludeSlug]);

  if (items.length === 0) return null;

  return (
    <section className="mt-12 border-t pt-8">
      <h2 className="mb-4 text-xl font-semibold">Đã xem gần đây</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/products/${item.slug}`}
            className="flex w-36 shrink-0 flex-col gap-1.5 rounded-lg ring-1 ring-border/60 transition-shadow hover:shadow-md"
          >
            <div className="relative aspect-square overflow-hidden rounded-t-lg bg-muted">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt={item.name} fill sizes="144px" className="object-cover" />
              ) : null}
            </div>
            <div className="px-2 pb-2">
              <p className="line-clamp-2 text-xs leading-tight">{item.name}</p>
              <p className="mt-1 text-sm font-semibold text-primary">{formatCurrency(item.price)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
