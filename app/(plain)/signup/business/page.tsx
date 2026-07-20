"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "../signup.module.css";

// 사업자등록번호 10자리를 000-00-00000 형태로 표시
function formatBizNo(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  const parts = [digits.slice(0, 3), digits.slice(3, 5), digits.slice(5, 10)];
  return parts.filter(Boolean).join("-");
}

// 사업자회원: 이메일을 아이디로, 사업자등록번호·등록증으로 확인 후 승인
export default function BusinessSignupPage() {
  const [email, setEmail] = useState("");
  const [bizNo, setBizNo] = useState("");
  const [password, setPassword] = useState("");
  const [license, setLicense] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 이메일이 계정의 primary key(아이디·연락 수단)
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  // 사업자등록번호는 사업자 확인용 (숫자 10자리)
  const bizDigits = bizNo.replace(/\D/g, "");
  const bizValid = bizDigits.length === 10;
  const canSubmit = emailValid && bizValid && password.length > 0 && !!license;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !license) return;
    setError("");
    setSubmitting(true);
    try {
      // 사업자등록증 파일을 가입 필드와 함께 multipart 로 전송.
      // FormData 사용 시 content-type 헤더는 브라우저가 boundary 와 함께 자동 설정하므로 지정하지 않는다.
      const form = new FormData();
      form.set("email", email);
      form.set("password", password);
      form.set("bizNo", bizNo);
      form.set("license", license);
      const res = await fetch("/api/auth/signup/business", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "가입 신청에 실패했습니다.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>가입 신청 완료</h1>
          <p className={styles.doneText}>
            사업자회원 가입 신청이 접수되었습니다.
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
        <Link href="/signup" className={styles.back}>
          ← 회원 유형 선택
        </Link>
        <h1 className={styles.title}>사업자회원 가입</h1>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>이메일 (아이디)</span>
            <input
              type="email"
              className={styles.input}
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              aria-invalid={email.length > 0 && !emailValid}
              required
            />
            <span className={styles.hint}>
              {email.length > 0 && !emailValid
                ? "올바른 이메일 형식을 입력해주세요."
                : "이메일이 로그인 아이디로 사용됩니다."}
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
            <span className={styles.label}>사업자등록번호</span>
            <input
              type="text"
              inputMode="numeric"
              className={styles.input}
              placeholder="000-00-00000"
              value={bizNo}
              onChange={(e) => setBizNo(formatBizNo(e.target.value))}
              autoComplete="off"
              aria-invalid={bizNo.length > 0 && !bizValid}
              required
            />
            <span className={styles.hint}>
              {bizNo.length > 0 && !bizValid
                ? "사업자등록번호 10자리를 정확히 입력해주세요."
                : "사업자 확인용입니다."}
            </span>
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
            disabled={!canSubmit || submitting}
          >
            {submitting ? "신청 중…" : "가입 신청"}
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
