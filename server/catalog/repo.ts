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

export function findProductsByCategory(slug: string) {
  return prisma.product.findMany({
    where: { isActive: true, categorySlug: slug },
    orderBy: { sortOrder: "asc" },
    include: listInclude,
  });
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
