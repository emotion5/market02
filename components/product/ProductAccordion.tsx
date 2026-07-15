"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import styles from "./ProductAccordion.module.css";

export interface AccordionItem {
  title: string;
  content: React.ReactNode;
}

// 상세 정보 아코디언: 각 항목을 +/− 로 독립적으로 펼치고 접는다.
export default function ProductAccordion({ items }: { items: AccordionItem[] }) {
  const [open, setOpen] = useState<Record<number, boolean>>({});

  return (
    <div className={styles.accordion}>
      {items.map((item, i) => {
        const isOpen = !!open[i];
        return (
          <div key={item.title} className={styles.item}>
            <button
              type="button"
              className={styles.head}
              aria-expanded={isOpen}
              onClick={() => setOpen((prev) => ({ ...prev, [i]: !prev[i] }))}
            >
              <span className={styles.title}>{item.title}</span>
              {isOpen ? (
                <Minus size={18} strokeWidth={1.25} />
              ) : (
                <Plus size={18} strokeWidth={1.25} />
              )}
            </button>
            <div className={`${styles.panel} ${isOpen ? styles.panelOpen : ""}`}>
              <div className={styles.panelInner}>
                <div className={styles.content}>{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
