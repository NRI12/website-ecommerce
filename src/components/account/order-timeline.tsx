import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "PENDING", label: "Đã đặt hàng" },
  { key: "PAID", label: "Đã thanh toán" },
  { key: "PROCESSING", label: "Đang chuẩn bị" },
  { key: "SHIPPED", label: "Đang giao hàng" },
  { key: "DELIVERED", label: "Đã giao hàng" },
] as const;

export function OrderTimeline({ status }: { status: string }) {
  if (status === "CANCELLED" || status === "REFUNDED") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        <X className="size-4" />
        {status === "CANCELLED" ? "Đơn hàng đã bị hủy." : "Đơn hàng đã được hoàn tiền."}
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => {
        const done = currentIndex >= 0 && i <= currentIndex;
        const isLast = i === STEPS.length - 1;
        return (
          <div key={step.key} className={cn("flex items-center", !isLast && "flex-1")}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs",
                  done ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30 text-muted-foreground",
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </div>
              <span className={cn("w-20 text-center text-[11px]", done ? "text-foreground" : "text-muted-foreground")}>
                {step.label}
              </span>
            </div>
            {!isLast ? (
              <div className={cn("mx-1 h-0.5 flex-1", i < currentIndex ? "bg-primary" : "bg-muted-foreground/20")} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
