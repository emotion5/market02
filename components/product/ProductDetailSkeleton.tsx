import styles from "./ProductDetailSkeleton.module.css";

// 상세 모달 로딩 자리표시자. 서버에서 상품/설정을 조회하는 동안 즉시 그려져
// "클릭했는데 반응이 없는" 체감 지연을 없앤다.
export default function ProductDetailSkeleton() {
  return (
    <div className={styles.layout} aria-hidden>
      <div className={styles.gallery}>
        <div className={`${styles.main} ${styles.sk}`} />
        <div className={styles.thumbs}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`${styles.thumb} ${styles.sk}`} />
          ))}
        </div>
      </div>
      <div className={styles.info}>
        <div className={`${styles.title} ${styles.sk}`} />
        {/* 카테고리 자리(이름 아래) — 실제 렌더와 순서·높이를 맞춰 로드 후 밀림 방지 */}
        <div className={`${styles.cat} ${styles.sk}`} />
        <div className={`${styles.price} ${styles.sk}`} />
        <div className={`${styles.block} ${styles.sk}`} />
        <div className={`${styles.line} ${styles.w90} ${styles.sk}`} />
        <div className={`${styles.line} ${styles.w80} ${styles.sk}`} />
        <div className={`${styles.line} ${styles.w60} ${styles.sk}`} />
        <div className={`${styles.block} ${styles.sk}`} />
      </div>
    </div>
  );
}
