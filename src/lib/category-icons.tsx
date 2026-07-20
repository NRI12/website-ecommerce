import { Shirt, Cpu, Home, BookOpen, Sparkles, Dumbbell, ShoppingBag, type LucideIcon } from "lucide-react";

const ICONS_BY_SLUG: Record<string, LucideIcon> = {
  "thoi-trang": Shirt,
  "dien-tu": Cpu,
  "nha-cua-doi-song": Home,
  sach: BookOpen,
  "lam-dep": Sparkles,
  "the-thao-da-ngoai": Dumbbell,
};

export function getCategoryIcon(slug: string): LucideIcon {
  return ICONS_BY_SLUG[slug] ?? ShoppingBag;
}
