"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";

interface Suggestion {
  slug: string;
  name: string;
  imageUrl: string | null;
  minPrice: number;
}

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = query.trim();
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (trimmed.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`/api/search-suggestions?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
      } catch {
        // ignore aborted/failed requests
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function submitSearch(value: string) {
    setOpen(false);
    router.push(value ? `/products?search=${encodeURIComponent(value)}` : "/products");
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitSearch(query.trim());
        }}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          placeholder="Tìm kiếm sản phẩm..."
          className="pl-9"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
      </form>

      {open && suggestions.length > 0 ? (
        <div className="absolute top-full z-50 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-md">
          {suggestions.map((item) => (
            <Link
              key={item.slug}
              href={`/products/${item.slug}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 p-2.5 hover:bg-muted"
            >
              <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                {item.imageUrl ? <Image src={item.imageUrl} alt="" fill className="object-cover" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{item.name}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(item.minPrice)}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
