"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

const STORAGE_KEY = "market02-profile";

interface Profile {
  company: string;
  manager: string;
  tel: string;
  email: string;
}

const EMPTY: Profile = { company: "", manager: "", tel: "", email: "" };

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [password, setPassword] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setProfile(JSON.parse(raw));
    } catch {
      // 저장된 값이 없거나 깨져 있으면 빈 값 유지
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 백엔드 연동 (회원정보/비밀번호 변경) — 현재는 localStorage에만 저장
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    setPassword("");
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  const update = (key: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setProfile((p) => ({ ...p, [key]: e.target.value }));

  return (
    <div>
      <div className={styles.head}>
        <h2 className={styles.heading}>회원정보 수정</h2>
        <p className={styles.subnote}>
          아이디(사업자등록번호)는 변경할 수 없습니다.
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>아이디 (사업자등록번호)</label>
          <span className={styles.readonly}>가입 시 등록된 사업자등록번호</span>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>상호</label>
          <input
            className={styles.input}
            value={profile.company}
            onChange={update("company")}
            placeholder="회사명"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>담당자</label>
          <input
            className={styles.input}
            value={profile.manager}
            onChange={update("manager")}
            placeholder="담당자명"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>연락처</label>
          <input
            className={styles.input}
            value={profile.tel}
            onChange={update("tel")}
            placeholder="연락처"
            inputMode="tel"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>이메일</label>
          <input
            className={styles.input}
            type="email"
            value={profile.email}
            onChange={update("email")}
            placeholder="이메일"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>새 비밀번호</label>
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="변경 시에만 입력"
            autoComplete="new-password"
          />
        </div>

        <div className={styles.actions}>
          {saved && <span className={styles.savedMsg}>저장되었습니다.</span>}
          <button type="submit" className={styles.submit}>
            변경 사항 저장
          </button>
        </div>
      </form>
    </div>
  );
}
