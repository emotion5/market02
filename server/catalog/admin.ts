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

// 이미지 업로드 전 신규 상품 대표 이미지 placeholder
export const PLACEHOLDER_IMAGE = "/images/placeholder.svg";

// 카테고리별 다음 상품 ID(카테고리-순번) 와 정렬순서 계산
async function nextIdAndSort(
  categorySlug: string,
): Promise<{ id: string; sortOrder: number }> {
  const rows = await prisma.product.findMany({
    where: { categorySlug },
    select: { id: true, sortOrder: true },
  });
  let maxSeq = 0;
  let maxSort = -1;
  for (const r of rows) {
    const m = r.id.match(/-(\d+)$/);
    if (m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10));
    maxSort = Math.max(maxSort, r.sortOrder);
  }
  return {
    id: `${categorySlug}-${String(maxSeq + 1).padStart(4, "0")}`,
    sortOrder: maxSort + 1,
  };
}

// 신규 상품 생성 — 기본 옵션 1개를 함께 만든다(상품은 옵션이 최소 1개 필요).
// 이미지는 placeholder 로 두고 이후 편집/업로드에서 교체.
export async function createProduct(input: {
  name: string;
  categorySlug: string;
  summary: string | null;
  description: string;
  price: number;
  isActive: boolean;
}): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { id, sortOrder } = await nextIdAndSort(input.categorySlug);
    try {
      await prisma.product.create({
        data: {
          id,
          name: input.name,
          categorySlug: input.categorySlug,
          summary: input.summary,
          description: input.description,
          repImage: PLACEHOLDER_IMAGE,
          price: input.price,
          isActive: input.isActive,
          sortOrder,
          variants: {
            create: {
              id: `${id}-default`,
              name: "기본",
              price: input.price,
              sortOrder: 0,
            },
          },
        },
      });
      return id;
    } catch (e) {
      // 동시 생성으로 ID 충돌 시 다시 계산해 재시도
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002" &&
        attempt < 2
      ) {
        continue;
      }
      throw e;
    }
  }
  throw new Error("상품 ID 생성에 실패했습니다.");
}

export interface AdminProductDetail {
  id: string;
  name: string;
  categorySlug: string;
  summary: string | null;
  description: string;
  price: number;
  isActive: boolean;
}

export async function getProductForAdmin(
  id: string,
): Promise<AdminProductDetail | null> {
  const p = await prisma.product.findUnique({ where: { id } });
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    categorySlug: p.categorySlug,
    summary: p.summary,
    description: p.description,
    price: p.price,
    isActive: p.isActive,
  };
}

export async function updateProductFields(
  id: string,
  input: {
    name: string;
    categorySlug: string;
    summary: string | null;
    description: string;
    price: number;
    isActive: boolean;
  },
): Promise<boolean> {
  try {
    await prisma.product.update({ where: { id }, data: input });
    return true;
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return false; // 없는 상품
    }
    throw e;
  }
}

// ── 옵션(variant)·색상 ──────────────────────────────

export interface AdminVariant {
  id: string;
  name: string;
  price: number;
  wholesalePrice: number | null;
}
export interface AdminProductOptions {
  variants: AdminVariant[];
  colors: string[];
}

export async function getProductOptions(
  id: string,
): Promise<AdminProductOptions | null> {
  const p = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: { sortOrder: "asc" } },
      colors: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!p) return null;
  return {
    variants: p.variants.map((v) => ({
      id: v.id,
      name: v.name,
      price: v.price,
      wholesalePrice: v.wholesalePrice,
    })),
    colors: p.colors.map((c) => c.hex),
  };
}

// 옵션·색상 목록 전체를 받아 동기화(기존 옵션 id 보존, 없어진 건 삭제, 새 건 생성).
export async function updateProductOptions(
  productId: string,
  input: {
    variants: { id?: string; name: string; price: number; wholesalePrice: number | null }[];
    colors: string[];
  },
): Promise<boolean> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!product) return false;

  const existing = await prisma.variant.findMany({
    where: { productId },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((e) => e.id));
  const keepIds = new Set(
    input.variants
      .map((v) => v.id)
      .filter((id): id is string => !!id && existingIds.has(id)),
  );

  await prisma.$transaction(async (tx) => {
    const toDelete = [...existingIds].filter((id) => !keepIds.has(id));
    if (toDelete.length) {
      await tx.variant.deleteMany({ where: { id: { in: toDelete } } });
    }
    for (let i = 0; i < input.variants.length; i++) {
      const v = input.variants[i];
      if (v.id && existingIds.has(v.id)) {
        await tx.variant.update({
          where: { id: v.id },
          data: {
            name: v.name,
            price: v.price,
            wholesalePrice: v.wholesalePrice,
            sortOrder: i,
          },
        });
      } else {
        await tx.variant.create({
          data: {
            id: `${productId}-${crypto.randomUUID().slice(0, 8)}`,
            productId,
            name: v.name,
            price: v.price,
            wholesalePrice: v.wholesalePrice,
            sortOrder: i,
          },
        });
      }
    }
    await tx.productColor.deleteMany({ where: { productId } });
    if (input.colors.length) {
      await tx.productColor.createMany({
        data: input.colors.map((hex, i) => ({ productId, hex, sortOrder: i })),
      });
    }
  });
  return true;
}
