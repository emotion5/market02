import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";

// 어드민 상품 관리용 조회/쓰기 (공개 카탈로그의 repo/service 와 분리).
// 공개 쪽은 isActive=true 만 보지만, 어드민은 비활성 포함 전체를 본다.

export interface AdminProductRow {
  id: string;
  name: string;
  categorySlug: string;
  price: number;
  isActive: boolean;
  variantCount: number;
  image: string;
}

export async function listProductsForAdmin(
  opts: { category?: string; q?: string } = {},
): Promise<AdminProductRow[]> {
  const where: Prisma.ProductWhereInput = {};
  if (opts.category) where.categorySlug = opts.category;
  if (opts.q?.trim()) {
    const q = opts.q.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { id: { contains: q, mode: "insensitive" } },
    ];
  }
  const rows = await prisma.product.findMany({
    where,
    orderBy: [{ categorySlug: "asc" }, { sortOrder: "asc" }],
    include: { _count: { select: { variants: true } } },
  });
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    categorySlug: p.categorySlug,
    price: p.price,
    isActive: p.isActive,
    variantCount: p._count.variants,
    image: p.repImage,
  }));
}
