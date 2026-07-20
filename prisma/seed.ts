import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

interface ScrapedProduct {
  sourceId: number;
  name: string;
  slug: string;
  description: string;
  categorySlug: string;
  brand: string | null;
  images: string[];
  price: number;
  compareAtPrice: number | null;
  ratingAvg: number;
  ratingCount: number;
  quantitySold: number;
}

// Deterministic pseudo-random in [0, 1) seeded from a number, so re-running
// the seed produces the same stock/order data instead of drifting each time.
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function stockFor(sourceId: number) {
  const r = seededRandom(sourceId);
  if (r < 0.05) return 0;
  return 5 + Math.floor(r * 115);
}

const CATEGORY_VENDOR: Record<string, string> = {
  "dien-tu": "demo-store",
  sach: "demo-store",
  "thoi-trang": "urban-style",
  "the-thao-da-ngoai": "urban-style",
  "nha-cua-doi-song": "nha-xinh-market",
  "lam-dep": "nha-xinh-market",
};

const REVIEW_TEMPLATES = [
  "Sản phẩm đúng như mô tả, đóng gói cẩn thận, giao hàng nhanh.",
  "Chất lượng tốt so với giá tiền, sẽ ủng hộ shop lần sau.",
  "Dùng ổn, đúng như hình ảnh trên trang. Rất hài lòng.",
  "Giao hàng hơi chậm nhưng sản phẩm chất lượng tốt.",
  "Đóng gói kỹ, hàng chính hãng, sẽ giới thiệu bạn bè mua.",
  "Sản phẩm tạm ổn, dùng được, giá hợp lý.",
  "Rất ưng ý, chất lượng vượt mong đợi so với giá.",
  "Hàng đẹp, đúng mẫu mã, đóng gói cẩn thận.",
];

