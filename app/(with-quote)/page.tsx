import { getFeaturedSections } from "@/lib/data";
import BannerCarousel from "@/components/home/BannerCarousel";
import FeaturedSection from "@/components/home/FeaturedSection";
import styles from "./listing.module.css";

export default async function HomePage() {
  const sections = await getFeaturedSections();

  return (
    <div className={styles.home}>
      <BannerCarousel />
      {sections.map((section) => (
        <FeaturedSection key={section.category.slug} section={section} />
      ))}
    </div>
  );
}
