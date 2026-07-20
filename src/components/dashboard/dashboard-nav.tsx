"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function DashboardNav({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b pb-2 lg:flex-col lg:border-b-0 lg:border-r lg:pr-4 lg:pb-0">
      {items.map((item) => {
        const active = item.href === pathname || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-md px-3 py-2 text-sm transition-colors",
              active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