async function main() {
  // ---------- Users ----------
  const adminPassword = await bcrypt.hash("Admin123!", 12);
  const vendorPassword = await bcrypt.hash("Vendor123!", 12);
  const customerPassword = await bcrypt.hash("Customer123!", 12);

  const admin = await db.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: { name: "Quản trị viên", email: "admin@example.com", password: adminPassword, role: "ADMIN" },
  });

  const vendorUsersData = [
    { email: "vendor@example.com", name: "Chủ shop Demo", storeName: "Demo Store", slug: "demo-store", description: "Gian hàng tổng hợp, chuyên đồ điện tử và sách." },
    { email: "vendor2@example.com", name: "Chủ shop Thời Trang", storeName: "Urban Style", slug: "urban-style", description: "Thời trang nam nữ và đồ thể thao, dã ngoại." },
    { email: "vendor3@example.com", name: "Chủ shop Đời Sống", storeName: "Nhà Xinh Market", slug: "nha-xinh-market", description: "Đồ gia dụng, chăm sóc sức khỏe và làm đẹp cho cả gia đình." },
  ];

  const vendors: Record<string, { id: string }> = {};
  for (const v of vendorUsersData) {
    const user = await db.user.upsert({
      where: { email: v.email },
      update: {},
      create: { name: v.name, email: v.email, password: vendorPassword, role: "VENDOR" },
    });
    const vendor = await db.vendor.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        storeName: v.storeName,
        slug: v.slug,
        description: v.description,
        status: "APPROVED",
        commissionRate: 10,
      },
    });
    vendors[v.slug] = vendor;
  }

  const customersData = [
    { email: "customer@example.com", name: "Khách hàng Demo" },
    { email: "customer2@example.com", name: "Nguyễn Thị Hoa" },
    { email: "customer3@example.com", name: "Trần Văn Nam" },
  ];
  const customers = [];
  for (const c of customersData) {
    const user = await db.user.upsert({
      where: { email: c.email },
      update: {},
      create: { name: c.name, email: c.email, password: customerPassword, role: "CUSTOMER" },
    });
    customers.push(user);
  }

  // ---------- Addresses ----------
  const addressSeeds = [
    { userId: customers[0].id, fullName: "Khách hàng Demo", phone: "0901234567", line1: "12 Nguyễn Huệ", ward: "Bến Nghé", city: "Quận 1", province: "TP. Hồ Chí Minh", isDefault: true },
    { userId: customers[1].id, fullName: "Nguyễn Thị Hoa", phone: "0912345678", line1: "45 Hoàng Diệu", ward: "Điện Biên", city: "Ba Đình", province: "Hà Nội", isDefault: true },
    { userId: customers[2].id, fullName: "Trần Văn Nam", phone: "0987654321", line1: "78 Trần Phú", ward: "Hải Châu 1", city: "Hải Châu", province: "Đà Nẵng", isDefault: true },
  ];
  const addresses = [];
  for (const a of addressSeeds) {
    const existing = await db.address.findFirst({ where: { userId: a.userId } });
    addresses.push(existing ?? (await db.address.create({ data: a })));
  }

  // ---------- Categories ----------
  const categories = await Promise.all(
    [
      { name: "Thời trang", slug: "thoi-trang" },
      { name: "Điện tử", slug: "dien-tu" },
      { name: "Nhà cửa & Đời sống", slug: "nha-cua-doi-song" },
      { name: "Sách", slug: "sach" },
      { name: "Làm đẹp", slug: "lam-dep" },
      { name: "Thể thao & Dã ngoại", slug: "the-thao-da-ngoai" },
    ].map((c) => db.category.upsert({ where: { slug: c.slug }, update: {}, create: c })),
  );

  // ---------- Remove the old hand-written placeholder products ----------
  // These were the original fake/demo catalog (picsum.photos images, made-up
  // descriptions). Deleted outright where nothing references them; archived
  // (hidden from the storefront) where a real order still holds a foreign key
  // to them, since Order/OrderItem history must never be silently destroyed.
  const oldFakeSlugs = [
    "ao-thun-basic-cotton", "ao-so-mi-cong-so-nam", "quan-jeans-slim-fit-nam", "vay-midi-hoa-nhi-nu",
    "ao-khoac-gio-chong-nuoc", "tai-nghe-khong-day-chong-on", "ban-phim-co-gaming-rgb",
    "chuot-khong-day-van-phong", "loa-bluetooth-mini-chong-nuoc", "sac-du-phong-20000mah",
    "den-ban-led-cam-ung", "bo-chan-ga-goi-cotton-lua", "may-loc-khong-khi-mini",
    "binh-giu-nhiet-inox-500ml", "tham-yoga-chong-truot", "sach-nha-gia-kim", "sach-dac-nhan-tam",
    "sach-nha-lanh-dao-khong-chuc-danh", "sach-doraemon-hop-5-tap", "sua-rua-mat-tra-xanh",
    "kem-chong-nang-spf50", "son-duong-moi-khong-mau", "nuoc-hoa-hong-cap-am",
    "giay-chay-bo-em-chan", "balo-du-lich-chong-nuoc-30l",
  ];
  let deletedFake = 0;
  let archivedFake = 0;
  for (const slug of oldFakeSlugs) {
    const existing = await db.product.findUnique({ where: { slug } });
    if (!existing) continue;
    try {
      await db.product.delete({ where: { slug } });
      deletedFake++;
    } catch {
      await db.product.update({ where: { slug }, data: { status: "ARCHIVED" } });
      archivedFake++;
    }
  }
  console.log(`Removed old placeholder catalog: ${deletedFake} deleted, ${archivedFake} archived (order history references them).`);

  // ---------- Products (real data, scraped from Tiki: name, images, price, rating) ----------
  const scrapedProducts: ScrapedProduct[] = JSON.parse(
    readFileSync(join(__dirname, "seed-data/tiki-products.json"), "utf-8"),
  );

  const productMap: Record<string, { id: string; categoryId: string; price: number; vendorSlug: string }> = {};

  for (const p of scrapedProducts) {
    const category = categories.find((c) => c.slug === p.categorySlug);
    if (!category) continue;
    const vendorSlug = CATEGORY_VENDOR[p.categorySlug];
    const vendor = vendors[vendorSlug];

    const product = await db.product.upsert({
      where: { slug: p.slug },
      update: { description: p.description, brand: p.brand, ratingAvg: p.ratingAvg, ratingCount: p.ratingCount },
      create: {
        vendorId: vendor.id,
        categoryId: category.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        brand: p.brand,
        status: "ACTIVE",
        ratingAvg: p.ratingAvg,
        ratingCount: p.ratingCount,
        images: {
          create: p.images.map((url, i) => ({ url, alt: p.name, position: i })),
        },
      },
    });
    productMap[p.slug] = { id: product.id, categoryId: category.id, price: p.price, vendorSlug };

    await db.productVariant.upsert({
      where: { sku: `TIKI-${p.sourceId}` },
      update: {},
      create: {
        productId: product.id,
        sku: `TIKI-${p.sourceId}`,
        attributes: {},
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        stock: stockFor(p.sourceId),
      },
    });
  }

  console.log(`Seeded ${scrapedProducts.length} products across ${categories.length} categories.`);

  // ---------- Reviews (a realistic subset, not every product) ----------
  const reviewCandidates = scrapedProducts.filter((p) => p.ratingCount > 0).slice(0, 120);
  let reviewsCreated = 0;
  for (let i = 0; i < reviewCandidates.length; i++) {
    const p = reviewCandidates[i];
    const productId = productMap[p.slug]?.id;
    if (!productId) continue;
    const reviewCount = 1 + Math.floor(seededRandom(p.sourceId) * 3);
    for (let r = 0; r < reviewCount; r++) {
      const customer = customers[(i + r) % customers.length];
      const existing = await db.review.findFirst({ where: { productId, userId: customer.id } });
      if (existing) continue;
      const rating = Math.max(1, Math.min(5, Math.round(p.ratingAvg + (seededRandom(p.sourceId + r) - 0.5) * 2)));
      const comment = REVIEW_TEMPLATES[(p.sourceId + r) % REVIEW_TEMPLATES.length];
      await db.review.create({ data: { productId, userId: customer.id, rating, comment } });
      reviewsCreated++;
    }
  }
  console.log(`Seeded ${reviewsCreated} reviews.`);

  // ---------- Sample orders (spread over the last 14 days, for dashboards) ----------
  const orderPool = scrapedProducts.filter((p) => stockFor(p.sourceId) > 0).slice(0, 60);

  const existingOrders = await db.order.count();
  if (existingOrders === 0 && orderPool.length > 0) {
    for (let i = 0; i < 25; i++) {
      const customer = customers[i % customers.length];
      const address = addresses[i % addresses.length];
      const daysAgo = Math.floor(seededRandom(i * 97) * 14);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      const itemCount = 1 + Math.floor(seededRandom(i * 13) * 2);
      const pickedIdx = new Set<number>();
      while (pickedIdx.size < itemCount) {
        pickedIdx.add(Math.floor(seededRandom(i * 31 + pickedIdx.size) * orderPool.length));
      }
      const picked = Array.from(pickedIdx).map((idx) => orderPool[idx]);

      let subtotal = 0;
      const itemsToCreate: {
        vendorId: string;
        productId: string;
        variantId: string;
        productNameSnapshot: string;
        variantSnapshot: Record<string, string>;
        unitPrice: number;
        quantity: number;
        subtotal: number;
        commissionRate: number;
      }[] = [];

      for (const p of picked) {
        const variant = await db.productVariant.findUnique({ where: { sku: `TIKI-${p.sourceId}` } });
        if (!variant) continue;
        const quantity = 1 + Math.floor(seededRandom(p.sourceId + i) * 2);
        const lineTotal = Number(variant.price) * quantity;
        subtotal += lineTotal;
        const vendorSlug = CATEGORY_VENDOR[p.categorySlug];
        itemsToCreate.push({
          vendorId: vendors[vendorSlug].id,
          productId: productMap[p.slug].id,
          variantId: variant.id,
          productNameSnapshot: p.name,
          variantSnapshot: {},
          unitPrice: Number(variant.price),
          quantity,
          subtotal: lineTotal,
          commissionRate: 10,
        });
      }

      if (itemsToCreate.length === 0) continue;

      const shippingFee = subtotal >= 500000 ? 0 : 30000;
      const total = subtotal + shippingFee;
      const orderNumber = `ORD${createdAt.getTime()}${i}`;
      const providers = ["COD", "STRIPE"] as const;

      const order = await db.order.create({
        data: {
          orderNumber,
          userId: customer.id,
          addressId: address.id,
          status: i % 5 === 0 ? "DELIVERED" : i % 3 === 0 ? "SHIPPED" : "PAID",
          subtotal,
          shippingFee,
          discountTotal: 0,
          taxTotal: 0,
          total,
          currency: "VND",
          paymentProvider: providers[i % providers.length],
          paymentStatus: "SUCCEEDED",
          createdAt,
          items: { create: itemsToCreate },
        },
      });

      await db.payment.create({
        data: {
          orderId: order.id,
          provider: order.paymentProvider,
          providerRef: `SEED-${orderNumber}`,
          amount: total,
          currency: "VND",
          status: "SUCCEEDED",
        },
      });
    }
  }

  console.log("Seed completed:", {
    admin: admin.email,
    vendors: vendorUsersData.map((v) => v.email),
    customers: customersData.map((c) => c.email),
    products: scrapedProducts.length,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
