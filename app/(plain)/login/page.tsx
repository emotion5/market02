"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgePercent,
  FileText,
  MessageCircle,
  ReceiptText,
  Truck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import styles from "./page.module.css";

// 로그인/가입 유도용 혜택 배너 — 링크 없는 안내 문구. 카피는 실제 제공 기능 기준.
const BENEFITS = [
  { icon: BadgePercent, label: "사업자회원 전용", value: "회원도매가 적용" },
  { icon: FileText, label: "담고 바로", value: "A4 견적서 즉시 발행" },
  { icon: ReceiptText, label: "세무 처리 간편", value: "전자세금계산서 발행" },
  { icon: Truck, label: "오늘출발 상품", value: "실시간 배송조회" },
];

// 이메일을 공용 primary key로 사용 — 개인·사업자 구분 없이 이메일+비밀번호로 로그인
export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (result.ok) {
      // proxy 가 붙인 ?redirect= 로 복귀, 없으면 홈으로
      const redirect = new URLSearchParams(window.location.search).get(
        "redirect",
      );
      router.push(redirect && redirect.startsWith("/") ? redirect : "/");
    } else {
      setError(result.error ?? "로그인에 실패했습니다.");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>로그인</h1>
          <p className={styles.subtitle}>
            아직 회원이 아니신가요? 회원가입하면 회원도매가로
            <br />
            견적부터 주문까지 간편하게 이용하실 수 있어요.
          </p>
          <Link href="/signup" className={styles.signupCta}>
            1분이면 끝나는 회원가입 →
          </Link>
        </header>

        <ul className={styles.benefits} aria-label="회원 혜택 안내">
          {BENEFITS.map(({ icon: Icon, label, value }) => (
            <li key={value} className={styles.benefit}>
              <Icon
                className={styles.benefitIcon}
                size={24}
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <span className={styles.benefitLabel}>{label}</span>
              <span className={styles.benefitValue}>{value}</span>
            </li>
          ))}
        </ul>

        <div className={styles.kakaoBanner}>
          <MessageCircle size={16} strokeWidth={0} fill="#3C1E1E" aria-hidden="true" />
          <span>카카오톡 채널 추가하기</span>
        </div>
        <p className={styles.kakaoNote}>
          채널을 추가하면 신규 제품 · 특가 제품 소식을 가장 먼저 받아보실 수 있어요.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>이메일</span>
            <input
              type="email"
              className={styles.input}
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>비밀번호</span>
            <input
              type="password"
              className={styles.input}
              placeholder="비밀번호를 입력해주세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error && (
            <p
              role="alert"
              style={{ color: "#c0392b", fontSize: "0.85rem", margin: 0 }}
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            className={styles.submit}
            disabled={submitting}
          >
            {submitting ? "로그인 중…" : "로그인"}
          </button>
        </form>

        <div className={styles.links}>
          <Link href="/signup" className={styles.link}>
            회원가입
          </Link>
          <span className={styles.divider} aria-hidden="true">
            ·
          </span>
          <Link href="/find-account" className={styles.link}>
            아이디 · 비밀번호 찾기
          </Link>
        </div>
      </div>
    </div>
  );
}
