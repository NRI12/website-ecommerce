import type { Metadata } from "next";
import { StaticPage } from "@/components/layout/static-page";

export const metadata: Metadata = { title: "Chính sách giao hàng" };

export default function ShippingPolicyPage() {
  return (
    <StaticPage title="Chính sách giao hàng">
      <h2>Phí vận chuyển</h2>
      <p>
        Miễn phí giao hàng cho đơn hàng từ 500.000đ. Đơn hàng dưới mức này áp dụng phí vận
        chuyển đồng giá 30.000đ trên toàn quốc.
      </p>
      <h2>Thời gian giao hàng</h2>
      <ul>
        <li>Nội thành: 1–2 ngày làm việc</li>
        <li>Các tỉnh thành khác: 3–5 ngày làm việc</li>
        <li>Vùng sâu, vùng xa: 5–7 ngày làm việc</li>
      </ul>
      <h2>Theo dõi đơn hàng</h2>
      <p>
        Sau khi đơn hàng được xác nhận, bạn có thể theo dõi trạng thái tại mục{" "}
        <strong>Đơn hàng của tôi</strong> trong tài khoản.
      </p>
    </StaticPage>
  );
}
