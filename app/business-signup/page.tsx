"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

// 사업자등록번호 10자리를 000-00-00000 형태로 표시
function formatBizNo(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  const parts = [digits.slice(0, 3), digits.slice(3, 5), digits.slice(5, 10)];
  return parts.filter(Boolean).join("-");
}

export default function BusinessSignupPage() {
  const [bizNo, setBizNo] = useState("");
  const [password, setPassword] = useState("");
  const [license, setLicense] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // 숫자만 10자리인지 검사 (아이디 = 사업자등록번호)
  const bizDigits = bizNo.replace(/\D/g, "");
  const bizValid = bizDigits.length === 10;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bizValid) return;
    // TODO: 백엔드 연동 (사업자등록번호를 아이디로 저장·비밀번호 해시·사업자등록증 업로드) — 현재는 UI만 구성
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>가입 신청 완료</h1>
          <p className={styles.doneText}>
            기업회원 가입 신청이 접수되었습니다.
            <br />
            제출하신 자료를 확인한 뒤{" "}
            <strong>영업일 1일 이내</strong>에 승인 처리됩니다.
          </p>
          <Link href="/" className={styles.homeLink}>
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>기업회원 가입</h1>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>사업자등록번호 (아이디)</span>
            <input
              type="text"
              inputMode="numeric"
              className={styles.input}
              placeholder="000-00-00000"
              value={bizNo}
              onChange={(e) => setBizNo(formatBizNo(e.target.value))}
              autoComplete="username"
              aria-invalid={bizNo.length > 0 && !bizValid}
              required
            />
            <span className={styles.hint}>
              {bizNo.length > 0 && !bizValid
                ? "사업자등록번호 10자리를 정확히 입력해주세요."
                : "사업자등록번호가 로그인 아이디로 사용됩니다."}
            </span>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>비밀번호</span>
            <input
              type="password"
              className={styles.input}
              placeholder="비밀번호를 입력해주세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>사업자등록증</span>
            <input
              type="file"
              className={styles.file}
              accept="image/*,application/pdf"
              onChange={(e) => setLicense(e.target.files?.[0] ?? null)}
              required
            />
            <span className={styles.hint}>
              {license
                ? `선택된 파일: ${license.name}`
                : "이미지 또는 PDF 파일을 업로드해주세요."}
            </span>
          </label>

          <p className={styles.approval} role="note">
            자료 입력 후 <strong>영업일 1일 이내</strong>에 승인됩니다.
          </p>

          <button type="submit" className={styles.submit} disabled={!bizValid}>
            가입 신청
          </button>
        </form>

        <div className={styles.links}>
          <Link href="/login" className={styles.link}>
            이미 계정이 있으신가요? 로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
