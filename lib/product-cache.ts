import type { Product } from "./types";

// 목록에 렌더된 상품을 잠깐 담아두는 클라이언트 메모리 캐시.
// 썸네일 클릭 → 상세 모달이 서버에서 로드되는 동안, 이 캐시의 데이터로 모달을
// "낙관적으로" 먼저 그려 체감 지연을 없앤다(서버 응답이 오면 실제 내용으로 교체).
// 세션(탭) 단위 임시 캐시라 영속성/무효화는 신경 쓰지 않는다.
const cache = new Map<string, Product>();

export function rememberProduct(p: Product): void {
  cache.set(p.id, p);
}

export function recallProduct(id: string): Product | undefined {
  return cache.get(id);
}
