"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

interface Profile {
  email: string;
  name: string | null;
  tel: string | null;
  type: "PERSONAL" | "BUSINESS";
  bizNo: string | null;
  company: string | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [tel, setTel] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me/profile", { cache: "no-store" });
        if (res.ok) {
          const { profile } = (await res.json()) as { profile: Profile };
          setProfile(profile);
          setName(profile.name ?? "");
          setTel(profile.tel ?? "");
          setCompany(profile.company ?? "");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const isBusiness = profile?.type === "BUSINESS";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSubmitting(true);
    const payload: Record<string, string> = { name, tel };
    if (isBusiness) payload.company = company;
    if (password) payload.newPassword = password;
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "저장에 실패했습니다.");
        return;
      }
      setProfile(data.profile);
      setPassword("");
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.head}>
        <p className={styles.subnote}>불러오는 중…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.head}>
        <h2 className={styles.heading}>회원정보 수정</h2>
        <p className={styles.subnote}>로그인이 필요합니다.</p>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.head}>
        <h2 className={styles.heading}>회원정보 수정</h2>
        <p className={styles.subnote}>
          아이디(이메일){isBusiness ? " · 사업자등록번호" : ""}는 변경할 수
          없습니다.
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>아이디 (이메일)</label>
          <span className={styles.readonly}>{profile.email}</span>
        </div>

        {isBusiness && (
          <div className={styles.field}>
            <label className={styles.label}>사업자등록번호</label>
            <span className={styles.readonly}>{profile.bizNo}</span>
          </div>
        )}

        {isBusiness && (
          <div className={styles.field}>
            <label className={styles.label}>상호</label>
            <input
              className={styles.input}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="회사명"
            />
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label}>{isBusiness ? "담당자" : "이름"}</label>
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isBusiness ? "담당자명" : "이름"}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>연락처</label>
          <input
            className={styles.input}
            value={tel}
            onChange={(e) => setTel(e.target.value)}
            placeholder="연락처"
            inputMode="tel"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>새 비밀번호</label>
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="변경 시에만 입력 (8자 이상)"
            autoComplete="new-password"
          />
        </div>

        <div className={styles.actions}>
          {error && (
            <span style={{ color: "#c0392b", fontSize: "0.85rem" }}>
              {error}
            </span>
          )}
          {saved && <span className={styles.savedMsg}>저장되었습니다.</span>}
          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? "저장 중…" : "변경 사항 저장"}
          </button>
        </div>
      </form>
    </div>
  );
}
