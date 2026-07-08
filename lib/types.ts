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
  description: string;
  image: string;
  variants: Variant[];
}

export interface Category {
  slug: string;
  name: string;
}

export interface CartItem {
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  price: number;
  image: string;
  quantity: number;
}
