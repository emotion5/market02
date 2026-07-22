"use client";

import { usePathname } from "next/navigation";
import ProductDetailSkeleton from "@/components/product/ProductDetailSkeleton";
import OptimisticProductDetail from "@/components/product/OptimisticProductDetail";
import { recallProduct } from "@/lib/product-cache";

// 인터셉트 상세 모달이 서버에서 렌더되는 동안의 Suspense 폴백.
// 목록에서 넘어온 경우 클라이언트 캐시에 상품이 있어 낙관적 미리보기를 즉시 그리고,
// 캐시에 없으면(딥링크 등) 스켈레톤으로 폴백한다. (모달 껍데기는 layout 이 담당)
export default function Loading() {
  const pathname = usePathname();
  const id = pathname?.match(/\/products\/([^/]+)/)?.[1];
  const product = id ? recallProduct(id) : undefined;

  return product ? (
    <OptimisticProductDetail product={product} />
  ) : (
    <ProductDetailSkeleton />
  );
}
