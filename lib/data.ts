// ★ 백엔드 교체 완료 (Phase 1): mock JSON → DB (server/catalog).
// Phase 2: 로그인한 "승인된 사업자회원"이면 회원도매가(wholesale) 적용.
//   세션 쿠키를 읽으므로 카탈로그 페이지는 사용자별 동적 렌더가 된다(가격이 사람마다 다름).
import {
  getProducts as svcGetProducts,
  getProduct as svcGetProduct,
  getProductsByCategory as svcGetProductsByCategory,
  searchProducts as svcSearchProducts,
  getFeaturedSections as svcGetFeaturedSections,
  type FeaturedSection,
} from "@/server/catalog/service";
import { getSessionUser } from "./session";
import { prisma } from "@/server/db";
import type { Product } from "./types";

export type { FeaturedSection };

// 로그인한 승인 사업자회원(BUSINESS + ACTIVE)이면 회원도매가 적용.
// (type/status 는 세션 토큰이 아니라 DB에서 확인 — 승인 직후에도 즉시 반영)
// 상세페이지가 회원도매가 줄을 노출할지 판단할 때도 이 값을 그대로 쓴다.
export async function isWholesaleViewer(): Promise<boolean> {
  const session = await getSessionUser();
  if (!session) return false;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { type: true, status: true },
  });
  return user?.type === "BUSINESS" && user?.status === "ACTIVE";
}

export async function getProducts(): Promise<Product[]> {
  return svcGetProducts({ wholesale: await isWholesaleViewer() });
}

export async function getProduct(id: string): Promise<Product | undefined> {
  return svcGetProduct(id, { wholesale: await isWholesaleViewer() });
}

export async function getProductsByCategory(slug: string): Promise<Product[]> {
  return svcGetProductsByCategory(slug, {
    wholesale: await isWholesaleViewer(),
  });
}

export async function getFeaturedSections(): Promise<FeaturedSection[]> {
  return svcGetFeaturedSections({ wholesale: await isWholesaleViewer() });
}

export async function searchProducts(query: string): Promise<Product[]> {
  return svcSearchProducts(query, { wholesale: await isWholesaleViewer() });
}
