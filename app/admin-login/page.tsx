"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import styles from "./page.module.css";

// 관리자 전용 로그인 화면(별도 입구). 로그인 API·역할가드는 손님용과 동일하게 재사용하고,
// 여기서는 성공 후 ADMIN 인지 확인해 관리자 화면으로 보낸다. (메인 /login 으로도 로그인 가능)
export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "로그인에 실패했습니다.");
        return;
      }
      if (data.user?.role !== "ADMIN") {
        setError("관리자 권한이 없는 계정입니다.");
        return;
      }
      router.push("/admin/members");
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.brand}>
          <ShieldCheck size={22} strokeWidth={1.75} />
          MMM 관리자
        </div>
        <h1 className={styles.title}>관리자 로그인</h1>

        <label className={styles.field}>
          <span className={styles.label}>이메일</span>
          <input
            type="email"
            className={styles.input}
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className={styles.submit}
          disabled={submitting || !email || !password}
        >
          {submitting ? "로그인 중…" : "로그인"}
        </button>
      </form>
    </div>
  );
}
