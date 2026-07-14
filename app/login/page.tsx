"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

// 이메일을 공용 primary key로 사용 — 개인·사업자 구분 없이 이메일+비밀번호로 로그인
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 인증 연동 (email + password) — 현재는 UI만 구성
    alert("로그인 처리는 다음 단계에서 구현할 예정입니다.");
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>로그인</h1>

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

          <button type="submit" className={styles.submit}>
            로그인
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
