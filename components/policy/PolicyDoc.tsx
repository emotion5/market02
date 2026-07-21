import type { ReactNode } from "react";
import styles from "./PolicyDoc.module.css";

// 약관·방침 문서 공용 셸 (제목 + 시행일 + 본문). (plain) 레이아웃 안에서 쓰인다.
export default function PolicyDoc({
  title,
  effectiveDate,
  children,
}: {
  title: string;
  effectiveDate: string;
  children: ReactNode;
}) {
  return (
    <main className={styles.wrap}>
      <article className={styles.doc}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.meta}>시행일: {effectiveDate}</p>
        <div className={styles.body}>{children}</div>
      </article>
    </main>
  );
}
