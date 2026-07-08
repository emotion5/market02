import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.brand}>MMM MARKET</p>
        <p className={styles.text}>인테리어 자재 온라인 스토어</p>
      </div>
    </footer>
  );
}
