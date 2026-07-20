import type { Metadata } from "next";
import { StaticPage } from "@/components/layout/static-page";

export const metadata: Metadata = { title: "Chính sách đổi trả" };

export default function ReturnsPolicyPage() {
  return (
    <StaticPage title="Chính sách đổi trả">
      <h2>Điều kiện đổi trả</h2>
      <ul>
        <li>Trong vòng 7 ngày kể từ khi nhận hàng</li>
        <li>Sản phẩm còn nguyên tem mác, chưa qua sử dụng</li>
        <li>Có hóa đơn hoặc mã đơn hàng liên quan</li>
      </ul>
      <h2>Trường hợp không áp dụng</h2>
      <ul>
        <li>Sản phẩm giảm giá trên 50%</li>
        <li>Sản phẩm chăm sóc cá nhân đã mở seal vì lý do vệ sinh</li>
      </ul>
      <h2>Quy trình</h2>
      <p>
        Vào mục <strong>Đơn hàng của tôi</strong>, chọn đơn hàng cần đổi trả và liên hệ đội ngũ
        hỗ trợ qua email bên dưới để được hướng dẫn chi tiết.
      </p>
    </StaticPage>
  );
}
