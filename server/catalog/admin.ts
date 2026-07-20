import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { FEATURED_MAX } from "@/lib/constants";

export { FEATURED_MAX };

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

// ── 이미지 ──────────────────────────────────────────

export interface AdminProductImages {
  repImage: string;
  gallery: { id: string; url: string }[];
}

export async function getProductImages(
  id: string,
): Promise<AdminProductImages | null> {
  const p = await prisma.product.findUnique({
    where: { id },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  if (!p) return null;
  return {
    repImage: p.repImage,
    gallery: p.images.map((i) => ({ id: i.id, url: i.url })),
  };
}

export async function setRepImage(
  productId: string,
  url: string,
): Promise<void> {
  await prisma.product.update({
    where: { id: productId },
    data: { repImage: url },
  });
}

export async function addGalleryImage(
  productId: string,
  url: string,
): Promise<{ id: string; url: string }> {
  const agg = await prisma.productImage.aggregate({
    where: { productId },
    _max: { sortOrder: true },
  });
  const img = await prisma.productImage.create({
    data: { productId, url, sortOrder: (agg._max.sortOrder ?? -1) + 1 },
  });
  return { id: img.id, url: img.url };
}

// 삭제된 이미지의 url 반환(스토리지 파일 정리를 위해). 없으면 null.
export async function removeGalleryImage(
  productId: string,
  imageId: string,
): Promise<string | null> {
  const img = await prisma.productImage.findFirst({
    where: { id: imageId, productId },
  });
  if (!img) return null;
  await prisma.productImage.delete({ where: { id: imageId } });
  return img.url;
}

// ── 홈 큐레이션 (featured) ──────────────────────────
// 카테고리별로 홈에 노출할 상품과 순서를 편성한다(featured.json 대체).

export interface AdminFeaturedItem {
  id: string;
  name: string;
  image: string;
  isActive: boolean;
}
export interface AdminFeaturedCategory {
  slug: string;
  name: string;
  products: AdminFeaturedItem[]; // 카테고리의 모든 상품(비활성 포함), sortOrder 순 — 편성 후보
  featuredIds: string[]; // 현재 편성된 상품 id, 노출 순서대로
}

// ── 카테고리 노출 설정 (내비/홈 표시 토글) ─────────────────────────────
export interface AdminCategoryRow {
  slug: string;
  name: string; // 한글 표시명
  showInNav: boolean;
  showOnHome: boolean;
}

export async function getCategoriesForAdmin(): Promise<AdminCategoryRow[]> {
  const cats = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { slug: true, nameKo: true, showInNav: true, showOnHome: true },
  });
  return cats.map((c) => ({
    slug: c.slug,
    name: c.nameKo,
    showInNav: c.showInNav,
    showOnHome: c.showOnHome,
  }));
}

// 카테고리별 노출 플래그를 일괄 저장. 존재하지 않는 slug 는 조용히 무시한다.
export async function setCategoryVisibility(
  updates: { slug: string; showInNav: boolean; showOnHome: boolean }[],
): Promise<void> {
  const existing = await prisma.category.findMany({ select: { slug: true } });
  const valid = new Set(existing.map((c) => c.slug));
  await prisma.$transaction(
    updates
      .filter((u) => valid.has(u.slug))
      .map((u) =>
        prisma.category.update({
          where: { slug: u.slug },
          data: { showInNav: u.showInNav, showOnHome: u.showOnHome },
        }),
      ),
  );
}

// FEATURED_MAX(카테고리당 최대 노출 수)는 lib/constants 에서 공용 정의(위에서 re-export).
export async function getFeaturedForAdmin(): Promise<AdminFeaturedCategory[]> {
  const [cats, products, featured] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({
      orderBy: [{ categorySlug: "asc" }, { sortOrder: "asc" }],
      select: {
        id: true,
        name: true,
        repImage: true,
        isActive: true,
        categorySlug: true,
      },
    }),
    prisma.featured.findMany({
      orderBy: [{ categorySlug: "asc" }, { sortOrder: "asc" }],
      select: { categorySlug: true, productId: true },
    }),
  ]);

  const prodByCat = new Map<string, AdminFeaturedItem[]>();
  for (const p of products) {
    const list = prodByCat.get(p.categorySlug) ?? [];
    list.push({ id: p.id, name: p.name, image: p.repImage, isActive: p.isActive });
    prodByCat.set(p.categorySlug, list);
  }
  const featByCat = new Map<string, string[]>();
  for (const f of featured) {
    const list = featByCat.get(f.categorySlug) ?? [];
    list.push(f.productId);
    featByCat.set(f.categorySlug, list);
  }

  return cats.map((c) => ({
    slug: c.slug,
    name: c.nameKo,
    products: prodByCat.get(c.slug) ?? [],
    featuredIds: featByCat.get(c.slug) ?? [],
  }));
}

// 한 카테고리의 편성 목록을 통째로 교체. 요청 순서를 sortOrder 로 반영.
// 존재하지 않거나 다른 카테고리 상품 id 는 조용히 걸러내고, 중복도 제거한다.
export async function setFeatured(
  categorySlug: string,
  productIds: string[],
): Promise<boolean> {
  const cat = await prisma.category.findUnique({
    where: { slug: categorySlug },
    select: { slug: true },
  });
  if (!cat) return false;

  const valid = await prisma.product.findMany({
    where: { id: { in: productIds }, categorySlug },
    select: { id: true },
  });
  const validSet = new Set(valid.map((p) => p.id));
  const seen = new Set<string>();
  const ordered = productIds.filter(
    (id) => validSet.has(id) && !seen.has(id) && (seen.add(id), true),
  );

  await prisma.$transaction(async (tx) => {
    await tx.featured.deleteMany({ where: { categorySlug } });
    if (ordered.length) {
      await tx.featured.createMany({
        data: ordered.map((productId, i) => ({
          categorySlug,
          productId,
          sortOrder: i,
        })),
      });
    }
  });
  return true;
}
