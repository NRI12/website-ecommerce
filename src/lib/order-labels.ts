export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xử lý",
  PAID: "Đã thanh toán",
  PROCESSING: "Đang chuẩn bị hàng",
  SHIPPED: "Đang giao hàng",
  DELIVERED: "Đã giao hàng",
  CANCELLED: "Đã hủy",
  REFUNDED: "Đã hoàn tiền",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ thanh toán",
  SUCCEEDED: "Đã thanh toán",
  FAILED: "Thất bại",
  REFUNDED: "Đã hoàn tiền",
};

export const PAYMENT_PROVIDER_LABELS: Record<string, string> = {
  STRIPE: "Thẻ quốc tế (Stripe)",
  VNPAY: "VNPay",
  MOMO: "Momo",
  COD: "Thanh toán khi nhận hàng",
};
