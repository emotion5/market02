import fs from "node:fs";
import path from "node:path";
import products from "@/data/mock-products.json";
import featured from "@/data/featured.json";
import { CATEGORIES } from "./constants";
import type { Category, Product } from "./types";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 상세 갤러리 이미지들을 파일명 규칙으로 자동 수집한다.
// 대표: {id}.ext, 추가: {id}-1.ext, {id}-2.ext … (같은 폴더)
// 반환 순서: 대표 → 1 → 2 … (대표 파일이 없으면 product.image로 폴백)
function resolveImages(product: Product): string[] {
  const webPath = product.image; // 예: /images/products/faucet/faucet-0001.jpg
  const slash = webPath.lastIndexOf("/");
  if (slash < 0) return [product.image];
  const dirWeb = webPath.slice(0, slash);
  const dirFs = path.join(process.cwd(), "public", dirWeb);

  let files: string[];
  try {
    files = fs.readdirSync(dirFs);
  } catch {
    return [product.image];
  }

  const re = new RegExp(
    `^${escapeRegExp(product.id)}(?:-(\\d+))?\\.(?:jpe?g|png|webp|avif)$`,
    "i",
  );
  const matched = files
    .map((file) => {
      const m = re.exec(file);
      return m ? { file, order: m[1] ? parseInt(m[1], 10) : 0 } : null;
    })
    .filter((x): x is { file: string; order: number } => x !== null)
    .sort((a, b) => a.order - b.order)
    .map((x) => `${dirWeb}/${x.file}`);

  return matched.length > 0 ? matched : [product.image];
}

// ★ 백엔드 교체 지점
// 지금은 mock JSON을 읽지만, 나중에 이 파일의 함수 내부만
// DB/API 호출로 바꾸면 페이지 코드는 수정 없이 그대로 동작한다.

const PRODUCTS = products as Product[];

export async function getProducts(): Promise<Product[]> {
  return PRODUCTS;
}

export async function getProduct(id: string): Promise<Product | undefined> {
  const product = PRODUCTS.find((p) => p.id === id);
  if (!product) return undefined;
  // 상세에서만 갤러리 이미지를 폴더 스캔으로 채운다(목록엔 불필요).
  return { ...product, images: resolveImages(product) };
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
