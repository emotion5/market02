"use client";

import VariantSelector from "./VariantSelector";
import ProductGallery from "./ProductGallery";
import ProductAccordion from "./ProductAccordion";
import { DELIVERY_NOTICE } from "@/lib/product-copy";
import type { Product } from "@/lib/types";
import styles from "./ProductDetail.module.css";

// 목록 카드가 이미 가진 데이터(이미지·이름·가격·옵션·상세설명)로 상세 모달을 즉시 그린다.
// 서버가 상세(고시표·추가 갤러리·카테고리명·회원도매가)를 마저 채우면 실제 ProductDetail 로 교체된다.
// - 아코디언은 기본 접힘이라 "상품정보제공고시" 내용이 아직 없어도 화면에 드러나지 않는다.
// - wholesale 여부는 여기서 알 수 없어 소비자가만 노출(실제 로드 시 회원도매가 줄이 채워짐).
export default function OptimisticProductDetail({
  product,
}: {
  product: Product;
}) {
  const images = product.images ?? [product.image];
  const accordionItems = [
    { title: "배송", content: DELIVERY_NOTICE },
    { title: "상세설명", content: product.description },
    { title: "상품정보제공고시", content: "불러오는 중…" },
  ];

  return (
    <div className={`${styles.layout} ${styles.layoutModal}`}>
      <div className={styles.galleryCol}>
        <ProductGallery
          images={images}
          alt={product.name}
          fallbackSrc={product.image}
          reserveThumbs={product.imageCount}
        />
      </div>

      <div className={styles.info}>
        {/* 카테고리명 자리 예약 — 실제 로드 때 이름(예: "하드웨어")이 채워지며 높이 변화 없음 */}
        <p className={styles.category} aria-hidden>
          &nbsp;
        </p>
        <h1 className={styles.name}>{product.name}</h1>
        <VariantSelector product={product} />
        <ProductAccordion items={accordionItems} />
      </div>
    </div>
  );
}
