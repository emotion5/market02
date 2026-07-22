import { prisma } from "@/server/db";
import { Prisma } from "@prisma/client";

// DB 접근(순수 쿼리) 계층. 매핑·비즈니스 로직은 service.ts 가 담당.

const listInclude = {
  variants: { orderBy: { sortOrder: "asc" } },
  colors: { orderBy: { sortOrder: "asc" } },
} satisfies Prisma.ProductInclude;

const detailInclude = {
  variants: { orderBy: { sortOrder: "asc" } },
  colors: { orderBy: { sortOrder: "asc" } },
  images: { orderBy: { sortOrder: "asc" } },
} satisfies Prisma.ProductInclude;

export function findAllProducts() {
  return prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ categorySlug: "asc" }, { sortOrder: "asc" }],
    include: listInclude,
  });
}

// 대분류 페이지는 자기 + 하위(중분류) 상품을 모두 모아 보여준다 → slug 목록으로 조회.
export function findProductsByCategory(slugs: string[]) {
  return prisma.product.findMany({
    where: { isActive: true, categorySlug: { in: slugs } },
    orderBy: [{ categorySlug: "asc" }, { sortOrder: "asc" }],
    include: listInclude,
  });
}

// 한 카테고리의 직속 하위(중분류) slug 목록.
export async function findChildCategorySlugs(slug: string): Promise<string[]> {
  const rows = await prisma.category.findMany({
    where: { parentSlug: slug },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}

export function findProductById(id: string) {
  return prisma.product.findFirst({
    where: { id, isActive: true },
    include: detailInclude,
  });
}

export function searchProducts(q: string) {
  return prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { variants: { some: { name: { contains: q, mode: "insensitive" } } } },
      ],
    },
    orderBy: { sortOrder: "asc" },
    include: listInclude,
  });
}

export function findCategories() {
  return prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
}

export function findFeatured() {
  return prisma.featured.findMany({
    where: { product: { isActive: true } }, // 편성돼 있어도 비활성 상품은 홈에서 제외
    orderBy: [{ categorySlug: "asc" }, { sortOrder: "asc" }],
    include: { product: { include: listInclude } },
  });
}
