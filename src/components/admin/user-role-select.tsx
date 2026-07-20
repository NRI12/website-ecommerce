"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateUserRoleAction } from "@/lib/actions/admin-actions";

const ROLE_LABELS: Record<string, string> = {
  CUSTOMER: "Khách hàng",
  VENDOR: "Người bán",
  ADMIN: "Quản trị viên",
};

export function UserRoleSelect({ userId, role }: { userId: string; role: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string | null) {
    if (!value) return;
    startTransition(async () => {
      await updateUserRoleAction(userId, value as "CUSTOMER" | "VENDOR" | "ADMIN");
      router.refresh();
    });
  }

  return (
    <Select items={ROLE_LABELS} value={role} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(ROLE_LABELS).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
