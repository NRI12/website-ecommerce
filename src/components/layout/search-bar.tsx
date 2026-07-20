"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchBar() {
  const router = useRouter();

  return (
    <form
      className="relative w-full max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const query = String(formData.get("q") ?? "").trim();
        router.push(query ? `/products?search=${encodeURIComponent(query)}` : "/products");
      }}
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input name="q" placeholder="Tìm kiếm sản phẩm..." className="pl-9" />
    </form>
  );
}
