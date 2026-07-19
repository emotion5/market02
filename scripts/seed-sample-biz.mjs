// biz@test.com 계정에 다양한 상태의 주문·견적 샘플을 넣는 개발용 시더.
// 관리자 화면(대시보드·주문/견적 관리) 확인용. 재실행하면 이 계정의 주문·견적을
// 모두 비우고 새로 채운다(다른 계정 데이터는 건드리지 않음).
//
//   node --env-file=.env scripts/seed-sample-biz.mjs
//
// ※ .env 의 DATABASE_URL(운영 DB)에 직접 쓰므로 테스트 계정 전용으로만 사용.
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const EMAIL = "biz@test.com";
const p2 = (n) => String(n).padStart(2, "0");
const orderNoOf = (d) =>
  `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}`;
const quoteNoOf = (d) => `Q-${orderNoOf(d)}`;
const track = (seed) => `6${String(seed).slice(-11).padStart(11, "0")}`;

const user = await prisma.user.findUnique({ where: { email: EMAIL } });
if (!user) {
  console.log(`${EMAIL} 계정이 없습니다. 중단.`);
  await prisma.$disconnect();
  process.exit(1);
}
const wholesale = user.grade === "WHOLESALE" && user.status === "ACTIVE";

// 옵션 풀 (도매가 있는 옵션 위주)
const variants = await prisma.variant.findMany({
  where: { product: { isActive: true } },
  include: { product: { select: { name: true, repImage: true } } },
  orderBy: { productId: "asc" },
  take: 24,
});
const line = (vi, qty) => {
  const v = variants[vi % variants.length];
  const unitPrice = wholesale && v.wholesalePrice != null ? v.wholesalePrice : v.price;
  return {
    productId: v.productId,
    productName: v.product.name,
    variantId: v.id,
    variantName: v.name,
    color: null,
    image: v.product.repImage,
    unitPrice,
    quantity: qty,
  };
};
const totals = (items) => {
  const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const supply = Math.round(total / 1.1);
  return { total, supply, vat: total - supply };
};

// 기존 것 정리(재실행 가능)
const delO = await prisma.order.deleteMany({ where: { userId: user.id } });
const delQ = await prisma.quote.deleteMany({ where: { userId: user.id } });
console.log(`정리: 주문 ${delO.count} · 견적 ${delQ.count} 삭제`);

const now = Date.now();
const H = 3600000;
const D = 86400000;

// ── 주문 7건: 모든 상태 × 세금계산서(none/pending/issued) ──
const orderSpecs = [
  { status: "PENDING", ageH: 2, tax: "pending", orderer: "새테스트상사 구매팀", items: [[8, 1], [0, 4]] },
  { status: "PENDING", ageH: 5, tax: "none", orderer: "김현장", items: [[2, 10]] },
  { status: "PAID", ageH: 26, tax: "pending", orderer: "새테스트상사 자재부", items: [[9, 2], [3, 6], [11, 1]] },
  { status: "PREPARING", ageH: 50, tax: "none", orderer: "이소장", items: [[4, 8]] },
  { status: "SHIPPING", ageH: 74, tax: "pending", orderer: "새테스트상사 구매팀", items: [[10, 1], [1, 5]] },
  { status: "DELIVERED", ageH: 150, tax: "issued", orderer: "박대리", items: [[5, 3], [6, 3]] },
  { status: "DELIVERED", ageH: 260, tax: "none", orderer: "새테스트상사", items: [[7, 12]] },
];

let madeO = 0;
for (let i = 0; i < orderSpecs.length; i++) {
  const s = orderSpecs[i];
  const created = new Date(now - s.ageH * H - i * 37000);
  const items = s.items.map(([vi, q]) => line(vi, q));
  const { total, supply, vat } = totals(items);
  const shipped = s.status === "SHIPPING" || s.status === "DELIVERED";
  const orderNo = orderNoOf(created);
  const tax =
    s.tax === "none"
      ? undefined
      : {
          create: {
            requested: true,
            bizNo: "111-11-11111",
            company: "새테스트상사",
            status: s.tax === "issued" ? "ISSUED" : "PENDING",
            issuedAt: s.tax === "issued" ? new Date(created.getTime() + 2 * D) : null,
          },
        };
  await prisma.order.create({
    data: {
      orderNo,
      userId: user.id,
      createdAt: created,
      ordererName: s.orderer,
      ordererTel: "010-1234-5678",
      ordererAddress: "서울특별시 강남구 테헤란로 123, 4층",
      ordererMemo: i % 3 === 0 ? "부재 시 경비실에 맡겨주세요" : null,
      depositorName: "새테스트상사",
      paymentMethod: "BANK_TRANSFER",
      status: s.status,
      supply,
      vat,
      shippingFee: 0,
      total,
      courier: shipped ? "MMM 물류 (택배)" : null,
      trackingNumber: shipped ? track(orderNo.replace(/\D/g, "")) : null,
      items: { create: items },
      taxInvoice: tax,
    },
  });
  madeO++;
}

// ── 견적 5건: 유효 3 · 만료 2 (유효기간 14일 기준) ──
const quoteSpecs = [
  { company: "가나건설", contact: "정과장", tel: "010-2222-3333", ageD: 1, items: [[0, 20], [8, 2]] },
  { company: "대성인테리어", contact: "최실장", tel: "010-4444-5555", ageD: 5, items: [[3, 10], [4, 10], [5, 5]] },
  { company: "미래종합건설", contact: "한부장", tel: "010-6666-7777", ageD: 12, items: [[9, 4]] },
  { company: "한빛리모델링", contact: "오사장", tel: "010-8888-9999", ageD: 20, items: [[1, 15], [2, 15]] },
  { company: "제일하우징", contact: "서대리", tel: "010-1010-2020", ageD: 40, items: [[6, 8], [7, 8]] },
];

let madeQ = 0;
for (let i = 0; i < quoteSpecs.length; i++) {
  const s = quoteSpecs[i];
  const issued = new Date(now - s.ageD * D - i * 41000);
  const validUntil = new Date(issued.getTime() + 14 * D);
  const items = s.items.map(([vi, q]) => line(vi, q));
  const { total, supply, vat } = totals(items);
  await prisma.quote.create({
    data: {
      number: quoteNoOf(issued),
      userId: user.id,
      issuedAt: issued,
      validUntil,
      customerCompany: s.company,
      customerContactName: s.contact,
      customerContactTel: s.tel,
      supply,
      vat,
      total,
      status: "ISSUED",
      items: {
        create: items.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          variantId: it.variantId,
          variantName: it.variantName,
          color: null,
          image: it.image,
          unitPrice: it.unitPrice,
          quantity: it.quantity,
        })),
      },
    },
  });
  madeQ++;
}

console.log(`생성 완료: 주문 ${madeO}건, 견적 ${madeQ}건 (${EMAIL}, 회원도매가=${wholesale})`);
await prisma.$disconnect();
