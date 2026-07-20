import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

interface VariantSeed {
  sku: string;
  attributes: Record<string, string>;
  price: number;
  compareAtPrice?: number;
  stock: number;
}

interface ProductSeed {
  name: string;
  slug: string;
  description: string;
  categorySlug: string;
  vendorSlug: string;
  images: number;
  variants: VariantSeed[];
}

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
    { email: "vendor@example.com", name: "Chủ shop Demo", storeName: "Demo Store", slug: "demo-store", description: "Gian hàng tổng hợp, chuyên đồ điện tử và phụ kiện công nghệ chính hãng." },
    { email: "vendor2@example.com", name: "Chủ shop Thời Trang", storeName: "Urban Style", slug: "urban-style", description: "Thời trang nam nữ theo phong cách tối giản, chất liệu bền, giá hợp lý." },
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

  // ---------- Products ----------
  const productSeeds: ProductSeed[] = [
    {
      name: "Áo thun basic cotton",
      slug: "ao-thun-basic-cotton",
      description:
        "Áo thun cotton 100% co giãn nhẹ, thoáng khí quanh năm. Form regular fit vừa vặn, dễ phối đồ đi làm, đi chơi hay tập thể thao nhẹ. Đường may chắc chắn, không xù lông sau nhiều lần giặt.",
      categorySlug: "thoi-trang",
      vendorSlug: "urban-style",
      images: 3,
      variants: [
        { sku: "TSHIRT-BLK-M", attributes: { "màu sắc": "Đen", "kích thước": "M" }, price: 149000, stock: 25 },
        { sku: "TSHIRT-BLK-L", attributes: { "màu sắc": "Đen", "kích thước": "L" }, price: 149000, stock: 18 },
        { sku: "TSHIRT-WHT-M", attributes: { "màu sắc": "Trắng", "kích thước": "M" }, price: 149000, stock: 30 },
        { sku: "TSHIRT-WHT-L", attributes: { "màu sắc": "Trắng", "kích thước": "L" }, price: 149000, stock: 0 },
      ],
    },
    {
      name: "Áo sơ mi công sở nam dài tay",
      slug: "ao-so-mi-cong-so-nam",
      description:
        "Áo sơ mi vải kate lụa cao cấp, ít nhăn, giữ form tốt sau khi giặt máy. Kiểu dáng slim fit hiện đại, phù hợp môi trường công sở lẫn dự tiệc. Có 3 màu cơ bản dễ phối.",
      categorySlug: "thoi-trang",
      vendorSlug: "urban-style",
      images: 3,
      variants: [
        { sku: "SHIRT-WHT-39", attributes: { "màu sắc": "Trắng", "size cổ": "39" }, price: 289000, compareAtPrice: 359000, stock: 20 },
        { sku: "SHIRT-BLU-39", attributes: { "màu sắc": "Xanh nhạt", "size cổ": "39" }, price: 289000, compareAtPrice: 359000, stock: 15 },
        { sku: "SHIRT-WHT-41", attributes: { "màu sắc": "Trắng", "size cổ": "41" }, price: 289000, compareAtPrice: 359000, stock: 12 },
      ],
    },
    {
      name: "Quần jeans slim fit nam",
      slug: "quan-jeans-slim-fit-nam",
      description:
        "Quần jeans co giãn 4 chiều, form slim fit tôn dáng nhưng vẫn thoải mái vận động. Chất liệu denim bền màu, không bai giãn sau thời gian dài sử dụng.",
      categorySlug: "thoi-trang",
      vendorSlug: "urban-style",
      images: 2,
      variants: [
        { sku: "JEANS-29", attributes: { size: "29" }, price: 399000, stock: 14 },
        { sku: "JEANS-30", attributes: { size: "30" }, price: 399000, stock: 22 },
        { sku: "JEANS-31", attributes: { size: "31" }, price: 399000, stock: 9 },
        { sku: "JEANS-32", attributes: { size: "32" }, price: 399000, stock: 0 },
      ],
    },
    {
      name: "Váy midi hoa nhí nữ",
      slug: "vay-midi-hoa-nhi-nu",
      description:
        "Váy midi họa tiết hoa nhí nữ tính, chất liệu voan 2 lớp mềm mại, không xuyên thấu. Thiết kế eo chun co giãn phù hợp nhiều dáng người, thích hợp mặc đi làm hoặc dạo phố.",
      categorySlug: "thoi-trang",
      vendorSlug: "urban-style",
      images: 3,
      variants: [
        { sku: "DRESS-S", attributes: { size: "S" }, price: 329000, stock: 16 },
        { sku: "DRESS-M", attributes: { size: "M" }, price: 329000, stock: 20 },
        { sku: "DRESS-L", attributes: { size: "L" }, price: 329000, stock: 7 },
      ],
    },
    {
      name: "Áo khoác gió chống nước unisex",
      slug: "ao-khoac-gio-chong-nuoc",
      description:
        "Áo khoác gió 2 lớp chống thấm nước nhẹ, cản gió tốt, có mũ trùm đầu tháo rời. Thiết kế unisex trẻ trung, gọn nhẹ dễ mang theo khi đi du lịch.",
      categorySlug: "thoi-trang",
      vendorSlug: "urban-style",
      images: 2,
      variants: [
        { sku: "JACKET-BLK-L", attributes: { "màu sắc": "Đen", size: "L" }, price: 459000, compareAtPrice: 549000, stock: 11 },
        { sku: "JACKET-NAVY-L", attributes: { "màu sắc": "Xanh navy", size: "L" }, price: 459000, compareAtPrice: 549000, stock: 8 },
      ],
    },
    {
      name: "Tai nghe không dây chống ồn",
      slug: "tai-nghe-khong-day-chong-on",
      description:
        "Tai nghe Bluetooth 5.3 tích hợp chống ồn chủ động (ANC), khử tạp âm môi trường hiệu quả. Pin sử dụng liên tục 30 giờ, sạc nhanh 10 phút dùng 2 giờ. Đi kèm hộp sạc nhỏ gọn.",
      categorySlug: "dien-tu",
      vendorSlug: "demo-store",
      images: 3,
      variants: [
        { sku: "HEADPHONE-BLK", attributes: { "màu sắc": "Đen" }, price: 1290000, compareAtPrice: 1590000, stock: 12 },
        { sku: "HEADPHONE-WHT", attributes: { "màu sắc": "Trắng" }, price: 1290000, compareAtPrice: 1590000, stock: 8 },
      ],
    },
    {
      name: "Bàn phím cơ gaming RGB",
      slug: "ban-phim-co-gaming-rgb",
      description:
        "Bàn phím cơ 87 phím switch blue/red tùy chọn, đèn nền RGB 16.8 triệu màu tùy chỉnh qua phần mềm. Khung nhôm nguyên khối chống rung, keycap PBT chống mài mòn.",
      categorySlug: "dien-tu",
      vendorSlug: "demo-store",
      images: 3,
      variants: [
        { sku: "KEYB-BLUE", attributes: { switch: "Blue switch" }, price: 890000, stock: 18 },
        { sku: "KEYB-RED", attributes: { switch: "Red switch" }, price: 890000, stock: 14 },
      ],
    },
    {
      name: "Chuột không dây văn phòng",
      slug: "chuot-khong-day-van-phong",
      description:
        "Chuột không dây kết nối 2.4GHz ổn định, thiết kế công thái học giảm mỏi cổ tay khi dùng lâu. Pin AA sử dụng liên tục lên đến 12 tháng.",
      categorySlug: "dien-tu",
      vendorSlug: "demo-store",
      images: 2,
      variants: [{ sku: "MOUSE-01", attributes: { "màu sắc": "Đen" }, price: 199000, stock: 45 }],
    },
    {
      name: "Loa bluetooth mini chống nước",
      slug: "loa-bluetooth-mini-chong-nuoc",
      description:
        "Loa Bluetooth mini công suất 10W, chuẩn chống nước IPX7 dùng thoải mái ngoài trời, đi biển. Kết nối ổn định trong bán kính 10m, pin dùng liên tục 8 giờ.",
      categorySlug: "dien-tu",
      vendorSlug: "demo-store",
      images: 3,
      variants: [
        { sku: "SPEAKER-BLK", attributes: { "màu sắc": "Đen" }, price: 359000, stock: 20 },
        { sku: "SPEAKER-RED", attributes: { "màu sắc": "Đỏ" }, price: 359000, stock: 16 },
      ],
    },
    {
      name: "Sạc dự phòng 20000mAh sạc nhanh",
      slug: "sac-du-phong-20000mah",
      description:
        "Pin sạc dự phòng dung lượng 20000mAh, hỗ trợ sạc nhanh 22.5W qua cổng USB-C và USB-A. Có màn hình LED hiển thị phần trăm pin còn lại, sạc đầy cho điện thoại 4-5 lần.",
      categorySlug: "dien-tu",
      vendorSlug: "demo-store",
      images: 2,
      variants: [{ sku: "POWERBANK-20K", attributes: { "màu sắc": "Đen" }, price: 449000, compareAtPrice: 529000, stock: 30 }],
    },
    {
      name: "Đèn bàn LED cảm ứng",
      slug: "den-ban-led-cam-ung",
      description:
        "Đèn bàn LED 3 chế độ ánh sáng (vàng, trắng, trung tính), điều chỉnh độ sáng bằng cảm ứng chạm. Tích hợp cổng sạc USB tiện lợi, gập gọn tiết kiệm diện tích bàn học/làm việc.",
      categorySlug: "nha-cua-doi-song",
      vendorSlug: "nha-xinh-market",
      images: 3,
      variants: [{ sku: "LAMP-01", attributes: { "màu sắc": "Trắng" }, price: 259000, stock: 40 }],
    },
    {
      name: "Bộ chăn ga gối cotton lụa",
      slug: "bo-chan-ga-goi-cotton-lua",
      description:
        "Bộ chăn ga gối 5 món chất liệu cotton lụa mềm mịn, thấm hút mồ hôi tốt, giữ ấm mùa đông và mát mẻ mùa hè. Họa tiết trơn tối giản dễ phối nội thất phòng ngủ.",
      categorySlug: "nha-cua-doi-song",
      vendorSlug: "nha-xinh-market",
      images: 3,
      variants: [
        { sku: "BEDSET-1M6", attributes: { "kích thước": "1m6 x 2m" }, price: 599000, stock: 15 },
        { sku: "BEDSET-1M8", attributes: { "kích thước": "1m8 x 2m" }, price: 649000, stock: 10 },
      ],
    },
    {
      name: "Máy lọc không khí mini để bàn",
      slug: "may-loc-khong-khi-mini",
      description:
        "Máy lọc không khí cỡ nhỏ dùng màng lọc HEPA, loại bỏ bụi mịn PM2.5, phấn hoa và mùi hôi trong phòng làm việc, phòng ngủ nhỏ. Vận hành êm ái dưới 30dB.",
      categorySlug: "nha-cua-doi-song",
      vendorSlug: "nha-xinh-market",
      images: 2,
      variants: [{ sku: "AIRPURIFIER-01", attributes: { "màu sắc": "Trắng" }, price: 799000, compareAtPrice: 999000, stock: 12 }],
    },
    {
      name: "Bình giữ nhiệt inox 500ml",
      slug: "binh-giu-nhiet-inox-500ml",
      description:
        "Bình giữ nhiệt 2 lớp inox 304 an toàn thực phẩm, giữ nóng 12 giờ và giữ lạnh 24 giờ. Nắp vặn kín chống rò rỉ, thiết kế nhỏ gọn dễ mang theo khi đi làm, đi học.",
      categorySlug: "nha-cua-doi-song",
      vendorSlug: "nha-xinh-market",
      images: 2,
      variants: [
        { sku: "BOTTLE-BLK", attributes: { "màu sắc": "Đen" }, price: 179000, stock: 35 },
        { sku: "BOTTLE-PNK", attributes: { "màu sắc": "Hồng" }, price: 179000, stock: 28 },
      ],
    },
    {
      name: "Thảm yoga chống trượt",
      slug: "tham-yoga-chong-truot",
      description:
        "Thảm tập yoga độ dày 6mm chất liệu TPE thân thiện môi trường, bề mặt chống trượt cả hai mặt. Trọng lượng nhẹ, cuộn gọn dễ mang theo phòng gym hoặc đi công tác.",
      categorySlug: "the-thao-da-ngoai",
      vendorSlug: "nha-xinh-market",
      images: 2,
      variants: [
        { sku: "YOGAMAT-PURP", attributes: { "màu sắc": "Tím" }, price: 219000, stock: 24 },
        { sku: "YOGAMAT-BLU", attributes: { "màu sắc": "Xanh dương" }, price: 219000, stock: 19 },
      ],
    },
    {
      name: "Sách: Nhà Giả Kim",
      slug: "sach-nha-gia-kim",
      description:
        "Tiểu thuyết kinh điển của Paulo Coelho kể về hành trình theo đuổi giấc mơ của chàng chăn cừu Santiago. Bản dịch tiếng Việt, bìa mềm, giấy đẹp.",
      categorySlug: "sach",
      vendorSlug: "demo-store",
      images: 1,
      variants: [{ sku: "BOOK-ALCHEMIST", attributes: { bìa: "Mềm" }, price: 79000, stock: 60 }],
    },
    {
      name: "Sách: Đắc Nhân Tâm",
      slug: "sach-dac-nhan-tam",
      description:
        "Cuốn sách kỹ năng sống bán chạy nhất mọi thời đại của Dale Carnegie, đúc kết nghệ thuật đối nhân xử thế và xây dựng mối quan hệ bền vững.",
      categorySlug: "sach",
      vendorSlug: "demo-store",
      images: 1,
      variants: [{ sku: "BOOK-DNT", attributes: { bìa: "Mềm" }, price: 86000, compareAtPrice: 108000, stock: 50 }],
    },
    {
      name: "Sách: Nhà Lãnh Đạo Không Chức Danh",
      slug: "sach-nha-lanh-dao-khong-chuc-danh",
      description:
        "Cuốn sách của Robin Sharma truyền cảm hứng về tinh thần lãnh đạo trong công việc và cuộc sống, dù bạn ở bất kỳ vị trí nào.",
      categorySlug: "sach",
      vendorSlug: "demo-store",
      images: 1,
      variants: [{ sku: "BOOK-LEADER", attributes: { bìa: "Mềm" }, price: 95000, stock: 40 }],
    },
    {
      name: "Sách thiếu nhi: Doraemon trọn bộ (hộp 5 tập)",
      slug: "sach-doraemon-hop-5-tap",
      description:
        "Bộ truyện tranh Doraemon kinh điển dành cho thiếu nhi, hộp 5 tập chọn lọc, giấy in màu đẹp, phù hợp làm quà tặng cho các bé yêu truyện tranh.",
      categorySlug: "sach",
      vendorSlug: "demo-store",
      images: 1,
      variants: [{ sku: "BOOK-DORAEMON-5", attributes: { "số tập": "5" }, price: 175000, stock: 22 }],
    },
    {
      name: "Sữa rửa mặt trà xanh",
      slug: "sua-rua-mat-tra-xanh",
      description:
        "Sữa rửa mặt chiết xuất trà xanh, làm sạch sâu bụi bẩn và dầu thừa mà không gây khô căng da. Phù hợp cho da dầu, da hỗn hợp, dùng được hằng ngày.",
      categorySlug: "lam-dep",
      vendorSlug: "nha-xinh-market",
      images: 2,
      variants: [{ sku: "CLEANSER-100ML", attributes: { "dung tích": "100ml" }, price: 129000, stock: 50 }],
    },
    {
      name: "Kem chống nắng SPF50",
      slug: "kem-chong-nang-spf50",
      description:
        "Kem chống nắng phổ rộng SPF50 PA+++, kết cấu mỏng nhẹ không gây bết dính hay bóng dầu, thấm nhanh, phù hợp dùng hằng ngày trước khi ra ngoài.",
      categorySlug: "lam-dep",
      vendorSlug: "nha-xinh-market",
      images: 2,
      variants: [{ sku: "SUNSCREEN-50", attributes: { "dung tích": "50ml" }, price: 189000, compareAtPrice: 229000, stock: 45 }],
    },
    {
      name: "Son dưỡng môi không màu",
      slug: "son-duong-moi-khong-mau",
      description:
        "Son dưỡng môi thành phần tự nhiên, cấp ẩm sâu, làm mềm mịn môi khô nứt nẻ. Không màu, không mùi, dùng được cho cả nam và nữ.",
      categorySlug: "lam-dep",
      vendorSlug: "nha-xinh-market",
      images: 1,
      variants: [{ sku: "LIPBALM-01", attributes: {}, price: 45000, stock: 70 }],
    },
    {
      name: "Nước hoa hồng cấp ẩm",
      slug: "nuoc-hoa-hong-cap-am",
      description:
        "Nước hoa hồng dịu nhẹ giúp cân bằng độ pH cho da sau khi rửa mặt, cấp ẩm tức thì và se khít lỗ chân lông. Không chứa cồn, an toàn cho da nhạy cảm.",
      categorySlug: "lam-dep",
      vendorSlug: "nha-xinh-market",
      images: 2,
      variants: [{ sku: "TONER-200ML", attributes: { "dung tích": "200ml" }, price: 159000, stock: 38 }],
    },
    {
      name: "Giày chạy bộ êm chân",
      slug: "giay-chay-bo-em-chan",
      description:
        "Giày chạy bộ đế foam siêu nhẹ, đàn hồi tốt, giảm áp lực lên khớp gối khi chạy đường dài. Upper lưới thoáng khí, phù hợp cả tập gym và chạy bộ hằng ngày.",
      categorySlug: "the-thao-da-ngoai",
      vendorSlug: "urban-style",
      images: 3,
      variants: [
        { sku: "SHOE-40", attributes: { size: "40" }, price: 549000, compareAtPrice: 699000, stock: 10 },
        { sku: "SHOE-41", attributes: { size: "41" }, price: 549000, compareAtPrice: 699000, stock: 14 },
        { sku: "SHOE-42", attributes: { size: "42" }, price: 549000, compareAtPrice: 699000, stock: 8 },
      ],
    },
    {
      name: "Balo du lịch chống nước 30L",
      slug: "balo-du-lich-chong-nuoc-30l",
      description:
        "Balo du lịch dung tích 30L chất liệu vải chống nước, nhiều ngăn tiện lợi kèm ngăn đựng laptop 15.6 inch. Quai đeo đệm êm, phù hợp phượt và du lịch dài ngày.",
      categorySlug: "the-thao-da-ngoai",
      vendorSlug: "urban-style",
      images: 2,
      variants: [
        { sku: "BACKPACK-BLK", attributes: { "màu sắc": "Đen" }, price: 389000, stock: 20 },
        { sku: "BACKPACK-GRY", attributes: { "màu sắc": "Xám" }, price: 389000, stock: 15 },
      ],
    },
  ];

  const productMap: Record<string, { id: string; categoryId: string }> = {};

  for (const p of productSeeds) {
    const category = categories.find((c) => c.slug === p.categorySlug)!;
    const vendor = vendors[p.vendorSlug];
    const product = await db.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        vendorId: vendor.id,
        categoryId: category.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        status: "ACTIVE",
        images: {
          create: Array.from({ length: p.images }).map((_, i) => ({
            url: `https://picsum.photos/seed/${p.slug}-${i}/800/800`,
            alt: p.name,
            position: i,
          })),
        },
      },
    });
    productMap[p.slug] = { id: product.id, categoryId: category.id };

    for (const v of p.variants) {
      await db.productVariant.upsert({
        where: { sku: v.sku },
        update: {},
        create: {
          productId: product.id,
          sku: v.sku,
          attributes: v.attributes,
          price: v.price,
          compareAtPrice: v.compareAtPrice ?? null,
          stock: v.stock,
        },
      });
    }
  }

  // ---------- Reviews ----------
  const reviewSeeds = [
    { slug: "ao-thun-basic-cotton", userIdx: 0, rating: 5, comment: "Vải mát, form đẹp, mặc rất thoải mái. Sẽ mua thêm màu khác." },
    { slug: "ao-thun-basic-cotton", userIdx: 1, rating: 4, comment: "Chất vải ổn so với giá tiền, giao hàng nhanh." },
    { slug: "tai-nghe-khong-day-chong-on", userIdx: 1, rating: 5, comment: "Chống ồn tốt, pin trâu, đáng tiền." },
    { slug: "tai-nghe-khong-day-chong-on", userIdx: 2, rating: 4, comment: "Âm thanh hay nhưng hộp sạc hơi to." },
    { slug: "ban-phim-co-gaming-rgb", userIdx: 2, rating: 5, comment: "Gõ đã tay, đèn RGB đẹp, đóng gói cẩn thận." },
    { slug: "den-ban-led-cam-ung", userIdx: 0, rating: 4, comment: "Đèn sáng đều, cảm ứng nhạy, giá hợp lý." },
    { slug: "binh-giu-nhiet-inox-500ml", userIdx: 1, rating: 5, comment: "Giữ nhiệt tốt như mô tả, màu đẹp." },
    { slug: "sach-nha-gia-kim", userIdx: 2, rating: 5, comment: "Sách hay, in đẹp, giao hàng nhanh." },
    { slug: "sach-dac-nhan-tam", userIdx: 0, rating: 5, comment: "Kinh điển, ai cũng nên đọc ít nhất một lần." },
    { slug: "kem-chong-nang-spf50", userIdx: 1, rating: 4, comment: "Không gây bí da, thấm nhanh, sẽ mua lại." },
    { slug: "giay-chay-bo-em-chan", userIdx: 2, rating: 5, comment: "Đi êm chân, nhẹ, phù hợp chạy bộ mỗi sáng." },
    { slug: "quan-jeans-slim-fit-nam", userIdx: 0, rating: 3, comment: "Form ổn nhưng màu hơi khác so với ảnh." },
  ];

  for (const r of reviewSeeds) {
    const product = productMap[r.slug];
    const user = customers[r.userIdx];
    const existing = await db.review.findFirst({ where: { productId: product.id, userId: user.id } });
    if (!existing) {
      await db.review.create({
        data: { productId: product.id, userId: user.id, rating: r.rating, comment: r.comment },
      });
    }
  }

  for (const slug of new Set(reviewSeeds.map((r) => r.slug))) {
    const agg = await db.review.aggregate({
      where: { productId: productMap[slug].id },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await db.product.update({
      where: { id: productMap[slug].id },
      data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count.rating },
    });
  }

  // ---------- Sample orders (spread over the last 14 days, for dashboards) ----------
  const orderSlugPool = [
    "ao-thun-basic-cotton",
    "tai-nghe-khong-day-chong-on",
    "den-ban-led-cam-ung",
    "sach-nha-gia-kim",
    "quan-jeans-slim-fit-nam",
    "sac-du-phong-20000mah",
    "kem-chong-nang-spf50",
    "giay-chay-bo-em-chan",
    "binh-giu-nhiet-inox-500ml",
    "sach-dac-nhan-tam",
  ];

  const existingOrders = await db.order.count();
  if (existingOrders === 0) {
    for (let i = 0; i < 12; i++) {
      const customer = customers[i % customers.length];
      const address = addresses[i % addresses.length];
      const daysAgo = Math.floor(Math.random() * 14);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      const itemCount = 1 + Math.floor(Math.random() * 2);
      const pickedSlugs = [...orderSlugPool].sort(() => Math.random() - 0.5).slice(0, itemCount);

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

      for (const slug of pickedSlugs) {
        const seed = productSeeds.find((p) => p.slug === slug)!;
        const variantSeed = seed.variants.find((v) => v.stock > 0) ?? seed.variants[0];
        const variant = await db.productVariant.findUnique({ where: { sku: variantSeed.sku } });
        if (!variant) continue;
        const quantity = 1 + Math.floor(Math.random() * 2);
        const lineTotal = Number(variant.price) * quantity;
        subtotal += lineTotal;
        const vendorSlug = seed.vendorSlug;
        itemsToCreate.push({
          vendorId: vendors[vendorSlug].id,
          productId: productMap[slug].id,
          variantId: variant.id,
          productNameSnapshot: seed.name,
          variantSnapshot: variantSeed.attributes,
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
      const providers = ["COD", "STRIPE", "VNPAY", "MOMO"] as const;

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
    products: productSeeds.length,
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
