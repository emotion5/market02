import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import QuickAddButton from "./QuickAddButton";
import ProductThumb from "./ProductThumb";
import RememberProduct from "./RememberProduct";
import styles from "./ProductCard.module.css";

export default function ProductCard({ product }: { product: Product }) {
  // 카드 가격 표시.
  // variant.price 는 "뷰어가 실제 지불하는 가격"(승인 사업자=회원도매가, 그 외=소비자가),
  // variant.consumerPrice 는 항상 소비자가. 비자격 뷰어에겐 서버가 둘을 같게 내려주므로
  // memberMin < product.price(=소비자 최저가) 일 때만 도매가 자격·할인이 있는 것으로 판정한다.
  const multi = product.variants.length > 1;
  const memberMin = product.variants.length
    ? Math.min(...product.variants.map((v) => v.price))
    : product.price;
  const showWholesale = memberMin < product.price;

  return (
    <article className={styles.card}>
      {/* 클릭 시 상세 모달을 낙관적으로 즉시 그리도록 상품을 클라이언트 캐시에 등록 */}
      <RememberProduct product={product} />
      <div className={styles.thumb}>
        <ProductThumb
          src={product.image}
          alt={product.name}
          className={styles.image}
        />
        <QuickAddButton product={product} />
      </div>

      {/* 카드 전체를 덮는 링크(스트레치드 링크): 텍스트/이미지 클릭 시 상세로 이동 */}
      <Link href={`/products/${product.id}`} className={styles.body}>
        <p className={styles.name}>{product.name}</p>
        {product.summary && <p className={styles.summary}>{product.summary}</p>}
        {showWholesale ? (
          <p className={styles.price}>
            <span className={styles.consumerPrice}>
              {formatPrice(product.price)}
              {multi && "~"}
            </span>
            <span className={styles.memberPrice}>
              {formatPrice(memberMin)}
              {multi && "~"}
            </span>
          </p>
        ) : (
          <p className={styles.price}>
            {formatPrice(product.price)}
            {multi && "~"}
          </p>
        )}
        {product.colors && product.colors.length > 0 && (
          <ul className={styles.colors} aria-label="색상 옵션">
            {product.colors.map((c) => (
              <li
                key={c.hex}
                className={styles.swatch}
                style={{ backgroundColor: c.hex }}
                title={c.name || c.hex}
              />
            ))}
          </ul>
        )}
      </Link>
    </article>
  );
}
