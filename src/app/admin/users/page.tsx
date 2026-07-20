import type { Metadata } from "next";
import { UserRoleSelect } from "@/components/admin/user-role-select";
import { formatDate } from "@/lib/format";
import { getAllUsers } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Người dùng" };

export default async function AdminUsersPage() {
  const users = await getAllUsers();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Người dùng</h1>
      <div className="grid gap-2">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
            <div>
              <p className="font-medium">{user.name ?? "(chưa đặt tên)"}</p>
              <p className="text-muted-foreground">
                {user.email} · Tham gia {formatDate(user.createdAt)}
              </p>
            </div>
            <UserRoleSelect userId={user.id} role={user.role} />
          </div>
        ))}
      </div>
    </div>
  );
}
