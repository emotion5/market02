import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { getSiteSettings } from "@/server/settings/service";
import { makeQuoteNumber, quoteTotals } from "@/lib/quotes";
import type { SavedQuote, QuoteDraftInput } from "@/lib/quotes";
import type { CartItem } from "@/lib/types";

// 견적서 도메인(발행/조회). localStorage 대체.
// 발행 시 가격은 클라이언트를 믿지 않고 DB 옵션가 + 회원 등급으로 재계산한다(스냅샷).

export class QuoteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuoteError";
  }
}

// 합성 variantId("<vid>::<color>")에서 실제 옵션 id를 얻는다.
function baseVariantId(variantId: string): string {
  return variantId.split("::")[0];
}

async function isWholesaleUser(userId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { grade: true, status: true },
  });
  return u?.grade === "WHOLESALE" && u?.status === "ACTIVE";
}

type QuoteWithItems = Prisma.QuoteGetPayload<{ include: { items: true } }>;

function toSavedQuote(q: QuoteWithItems): SavedQuote {
  const items: CartItem[] = q.items.map((it) => ({
    productId: it.productId,
    variantId: it.variantId,
    productName: it.productName,
    variantName: it.variantName,
    price: it.unitPrice,
    image: it.image,
    quantity: it.quantity,
    color: it.color ?? undefined,
  }));
  return {
    number: q.number,
    issuedAt: q.issuedAt.toISOString(),
    validUntil: q.validUntil.toISOString(),
    expired: q.validUntil.getTime() < Date.now(),
    items,
    customer: {
      company: q.customerCompany,
      contactName: q.customerContactName,
      contactTel: q.customerContactTel,
      bizNo: q.customerBizNo ?? undefined,
      owner: q.customerOwner ?? undefined,
      address: q.customerAddress ?? undefined,
      bizType: q.customerBizType ?? undefined,
      bizItem: q.customerBizItem ?? undefined,
    },
    total: q.total,
    supply: q.supply,
    vat: q.vat,
  };
}

// 견적 발행 → 번호 반환. 가격·유효기한을 서버에서 확정해 스냅샷 저장.
export async function issueQuote(
  userId: string,
  input: QuoteDraftInput,
): Promise<string> {
  if (!input.items.length) {
    throw new QuoteError("견적서에 담긴 상품이 없습니다.");
  }
  const company = input.customer.company.trim();
  if (!company) {
    throw new QuoteError("공급받는 자의 상호를 입력해주세요.");
  }

  // 공급받는자 사업자 정보는 클라이언트 값을 믿지 않고 승인된 회원 프로필에서 스냅샷한다
  // (개인회원은 프로필이 없어 null → 견적서에 사업자 항목이 표시되지 않는다).
  const bp = await prisma.businessProfile.findUnique({ where: { userId } });

  // 옵션가·상품명·이미지를 DB에서 조회(클라이언트 값 불신)
  const baseIds = [...new Set(input.items.map((i) => baseVariantId(i.variantId)))];
  const variants = await prisma.variant.findMany({
    where: { id: { in: baseIds } },
    include: { product: true },
  });
  const vmap = new Map(variants.map((v) => [v.id, v]));
  const wholesale = await isWholesaleUser(userId);

  // 담긴 뒤 삭제된 옵션은 조용히 제외한다(화면에서 이미 대조·안내됨).
  // 전체를 막던 blanket 에러 대신 항목 단위로 처리한다.
  const lineItems = input.items.flatMap((i) => {
    const v = vmap.get(baseVariantId(i.variantId));
    if (!v) return [];
    const unitPrice =
      wholesale && v.wholesalePrice != null ? v.wholesalePrice : v.price;
    return [
      {
        productId: v.productId,
        productName: v.product.name,
        variantId: i.variantId, // 색상 포함 합성 id 보존(재주문 시 그대로 담김)
        variantName: v.name,
        color: i.color ?? null,
        image: v.product.repImage,
        unitPrice,
        quantity: Math.max(1, Math.floor(i.quantity)),
      },
    ];
  });
  if (!lineItems.length) {
    throw new QuoteError("견적서에 담긴 상품이 없습니다.");
  }

  const { total, supply, vat } = quoteTotals(
    lineItems.map((l) => ({ price: l.unitPrice, quantity: l.quantity })),
  );

  const { quoteValidDays } = await getSiteSettings();

  // 번호 채번 + 유니크 충돌 재시도
  for (let attempt = 0; attempt < 6; attempt++) {
    const now = new Date();
    const base = makeQuoteNumber(now);
    const number =
      attempt === 0
        ? base
        : `${base}-${Math.floor(Math.random() * 900 + 100)}`;
    const validUntil = new Date(now.getTime() + quoteValidDays * 86400000);
    try {
      await prisma.quote.create({
        data: {
          number,
          userId,
          issuedAt: now,
          validUntil,
          customerCompany: company,
          customerContactName: input.customer.contactName.trim(),
          customerContactTel: input.customer.contactTel.trim(),
          customerBizNo: bp?.bizNo ?? null,
          customerOwner: bp?.owner ?? null,
          customerAddress: bp?.address ?? null,
          customerBizType: bp?.bizType ?? null,
          customerBizItem: bp?.bizItem ?? null,
          supply,
          vat,
          total,
          status: "ISSUED",
          items: { create: lineItems },
        },
      });
      return number;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002" &&
        attempt < 5
      ) {
        continue; // 번호 충돌 → 재시도
      }
      throw e;
    }
  }
  throw new QuoteError("견적번호 생성에 실패했습니다. 다시 시도해주세요.");
}

// 소유자(또는 발행 당사자)의 견적 한 건 조회. 없거나 남의 것이면 null.
export async function getUserQuote(
  number: string,
  userId: string,
): Promise<SavedQuote | null> {
  const q = await prisma.quote.findUnique({
    where: { number },
    include: { items: true },
  });
  if (!q || q.userId !== userId) return null;
  return toSavedQuote(q);
}

// 내 견적 삭제. 소유자(userId) 조건을 함께 걸어 남의 견적은 못 지운다.
// 견적서는 주문·결제와 무관한 본인 문서라 하드삭제하며, 품목은 cascade 로 정리된다.
// 없거나 남의 것이면 false.
export async function deleteUserQuote(
  number: string,
  userId: string,
): Promise<boolean> {
  const res = await prisma.quote.deleteMany({ where: { number, userId } });
  return res.count > 0;
}

// 내 견적 목록(최신순).
export async function listUserQuotes(userId: string): Promise<SavedQuote[]> {
  const rows = await prisma.quote.findMany({
    where: { userId },
    orderBy: { issuedAt: "desc" },
    include: { items: true },
  });
  return rows.map(toSavedQuote);
}
