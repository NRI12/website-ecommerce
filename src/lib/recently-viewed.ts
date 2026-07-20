const STORAGE_KEY = "recently-viewed-products";
const MAX_ITEMS = 12;

export interface RecentlyViewedItem {
  slug: string;
  name: string;
  imageUrl: string | null;
  price: number;
}

export function getRecentlyViewed(): RecentlyViewedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordRecentlyViewed(item: RecentlyViewedItem) {
  if (typeof window === "undefined") return;
  const existing = getRecentlyViewed().filter((i) => i.slug !== item.slug);
  const updated = [item, ...existing].slice(0, MAX_ITEMS);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
