import { prisma } from "@/server/db";
import type { CartItem } from "@/lib/types";

// 장바구니(견적서) 정합성 대조.
// 견적서 보기·결제 진입 시 담긴 항목을 현재 DB와 맞춰본다.
//  - 옵션이 사라진 항목(삭제된 상품 등)은 제외하고 알림 목록에 담는다.
//  - 가격이 바뀐 항목은 최신가로 갱신하고 변경 목록에 담는다(스냅샷은 표시용일 뿐).
// blanket "새로 담아주세요" 대신 항목 단위로 우아하게 처리하기 위한 도메인.

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

export interface CartReconcileResult {
  items: CartItem[]; // 살아남은 항목(최신 상품명·옵션명·이미지·가격으로 갱신)
  removed: { productName: string; variantName: string }[]; // 판매 종료된 항목
  priceChanged: {
    productName: string;
    variantName: string;
    oldPrice: number;
    newPrice: number;
  }[];
}

// 담긴 항목을 현재 DB 기준으로 대조·갱신한다. 로그인 사용자면 등급가를 반영.
export async function reconcileCart(
  userId: string | null,
  items: CartItem[],
): Promise<CartReconcileResult> {
  if (!items.length) return { items: [], removed: [], priceChanged: [] };

  const baseIds = [...new Set(items.map((i) => baseVariantId(i.variantId)))];
  const variants = await prisma.variant.findMany({
    where: { id: { in: baseIds } },
    include: { product: true },
  });
  const vmap = new Map(variants.map((v) => [v.id, v]));
  const wholesale = userId ? await isWholesaleUser(userId) : false;

  const kept: CartItem[] = [];
  const removed: CartReconcileResult["removed"] = [];
  const priceChanged: CartReconcileResult["priceChanged"] = [];

  for (const i of items) {
    const v = vmap.get(baseVariantId(i.variantId));
    if (!v) {
      removed.push({ productName: i.productName, variantName: i.variantName });
      continue;
    }
    const newPrice =
      wholesale && v.wholesalePrice != null ? v.wholesalePrice : v.price;
    if (newPrice !== i.price) {
      priceChanged.push({
        productName: v.product.name,
        variantName: v.name,
        oldPrice: i.price,
        newPrice,
      });
    }
    // 색상 관련 표시값(color/colorName)은 클라이언트 전용이라 그대로 보존한다.
    kept.push({
      ...i,
      productId: v.productId,
      productName: v.product.name,
      variantName: v.name,
      image: v.product.repImage,
      price: newPrice,
    });
  }

  return { items: kept, removed, priceChanged };
}
