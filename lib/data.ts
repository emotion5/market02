import products from "@/data/mock-products.json";
import featured from "@/data/featured.json";
import { CATEGORIES } from "./constants";
import type { Category, Product } from "./types";

// ★ 백엔드 교체 지점
// 지금은 mock JSON을 읽지만, 나중에 이 파일의 함수 내부만
// DB/API 호출로 바꾸면 페이지 코드는 수정 없이 그대로 동작한다.

const PRODUCTS = products as Product[];

export async function getProducts(): Promise<Product[]> {
  return PRODUCTS;
}

export async function getProduct(id: string): Promise<Product | undefined> {
  return PRODUCTS.find((p) => p.id === id);
}

export async function getProductsByCategory(slug: string): Promise<Product[]> {
  return PRODUCTS.filter((p) => p.category === slug);
}

// 메인 페이지에 노출할 카테고리별 추천상품 세트.
// ★ 큐레이션 지점: data/featured.json 의 "카테고리slug: [상품ID 순서대로]" 만
// 바꾸면 노출 상품과 순서가 그대로 반영된다. 한 세트는 최대 8개(4열 × 2행).
export interface FeaturedSection {
  category: Category;
  products: Product[];
}

const FEATURED = featured as Record<string, string[]>;

export async function getFeaturedSections(): Promise<FeaturedSection[]> {
  const sections: FeaturedSection[] = [];
  for (const category of CATEGORIES) {
    const ids = FEATURED[category.slug] ?? [];
    const products = ids
      .slice(0, 8)
      .map((id) => PRODUCTS.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p));
    if (products.length > 0) {
      sections.push({ category, products });
    }
  }
  return sections;
}

export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.variants.some((v) => v.name.toLowerCase().includes(q)),
  );
}
