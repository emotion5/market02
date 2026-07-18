import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "아이디 · 비밀번호 찾기 | MMM MARKET",
};

// TODO: 실제 고객센터 이메일 · 전화번호로 교체
const CONTACT_EMAIL = "help@mmm-market.com";
const CONTACT_PHONE = "02-000-0000";

export default function FindAccountPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>아이디 · 비밀번호 찾기</h1>
        <p className={styles.notice}>
          아이디 또는 비밀번호를 잊으셨나요?
          <br />
          아래 고객센터로 문의해주시면 <strong>영업일 1일 이내</strong>에
          본인 확인 후 안내해드립니다.
        </p>

        <ul className={styles.contacts}>
          <li className={styles.contact}>
            <Mail size={18} strokeWidth={1.75} className={styles.icon} />
            <div>
              <span className={styles.contactLabel}>이메일 문의</span>
              <a href={`mailto:${CONTACT_EMAIL}`} className={styles.contactValue}>
                {CONTACT_EMAIL}
              </a>
            </div>
          </li>
          <li className={styles.contact}>
            <Phone size={18} strokeWidth={1.75} className={styles.icon} />
            <div>
              <span className={styles.contactLabel}>전화 문의</span>
              <a href={`tel:${CONTACT_PHONE.replace(/-/g, "")}`} className={styles.contactValue}>
                {CONTACT_PHONE}
              </a>
              <span className={styles.contactHint}>평일 09:00 ~ 18:00</span>
            </div>
          </li>
        </ul>

        <p className={styles.guide}>
          로그인 아이디는 <strong>가입하신 이메일</strong>입니다. 문의 시{" "}
          <strong>가입 이메일</strong>(사업자회원은 <strong>상호</strong>도 함께)을
          알려주시면 본인 확인이 빠릅니다.
        </p>

        <Link href="/login" className={styles.backLink}>
          로그인으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
