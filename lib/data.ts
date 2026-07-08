import products from "@/data/mock-products.json";
import type { Product } from "./types";

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
