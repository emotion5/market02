"use client";

import { useEffect } from "react";
import type { Product } from "@/lib/types";
import { rememberProduct } from "@/lib/product-cache";

// 목록 카드마다 렌더되어, 해당 상품을 클라이언트 캐시에 등록한다.
// 이후 카드를 클릭하면 상세 모달이 이 캐시로 즉시(낙관적) 그려진다. 화면 출력은 없음.
export default function RememberProduct({ product }: { product: Product }) {
  useEffect(() => {
    rememberProduct(product);
  }, [product]);
  return null;
}
