// ★ 백엔드 교체 완료 (Phase 1): mock JSON → DB (server/catalog).
// 페이지가 쓰는 함수 시그니처는 그대로 두고 내부만 server/catalog/service 에 위임한다.
// (파일명 규칙 이미지 스캔·mock JSON 로딩은 seed 로 옮겨져 여기서 제거됨)
import {
  getProducts as svcGetProducts,
  getProduct as svcGetProduct,
  getProductsByCategory as svcGetProductsByCategory,
  searchProducts as svcSearchProducts,
  getFeaturedSections as svcGetFeaturedSections,
  type FeaturedSection,
} from "@/server/catalog/service";
import type { Product } from "./types";

export type { FeaturedSection };

// TODO(Phase 2): 세션(사업자 승인회원)일 때 { wholesale: true } 를 넘겨 회원도매가 적용.

export function getProducts(): Promise<Product[]> {
  return svcGetProducts();
}

export function getProduct(id: string): Promise<Product | undefined> {
  return svcGetProduct(id);
}

export function getProductsByCategory(slug: string): Promise<Product[]> {
  return svcGetProductsByCategory(slug);
}

export function getFeaturedSections(): Promise<FeaturedSection[]> {
  return svcGetFeaturedSections();
}

export function searchProducts(query: string): Promise<Product[]> {
  return svcSearchProducts(query);
}
