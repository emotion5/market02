import { getFeaturedSections } from "@/lib/data";
import FeaturedSection from "@/components/home/FeaturedSection";
import styles from "./listing.module.css";

export default async function HomePage() {
  const sections = await getFeaturedSections();

  return (
    <div className={styles.home}>
      <header className={styles.hero}>
        <h1 className={styles.heroTitle}>Products</h1>
      </header>
      {sections.map((section) => (
        <FeaturedSection key={section.category.slug} section={section} />
      ))}
    </div>
  );
}
