import type { Product, Variant, Category } from "@/lib/types";
import {
  findAllProducts,
  findProductById,
  findProductsByCategory,
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
  return { id: v.id, name: v.name, price: variantPrice(v, wholesale) };
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
  return {
    ...toListProduct(p, wholesale),
    images: p.images.map((img) => img.url),
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
  const rows = await findProductsByCategory(slug);
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
    // 한 세트 최대 8개(4열 × 2행)
    const products = (byCat.get(c.slug) ?? []).slice(0, 8);
    if (products.length > 0) {
      sections.push({
        category: { slug: c.slug, name: c.nameKo, en: c.nameEn },
        products,
      });
    }
  }
  return sections;
}
