import type { Metadata } from "next";
import { StaticPage } from "@/components/layout/static-page";

export const metadata: Metadata = { title: "Giới thiệu" };

export default function AboutPage() {
  return (
    <StaticPage title="Giới thiệu">
      <p>
        Shop là nền tảng thương mại điện tử đa gian hàng, kết nối người mua với hàng ngàn
        nhà bán uy tín trên khắp cả nước. Chúng tôi hướng đến trải nghiệm mua sắm nhanh chóng,
        an toàn và minh bạch cho mọi khách hàng.
      </p>
      <h2>Sứ mệnh</h2>
      <p>
        Giúp người bán nhỏ và vừa dễ dàng tiếp cận khách hàng trực tuyến, đồng thời mang lại
        cho người mua sự đa dạng sản phẩm với mức giá cạnh tranh.
      </p>
      <h2>Cam kết</h2>
      <ul>
        <li>Xác minh và kiểm duyệt gian hàng trước khi cho phép bán trên nền tảng</li>
        <li>Bảo mật thông tin thanh toán theo tiêu chuẩn ngành</li>
        <li>Hỗ trợ đổi trả trong vòng 7 ngày cho hầu hết sản phẩm</li>
      </ul>
    </StaticPage>
  );
}
