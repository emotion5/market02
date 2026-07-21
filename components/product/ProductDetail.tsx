import VariantSelector from "@/components/product/VariantSelector";
import ProductGallery from "@/components/product/ProductGallery";
import ProductAccordion from "@/components/product/ProductAccordion";
import type { Product } from "@/lib/types";
import styles from "./ProductDetail.module.css";

// 상품 상세 본문(이미지 + 정보 + 옵션). 전체 페이지와 모달에서 공용으로 사용.
// variant="modal"이면 오른쪽 info 열만 내부 스크롤(모달 높이에 맞춰 고정).
export default function ProductDetail({
  product,
  categoryName,
  variant = "page",
  wholesale = false,
}: {
  product: Product;
  categoryName?: string; // 표시용 카테고리명(서버에서 DB 조회 후 주입)
  variant?: "page" | "modal";
  wholesale?: boolean; // 회원도매가 노출 자격(승인 사업자). 기본 비노출
}) {
  const images = product.images ?? [product.image];

  // 상세 정보 아코디언 (내용은 임시 — 추후 실제 데이터로 교체)
  const accordionItems = [
    {
      title: "배송",
      content:
        "평일 14시 이전 결제 시 당일 출발합니다.\n" +
        "기본 배송비는 무료이며, 제주·도서산간 지역은 추가 배송비가 발생할 수 있습니다.\n" +
        "단순 변심 반품은 상품 수령 후 7일 이내 가능합니다(왕복 배송비 고객 부담).",
    },
    {
      title: "상세설명",
      content: product.description,
    },
    {
      title: "크기",
      content:
        "제품 치수는 준비 중입니다.\n" +
        "정확한 규격과 설치 치수는 상세 도면을 참고해주세요.",
    },
  ];

  return (
    <div
      className={`${styles.layout} ${
        variant === "modal" ? styles.layoutModal : ""
      }`}
    >
      <div className={styles.galleryCol}>
        <ProductGallery images={images} alt={product.name} />
      </div>

      <div className={styles.info}>
        {categoryName && <p className={styles.category}>{categoryName}</p>}
        <h1 className={styles.name}>{product.name}</h1>
        <VariantSelector product={product} wholesale={wholesale} />
        <ProductAccordion items={accordionItems} />
      </div>
    </div>
  );
}
