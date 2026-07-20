import "server-only";
import { Resend } from "resend";
import { formatCurrency } from "@/lib/format";

const FROM = process.env.EMAIL_FROM ?? "orders@example.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

let resendClient: Resend | null = null;

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

async function send(to: string, subject: string, html: string) {
  const resend = getResend();
  if (!resend) {
    console.warn(`RESEND_API_KEY not configured — skipping email "${subject}" to ${to}`);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (error) {
    console.error(`Failed to send email "${subject}" to ${to}`, error);
  }
}

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const url = `${APP_URL}/verify-email?email=${encodeURIComponent(email)}&token=${token}`;
  await send(
    email,
    "Xác nhận email của bạn",
    `<p>Xin chào ${name || "bạn"},</p>
     <p>Vui lòng xác nhận email để hoàn tất đăng ký:</p>
     <p><a href="${url}">Xác nhận email</a></p>
     <p>Liên kết hết hạn sau 24 giờ.</p>`,
  );
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const url = `${APP_URL}/reset-password?email=${encodeURIComponent(email)}&token=${token}`;
  await send(
    email,
    "Đặt lại mật khẩu",
    `<p>Xin chào ${name || "bạn"},</p>
     <p>Nhấn vào liên kết sau để đặt lại mật khẩu:</p>
     <p><a href="${url}">Đặt lại mật khẩu</a></p>
     <p>Nếu bạn không yêu cầu điều này, hãy bỏ qua email này. Liên kết hết hạn sau 1 giờ.</p>`,
  );
}

export async function sendOrderConfirmationEmail(
  email: string,
  order: { orderNumber: string; total: number; currency: string },
) {
  await send(
    email,
    `Xác nhận đơn hàng #${order.orderNumber}`,
    `<p>Cảm ơn bạn đã đặt hàng!</p>
     <p>Đơn hàng <strong>#${order.orderNumber}</strong> đã được ghi nhận với tổng giá trị
     <strong>${formatCurrency(order.total, order.currency)}</strong>.</p>
     <p><a href="${APP_URL}/account/orders/${order.orderNumber}">Xem chi tiết đơn hàng</a></p>`,
  );
}

export async function sendOrderStatusEmail(
  email: string,
  order: { orderNumber: string },
  statusLabel: string,
) {
  await send(
    email,
    `Đơn hàng #${order.orderNumber}: ${statusLabel}`,
    `<p>Đơn hàng <strong>#${order.orderNumber}</strong> của bạn hiện đang: <strong>${statusLabel}</strong>.</p>
     <p><a href="${APP_URL}/account/orders/${order.orderNumber}">Xem chi tiết đơn hàng</a></p>`,
  );
}
