import Link from "next/link";
import { ChevronRight } from "lucide-react";
import ProductGrid from "@/components/product/ProductGrid";
import type { FeaturedSection as Section } from "@/lib/data";
import styles from "./FeaturedSection.module.css";

// 카테고리별 추천상품 세트(최대 8개). CategoryNav에서 #category-{slug}로 스크롤된다.
export default function FeaturedSection({ section }: { section: Section }) {
  const { category, products } = section;

  return (
    <section id={`category-${category.slug}`} className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>{category.name}</h2>
        <Link href={`/category/${category.slug}`} className={styles.more}>
          전체보기
          <ChevronRight size={16} strokeWidth={1.75} />
        </Link>
      </div>
      <ProductGrid products={products} />
    </section>
  );
}
