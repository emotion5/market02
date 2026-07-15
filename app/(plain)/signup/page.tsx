import Link from "next/link";
import { CircleUser, Building2 } from "lucide-react";
import styles from "./signup.module.css";

export const metadata = { title: "회원가입 | MMM MARKET" };

// 회원 유형 선택: 개인(즉시 가입) / 사업자(승인 후 회원도매가)
export default function SignupPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>회원가입</h1>
        <p className={styles.subtitle}>회원 유형을 선택해주세요.</p>

        <div className={styles.choices}>
          <Link href="/signup/personal" className={styles.choice}>
            <CircleUser
              className={styles.choiceIcon}
              size={26}
              strokeWidth={1.5}
            />
            <span className={styles.choiceName}>개인회원</span>
            <span className={styles.choiceDesc}>이메일로 즉시 가입</span>
          </Link>

          <Link href="/signup/business" className={styles.choice}>
            <Building2
              className={styles.choiceIcon}
              size={26}
              strokeWidth={1.5}
            />
            <span className={styles.choiceName}>사업자회원</span>
            <span className={styles.choiceDesc}>
              사업자등록증 확인 후 승인 · 회원도매가 적용
            </span>
          </Link>
        </div>

        <div className={styles.links}>
          <Link href="/login" className={styles.link}>
            이미 계정이 있으신가요? 로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
