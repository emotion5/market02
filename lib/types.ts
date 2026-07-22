export interface Variant {
  id: string;
  name: string; // 예: "크롬", "무광 블랙"
  price: number; // 뷰어가 실제 지불하는 가격(견적·장바구니 기준). 비회원=소비자가, 승인 사업자=회원도매가
  consumerPrice: number; // 표시용 소비자가(항상 실제 소비자가). 회원도매가 노출은 자격 있는 뷰어에게만
}

// 상품정보제공고시 (상세페이지 고시표). 상세 조회에서만 채운다.
export interface ProductNotice {
  modelName?: string;
  origin?: string; // 제조국(원산지)
  maker?: string; // 제조자/수입자
  dimensions?: string; // 크기·규격
  material?: string; // 재질/소재
  colorInfo?: string; // 색상(텍스트)
  composition?: string; // 구성품
  certInfo?: string; // KC 등 인증정보
}

export interface Product {
  id: string;
  name: string;
  category: string; // Category slug
  price: number; // 대표 가격 (목록 표시용, 보통 최저 옵션가)
  summary?: string; // 목록 카드용 한 줄 간단설명
  description: string;
  image: string; // 대표 이미지(썸네일). 목록 카드에 사용
  images?: string[]; // 상세 갤러리용 이미지들. getProduct에서 파일명 규칙으로 자동 구성
  variants: Variant[];
  colors?: string[]; // 색상 옵션(hex). 있을 때만 원형 스와치로 표시 (현재 표시 전용)
  notice?: ProductNotice; // 상품정보제공고시 (상세에서만)
}

export interface Category {
  slug: string;
  name: string; // 한글 표시명 (칩 hover 시 노출)
  en: string; // 영문 표시명 (칩 기본 노출)
}

// 상단 내비 칩용 카테고리. showInNav 로 걸러진 것만 담기며,
// onHome=true 면 홈 섹션 앵커로 스크롤, false 면 카테고리 전용 페이지로 이동한다.
export interface NavCategory extends Category {
  onHome: boolean;
  children?: NavCategory[]; // 하위(중분류) — 대분류 칩 hover 시 펼쳐지는 드롭다운
}

// 사이트 설정(공급자·입금계좌·견적 유효기간·고객센터). DB SiteSetting 의 편집 가능한 필드.
export interface SiteSettings {
  supplierName: string;
  supplierOwner: string;
  supplierBizNo: string;
  supplierAddress: string;
  supplierCategory: string;
  supplierTel: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  quoteValidDays: number;
  csEmail: string;
  csTel: string;
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
