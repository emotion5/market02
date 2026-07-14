import { getCategory } from "@/lib/constants";
import VariantSelector from "@/components/product/VariantSelector";
import type { Product } from "@/lib/types";
import styles from "./ProductDetail.module.css";

// 상품 상세 본문(이미지 + 정보 + 옵션). 전체 페이지와 모달에서 공용으로 사용.
export default function ProductDetail({ product }: { product: Product }) {
  const category = getCategory(product.category);

  return (
    <div className={styles.layout}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={product.image} alt={product.name} className={styles.image} />

      <div className={styles.info}>
        {category && <p className={styles.category}>{category.name}</p>}
        <h1 className={styles.name}>{product.name}</h1>
        <p className={styles.description}>{product.description}</p>
        <VariantSelector product={product} />
      </div>
    </div>
  );
}
