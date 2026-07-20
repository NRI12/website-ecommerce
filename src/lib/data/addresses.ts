import { db } from "@/lib/db";

export async function getAddressesForUser(userId: string) {
  return db.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}
