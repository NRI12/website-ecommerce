"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddressForm } from "@/components/checkout/address-form";
import { formatCurrency } from "@/lib/format";
import { createOrderAction } from "@/lib/actions/checkout-actions";

interface Address {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  ward: string | null;
  city: string;
  province: string;
}

const PAYMENT_METHODS = [
  { id: "COD", label: "Thanh toán khi nhận hàng (COD)" },
  { id: "STRIPE", label: "Thẻ quốc tế (Stripe)" },
] as const;

export function CheckoutForm({
  addresses,
  subtotal,
  shippingFee,
}: {
  addresses: Address[];
  subtotal: number;
  shippingFee: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [selectedAddressId, setSelectedAddressId] = useState(addresses[0]?.id ?? "");
  const [showAddressForm, setShowAddressForm] = useState(addresses.length === 0);
  const [paymentProvider, setPaymentProvider] = useState<(typeof PAYMENT_METHODS)[number]["id"]>("COD");
  const [couponCode, setCouponCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    if (!selectedAddressId) {
      setError("Vui lòng chọn hoặc thêm địa chỉ giao hàng.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await createOrderAction({
        addressId: selectedAddressId,
        paymentProvider,
        couponCode: couponCode || undefined,
      });

      if (!result.success) {
        setError(result.message);
        return;
      }

      if (result.redirectUrl.startsWith("http")) {
        window.location.href = result.redirectUrl;
      } else {
        window.location.assign(result.redirectUrl);
      }
    });
  }

  const total = Math.max(0, subtotal + shippingFee);

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="grid gap-6 lg:col-span-2">
        <section>
          <h2 className="mb-3 font-semibold">Địa chỉ giao hàng</h2>
          <div className="grid gap-2">
            {addresses.map((address) => (
              <label
                key={address.id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm ${
                  selectedAddressId === address.id ? "border-primary" : ""
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  checked={selectedAddressId === address.id}
                  onChange={() => setSelectedAddressId(address.id)}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium">{address.fullName}</span> · {address.phone}
                  <br />
                  {address.line1}, {address.ward ? `${address.ward}, ` : ""}
                  {address.city}, {address.province}
                </span>
              </label>
            ))}
          </div>
          {showAddressForm ? (
            <div className="mt-3">
              <AddressForm
                onCreated={(id) => {
                  setSelectedAddressId(id);
                  setShowAddressForm(false);
                }}
              />
            </div>
          ) : (
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowAddressForm(true)}>
              + Thêm địa chỉ mới
            </Button>
          )}
        </section>

        <section>
          <h2 className="mb-3 font-semibold">Phương thức thanh toán</h2>
          <div className="grid gap-2">
            {PAYMENT_METHODS.map((method) => (
              <label
                key={method.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm ${
                  paymentProvider === method.id ? "border-primary" : ""
                }`}
              >
                <input
                  type="radio"
                  name="paymentProvider"
                  checked={paymentProvider === method.id}
                  onChange={() => setPaymentProvider(method.id)}
                />
                {method.label}
              </label>
            ))}
          </div>
        </section>
      </div>

      <div className="h-fit rounded-lg border p-4">
        <h2 className="mb-4 font-semibold">Tóm tắt đơn hàng</h2>
        <div className="mb-3">
          <Label htmlFor="couponCode" className="mb-2">Mã giảm giá</Label>
          <Input
            id="couponCode"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="Nhập mã (nếu có)"
          />
        </div>
        <div className="space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tạm tính</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phí vận chuyển</span>
            <span>{shippingFee === 0 ? "Miễn phí" : formatCurrency(shippingFee)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Tổng cộng</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        <Button className="mt-4 w-full" size="lg" disabled={isPending} onClick={handleSubmit}>
          {isPending ? "Đang xử lý..." : "Đặt hàng"}
        </Button>
      </div>
    </div>
  );
}
