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

  // 옵션가·상품명·이미지를 DB에서 조회(클라이언트 값 불신)
  const baseIds = [...new Set(input.items.map((i) => baseVariantId(i.variantId)))];
  const variants = await prisma.variant.findMany({
    where: { id: { in: baseIds } },
    include: { product: true },
  });
  const vmap = new Map(variants.map((v) => [v.id, v]));
  const wholesale = await isWholesaleUser(userId);

  const lineItems = input.items.map((i) => {
    const v = vmap.get(baseVariantId(i.variantId));
    if (!v) {
      throw new QuoteError(
        "일부 상품 정보가 변경되었습니다. 견적서를 새로 담아주세요.",
      );
    }
    const unitPrice =
      wholesale && v.wholesalePrice != null ? v.wholesalePrice : v.price;
    return {
      productId: v.productId,
      productName: v.product.name,
      variantId: i.variantId, // 색상 포함 합성 id 보존(재주문 시 그대로 담김)
      variantName: v.name,
      color: i.color ?? null,
      image: v.product.repImage,
      unitPrice,
      quantity: Math.max(1, Math.floor(i.quantity)),
    };
  });

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

// 내 견적 목록(최신순).
export async function listUserQuotes(userId: string): Promise<SavedQuote[]> {
  const rows = await prisma.quote.findMany({
    where: { userId },
    orderBy: { issuedAt: "desc" },
    include: { items: true },
  });
  return rows.map(toSavedQuote);
}
