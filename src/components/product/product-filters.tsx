"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "rating", label: "Đánh giá cao" },
  { value: "price-asc", label: "Giá: Thấp đến cao" },
  { value: "price-desc", label: "Giá: Cao đến thấp" },
];

export function ProductFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function handlePriceSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams(searchParams.toString());
    const min = String(formData.get("minPrice") ?? "");
    const max = String(formData.get("maxPrice") ?? "");
    if (min) params.set("minPrice", min);
    else params.delete("minPrice");
    if (max) params.set("maxPrice", max);
    else params.delete("maxPrice");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <form onSubmit={handlePriceSubmit} className="flex items-center gap-2">
        <Input
          name="minPrice"
          type="number"
          placeholder="Giá từ"
          defaultValue={searchParams.get("minPrice") ?? ""}
          className="w-28"
        />
        <span className="text-muted-foreground">–</span>
        <Input
          name="maxPrice"
          type="number"
          placeholder="Giá đến"
          defaultValue={searchParams.get("maxPrice") ?? ""}
          className="w-28"
        />
        <Button type="submit" variant="outline" size="sm">
          Áp dụng
        </Button>
      </form>

      <Select
        items={SORT_OPTIONS}
        value={searchParams.get("sort") ?? "newest"}
        onValueChange={(v) => v && updateParam("sort", v)}
      >
        <SelectTrigger className="ml-auto w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
