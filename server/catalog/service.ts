import type { Product, Variant, Category, NavCategory } from "@/lib/types";
import {
  findAllProducts,
  findProductById,
  findProductsByCategory,
  findChildCategorySlugs,
  searchProducts as searchProductsRepo,
  findCategories,
  findFeatured,
} from "./repo";

// DB row → 프론트 Product 타입으로 매핑하는 계층.
// lib/data.ts 가 이 함수들을 호출하도록 교체하면 페이지 코드는 그대로 동작한다.

// 홈 큐레이션 섹션 (기존 lib/data.ts 의 FeaturedSection 과 동일 형태).
export interface FeaturedSection {
  category: Category;
  products: Product[];
}

// 회원도매가 적용 여부. 기본 false(소비자가).
// Phase 2에서 세션(사업자 승인회원) 연동 시 lib/data.ts 가 wholesale=true 로 넘긴다.
export interface PriceOpts {
  wholesale?: boolean;
}

type ListRow = Awaited<ReturnType<typeof findAllProducts>>[number];
type DetailRow = NonNullable<Awaited<ReturnType<typeof findProductById>>>;

function variantPrice(
  v: { price: number; wholesalePrice: number | null },
  wholesale: boolean,
): number {
  return wholesale && v.wholesalePrice != null ? v.wholesalePrice : v.price;
}

function toVariant(v: ListRow["variants"][number], wholesale: boolean): Variant {
  // price = 뷰어 실지불가(자격 있으면 회원도매가), consumerPrice = 항상 소비자가(표시용)
  return {
    id: v.id,
    name: v.name,
    price: variantPrice(v, wholesale),
    consumerPrice: v.price,
  };
}

function toListProduct(p: ListRow, wholesale: boolean): Product {
  return {
    id: p.id,
    name: p.name,
    category: p.categorySlug,
    // 대표가(목록 표시용). Phase 2에서 회원가 기준 최저가 반영 여지.
    price: p.price,
    summary: p.summary ?? undefined,
    description: p.description,
    image: p.repImage,
    variants: p.variants.map((v) => toVariant(v, wholesale)),
    colors: p.colors.length ? p.colors.map((c) => c.hex) : undefined,
  };
}

function toDetailProduct(p: DetailRow, wholesale: boolean): Product {
  const gallery = p.images.map((img) => img.url);
  return {
    ...toListProduct(p, wholesale),
    // 갤러리 이미지가 없으면 대표이미지 1장으로 대체(상세 갤러리가 빈 src로 깨지는 것 방지).
    // repImage 는 최소 placeholder.svg 라 항상 유효하다.
    images: gallery.length > 0 ? gallery : [p.repImage],
    notice: {
      modelName: p.modelName ?? undefined,
      origin: p.origin ?? undefined,
      maker: p.maker ?? undefined,
      dimensions: p.dimensions ?? undefined,
      material: p.material ?? undefined,
      colorInfo: p.colorInfo ?? undefined,
      composition: p.composition ?? undefined,
      certInfo: p.certInfo ?? undefined,
    },
  };
}

export async function getProducts(opts: PriceOpts = {}): Promise<Product[]> {
  const rows = await findAllProducts();
  return rows.map((r) => toListProduct(r, opts.wholesale ?? false));
}

export async function getProduct(
  id: string,
  opts: PriceOpts = {},
): Promise<Product | undefined> {
  const row = await findProductById(id);
  return row ? toDetailProduct(row, opts.wholesale ?? false) : undefined;
}

export async function getProductsByCategory(
  slug: string,
  opts: PriceOpts = {},
): Promise<Product[]> {
  // 대분류면 자기 + 하위(중분류) 상품까지 모아서 보여준다. 중분류면 자기 것만.
  const childSlugs = await findChildCategorySlugs(slug);
  const rows = await findProductsByCategory([slug, ...childSlugs]);
  return rows.map((r) => toListProduct(r, opts.wholesale ?? false));
}

export async function searchProducts(
  query: string,
  opts: PriceOpts = {},
): Promise<Product[]> {
  const q = query.trim();
  if (!q) return [];
  const rows = await searchProductsRepo(q);
  return rows.map((r) => toListProduct(r, opts.wholesale ?? false));
}

export async function getCategories(): Promise<Category[]> {
  const rows = await findCategories();
  return rows.map((c) => ({ slug: c.slug, name: c.nameKo, en: c.nameEn }));
}

// 상단 내비에 노출할 카테고리(showInNav=true)만. onHome 으로 링크 방식을 구분한다.
// 대분류(parentSlug=null)를 상단 칩으로, 그 하위(중분류)는 children 으로 묶어 반환한다.
// rows 는 sortOrder 순이라 형제(같은 부모)끼리 상대 순서가 유지된다.
export async function getNavCategories(): Promise<NavCategory[]> {
  const rows = await findCategories();
  const toNav = (c: (typeof rows)[number]): NavCategory => ({
    slug: c.slug,
    name: c.nameKo,
    en: c.nameEn,
    onHome: c.showOnHome,
  });

  const childrenByParent = new Map<string, NavCategory[]>();
  for (const c of rows) {
    if (c.parentSlug && c.showInNav) {
      const arr = childrenByParent.get(c.parentSlug) ?? [];
      arr.push(toNav(c));
      childrenByParent.set(c.parentSlug, arr);
    }
  }

  return rows
    .filter((c) => c.parentSlug == null && c.showInNav)
    .map((c) => ({ ...toNav(c), children: childrenByParent.get(c.slug) ?? [] }));
}

export async function getFeaturedSections(
  opts: PriceOpts = {},
): Promise<FeaturedSection[]> {
  const [rows, cats] = await Promise.all([findFeatured(), findCategories()]);

  const byCat = new Map<string, Product[]>();
  for (const f of rows) {
    const list = byCat.get(f.categorySlug) ?? [];
    list.push(toListProduct(f.product, opts.wholesale ?? false));
    byCat.set(f.categorySlug, list);
  }

  const sections: FeaturedSection[] = [];
  for (const c of cats) {
    if (!c.showOnHome) continue; // 홈 노출 off 카테고리는 진열대 자체를 만들지 않음
    // 편성(featured)된 상품은 개수 제한 없이 전부 노출한다.
    const products = byCat.get(c.slug) ?? [];
    if (products.length > 0) {
      sections.push({
        category: { slug: c.slug, name: c.nameKo, en: c.nameEn },
        products,
      });
    }
  }
  return sections;
}
