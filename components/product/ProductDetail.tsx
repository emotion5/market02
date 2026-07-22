import VariantSelector from "@/components/product/VariantSelector";
import ProductGallery from "@/components/product/ProductGallery";
import ProductAccordion from "@/components/product/ProductAccordion";
import { getSiteSettings } from "@/lib/settings";
import { DELIVERY_NOTICE } from "@/lib/product-copy";
import type { Product, SiteSettings } from "@/lib/types";
import styles from "./ProductDetail.module.css";

// 상품 상세 본문(이미지 + 정보 + 옵션). 전체 페이지와 모달에서 공용으로 사용.
// variant="modal"이면 오른쪽 info 열만 내부 스크롤(모달 높이에 맞춰 고정).
export default async function ProductDetail({
  product,
  categoryName,
  variant = "page",
  wholesale = false,
  settings: settingsProp,
}: {
  product: Product;
  categoryName?: string; // 표시용 카테고리명(서버에서 DB 조회 후 주입)
  variant?: "page" | "modal";
  wholesale?: boolean; // 회원도매가 노출 자격(승인 사업자). 기본 비노출
  settings?: SiteSettings; // 호출부가 이미 조회했으면 주입(중복 DB 조회 방지)
}) {
  const images = product.images ?? [product.image];
  const settings = settingsProp ?? (await getSiteSettings());
  const n = product.notice ?? {};

  // 상품정보제공고시 표 — 비운 상품별 항목은 "상세페이지 참조", 인증은 "해당없음".
  // 품명·A/S·품질보증·배송/교환은 상품명·사이트설정으로 자동 채운다.
  const ref = "상세페이지 참조";
  const noticeRows: [string, string][] = [
    ["품명 및 모델명", `${product.name}${n.modelName ? ` / ${n.modelName}` : ""}`],
    ["제조국(원산지)", n.origin || ref],
    ["제조자 / 수입자", n.maker || ref],
    ["크기·규격", n.dimensions || ref],
    ["재질 / 소재", n.material || ref],
    ["색상", n.colorInfo || ref],
    ["구성품", n.composition || ref],
    ["인증정보", n.certInfo || "해당없음"],
    ["품질보증기준", "관련 법 및 소비자분쟁해결기준(공정거래위원회 고시)에 따릅니다"],
    [
      "A/S 책임자 및 연락처",
      [settings.supplierName, settings.csTel].filter(Boolean).join(" / ") || ref,
    ],
    ["배송·교환·반품", "환불정책 및 배송 안내를 따릅니다"],
  ];

  const noticeTable = (
    <table className={styles.noticeTable}>
      <tbody>
        {noticeRows.map(([label, value]) => (
          <tr key={label}>
            <th scope="row">{label}</th>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const accordionItems = [
    {
      title: "배송",
      content: DELIVERY_NOTICE,
    },
    {
      title: "상세설명",
      content: product.description,
    },
    {
      title: "상품정보제공고시",
      content: noticeTable,
    },
  ];

  return (
    <div
      className={`${styles.layout} ${
        variant === "modal" ? styles.layoutModal : ""
      }`}
    >
      <div className={styles.galleryCol}>
        <ProductGallery
          images={images}
          alt={product.name}
          fallbackSrc={product.image}
        />
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
