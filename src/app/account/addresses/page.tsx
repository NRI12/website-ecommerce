import type { Metadata } from "next";
import { auth } from "@/auth";
import { AddressList } from "@/components/account/address-list";
import { getAddressesForUser } from "@/lib/data/addresses";

export const metadata: Metadata = { title: "Sổ địa chỉ" };

export default async function AddressesPage() {
  const session = await auth();
  if (!session?.user) return null;

  const addresses = await getAddressesForUser(session.user.id);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Sổ địa chỉ</h1>
      <AddressList addresses={addresses} />
    </div>
  );
}
