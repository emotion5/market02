"use client";

import { useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import type { Product } from "@/lib/types";
import ProductGrid from "./ProductGrid";
import ProductListItem from "./ProductListItem";
import styles from "./ProductListing.module.css";

type View = "card" | "list";

export default function ProductListing({ products }: { products: Product[] }) {
  const [view, setView] = useState<View>("card");

  if (products.length === 0) {
    return <p className={styles.empty}>등록된 상품이 없습니다.</p>;
  }

  return (
    <div>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={`${styles.viewButton} ${
            view === "list" ? styles.active : ""
          }`}
          onClick={() => setView("list")}
          aria-label="리스트 보기"
          aria-pressed={view === "list"}
          title="리스트 보기"
        >
          <List size={18} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          className={`${styles.viewButton} ${
            view === "card" ? styles.active : ""
          }`}
          onClick={() => setView("card")}
          aria-label="카드 보기"
          aria-pressed={view === "card"}
          title="카드 보기"
        >
          <LayoutGrid size={18} strokeWidth={1.75} />
        </button>
      </div>

      {view === "card" ? (
        <ProductGrid products={products} />
      ) : (
        <ul className={styles.list}>
          {products.map((product) => (
            <ProductListItem key={product.id} product={product} />
          ))}
        </ul>
      )}
    </div>
  );
}
