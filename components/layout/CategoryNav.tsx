import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import styles from "./CategoryNav.module.css";

export default function CategoryNav() {
  return (
    <nav className={styles.nav}>
      <ul className={styles.list}>
        {CATEGORIES.map((category) => (
          <li key={category.slug}>
            <Link href={`/category/${category.slug}`} className={styles.link}>
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
