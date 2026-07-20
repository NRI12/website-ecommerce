import type { Metadata } from "next";
import { StaticPage } from "@/components/layout/static-page";

export const metadata: Metadata = { title: "Liên hệ" };

export default function ContactPage() {
  return (
    <StaticPage title="Liên hệ">
      <p>Chúng tôi luôn sẵn sàng hỗ trợ bạn. Liên hệ qua các kênh dưới đây:</p>
      <h2>Email hỗ trợ</h2>
      <p>support@example.com</p>
      <h2>Giờ làm việc</h2>
      <p>8:00 – 21:00, tất cả các ngày trong tuần.</p>
      <h2>Gian hàng của bạn</h2>
      <p>
        Nếu bạn là chủ gian hàng cần hỗ trợ, vui lòng đăng nhập và truy cập bảng điều khiển
        gian hàng để gửi yêu cầu hỗ trợ chi tiết hơn.
      </p>
    </StaticPage>
  );
}
