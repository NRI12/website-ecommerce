"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "rating", label: "Đánh giá cao" },
  { value: "price-asc", label: "Giá: Thấp đến cao" },
  { value: "price-desc", label: "Giá: Cao đến thấp" },
];

const RATING_OPTIONS = [
  { value: "0", label: "Tất cả đánh giá" },
  { value: "4", label: "Từ 4 sao" },
  { value: "4.5", label: "Từ 4.5 sao" },
];

const ALL_BRANDS = "__all__";

export function ProductFilters({ brands = [] }: { brands?: string[] }) {
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

  const ratingValue = searchParams.get("minRating") ?? "0";
  const brandValue = searchParams.get("brand") ?? ALL_BRANDS;
  const inStockOnly = searchParams.get("inStock") === "1";
  const brandItems = [{ value: ALL_BRANDS, label: "Tất cả thương hiệu" }, ...brands.map((b) => ({ value: b, label: b }))];

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
        items={RATING_OPTIONS}
        value={ratingValue}
        onValueChange={(v) => updateParam("minRating", v && v !== "0" ? v : null)}
      >
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {RATING_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {brands.length > 0 ? (
        <Select
          items={brandItems}
          value={brandValue}
          onValueChange={(v) => updateParam("brand", v && v !== ALL_BRANDS ? v : null)}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {brandItems.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      <Label className="flex items-center gap-2 text-sm font-normal">
        <Checkbox
          checked={inStockOnly}
          onCheckedChange={(checked) => updateParam("inStock", checked ? "1" : null)}
        />
        Còn hàng
      </Label>

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
