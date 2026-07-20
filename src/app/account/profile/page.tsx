import type { Metadata } from "next";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ProfileForm } from "@/components/account/profile-form";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Hồ sơ của tôi" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true, createdAt: true, emailVerified: true },
  });
  if (!user) return null;

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8">
      <h1 className="mb-1 text-2xl font-semibold">Hồ sơ của tôi</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {user.email} · Thành viên từ {formatDate(user.createdAt)}
        {!user.emailVerified ? " · Email chưa xác nhận" : ""}
      </p>
      <ProfileForm name={user.name ?? ""} phone={user.phone ?? ""} />
    </div>
  );
}
