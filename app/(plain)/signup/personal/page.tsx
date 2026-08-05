"use client";

import { useState } from "react";
import Link from "next/link";
import { isValidPassword, PASSWORD_HINT } from "@/lib/password";
import OkCheck from "@/components/signup/OkCheck";
import AgreementConsent from "@/components/signup/AgreementConsent";
import styles from "../signup.module.css";

// 개인회원: 이메일을 아이디로, 서류·승인 없이 즉시 가입
export default function PersonalSignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // 약관·개인정보 동의(둘 다 필수). 새창으로 전문을 볼 수 있다.
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = isValidPassword(password);
  const canSubmit = emailValid && passwordValid && agreeTerms && agreePrivacy;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup/personal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "가입에 실패했습니다.");
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
          <h1 className={styles.title}>가입 완료</h1>
          <p className={styles.doneText}>
            개인회원 가입이 완료되었습니다.
            <br />
            로그인 후 이용하실 수 있습니다.
          </p>
          <Link href="/login" className={styles.homeLink}>
            로그인하러 가기
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
        <h1 className={styles.title}>개인회원 가입</h1>

        <form className={styles.form} onSubmit={handleSubmit}>
          <p className={styles.reqNote}>*필수 입력 항목</p>
          <label className={styles.field}>
            <span className={styles.label}>
              이메일 (아이디)<span className={styles.req}>*</span>
            </span>
            <div className={styles.inputRow}>
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
              <OkCheck show={emailValid} />
            </div>
            <span className={styles.hint}>
              {email.length > 0 && !emailValid
                ? "올바른 이메일 형식을 입력해주세요."
                : "이메일이 로그인 아이디로 사용됩니다."}
            </span>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>
              비밀번호<span className={styles.req}>*</span>
            </span>
            <div className={styles.inputRow}>
              <input
                type="password"
                className={styles.input}
                placeholder="8자 이상, 특수문자 포함"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                aria-invalid={password.length > 0 && !passwordValid}
                required
              />
              <OkCheck show={passwordValid} />
            </div>
            <span className={styles.hint}>{PASSWORD_HINT}</span>
          </label>

          <AgreementConsent
            agreeTerms={agreeTerms}
            agreePrivacy={agreePrivacy}
            setAgreeTerms={setAgreeTerms}
            setAgreePrivacy={setAgreePrivacy}
          />

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
            {submitting ? "가입 중…" : "가입하기"}
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
