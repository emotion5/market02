// 발행 흐름 시연용 격리 시드. node --env-file=.env scripts/tax-demo-seed.mjs
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "@node-rs/argon2";
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const ADMIN = "taxdemo-admin@local.test";
const BIZ = "taxdemo-biz@local.test";
const PW = "pass1234";
const ORDER_NO = "TAXDEMO-1";
const RECIP_BIZNO = "123-45-67891";

await prisma.user.upsert({
  where: { email: ADMIN },
  update: { role: "ADMIN", status: "ACTIVE" },
  create: { email: ADMIN, passwordHash: await hash(PW), role: "ADMIN", type: "PERSONAL", status: "ACTIVE" },
});
const biz = await prisma.user.upsert({
  where: { email: BIZ },
  update: {},
  create: {
    email: BIZ, passwordHash: await hash(PW), role: "CUSTOMER", type: "BUSINESS", status: "ACTIVE",
    business: { create: { bizNo: RECIP_BIZNO, company: "테스트거래처", owner: "홍길동", approvedAt: new Date() } },
  },
  include: { business: true },
});
await prisma.order.deleteMany({ where: { orderNo: ORDER_NO } });
const items = [
  { productName: "데모상품A", variantName: "블랙", unitPrice: 33000, quantity: 1 },
  { productName: "데모상품B", variantName: "화이트", unitPrice: 11000, quantity: 2 },
];
const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
const supply = Math.round(total / 1.1);
const vat = total - supply;
await prisma.order.create({
  data: {
    orderNo: ORDER_NO, userId: biz.id, ordererName: "홍길동", ordererTel: "010-0000-0000",
    ordererAddress: "서울시 데모구", depositorName: "홍길동", paymentMethod: "BANK_TRANSFER",
    status: "PAID", supply, vat, shippingFee: 0, total,
    items: { create: items.map((i, idx) => ({
      productId: `p${idx}`, productName: i.productName, variantId: `v${idx}`,
      variantName: i.variantName, image: "x", unitPrice: i.unitPrice, quantity: i.quantity })) },
    taxInvoice: { create: { requested: true, bizNo: RECIP_BIZNO, company: "테스트거래처", status: "PENDING" } },
  },
});
console.log(JSON.stringify({ admin: ADMIN, biz: BIZ, pw: PW, orderNo: ORDER_NO, total, supply, vat }, null, 2));
await prisma.$disconnect();
