export interface Variant {
  id: string;
  name: string; // 예: "크롬", "무광 블랙"
  price: number; // 옵션별 판매가 (원)
}

export interface Product {
  id: string;
  name: string;
  category: string; // Category slug
  price: number; // 대표 가격 (목록 표시용, 보통 최저 옵션가)
  summary?: string; // 목록 카드용 한 줄 간단설명
  description: string;
  image: string;
  variants: Variant[];
  colors?: string[]; // 색상 옵션(hex). 있을 때만 원형 스와치로 표시 (현재 표시 전용)
}

export interface Category {
  slug: string;
  name: string;
}

export interface CartItem {
  productId: string;
  variantId: string; // 색상 옵션이 있으면 "<variantId>::<color>"로 합성되어 색상별 구분
  productName: string;
  variantName: string;
  price: number;
  image: string;
  quantity: number;
  color?: string; // 선택한 색상(hex). 표시용
}
